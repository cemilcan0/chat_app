import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class MessageConsumer(WebsocketConsumer):
    def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['id']
        self.room_group_name = f'chat_{self.user_id}'
        print(self.user_id, self.room_group_name)

        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def receive(self, text_data):
        data = json.loads(text_data)
        call_type = data.get('type')
        message = data.get('message')

        if call_type == 'call_request':
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {
                    'type': 'new_call',
                    'message': message
                }
            )
        elif call_type == 'user_online':
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {
                    'type': 'user_online',
                    'message': message
                }
            )

    def new_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'message': message,
            'status': 'new_message'
        }))

    def new_call(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'message': message,
            'status': 'new_call'
        }))

    def end_call(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'message': message,
            'status': 'end_call'
        }))

    def new_friendship_request(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'message': message,
            'status': 'new_friendship_request'
        }))

    def accepted_friendship_request(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'message': message,
            'status': 'accepted_friendship_request'
        }))

    def user_online(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'message': message,
            'status': 'user_online'
        }))

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
