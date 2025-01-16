import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth import get_user_model

# Kullanıcı modelini getirme
User = get_user_model()


class MessageConsumer(WebsocketConsumer):
    def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['id']
        self.room_group_name = f'chat_{self.user_id}'
        print(self.user_id, self.room_group_name)

        try:
            # Kullanıcıyı sorgula
            self.user = User.objects.get(pk=self.user_id)
            print(f"User found: {self.user.username} (ID: {self.user.id})")

            # Kullanıcıyı online olarak işaretle ve kaydet
            self.user.profile.online = True
            self.user.profile.save()

            # Kullanıcının online olduğunu gruba bildir
            async_to_sync(self.channel_layer.group_add)(
                self.room_group_name,
                self.channel_name
            )
            self.accept()

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {
                    'type': 'user_status_change',
                    'message': {
                        'id': str(self.user.id),
                        'username': self.user.username,
                        'online': True
                    }
                }
            )
        except User.DoesNotExist:
            print(f"No user found with ID: {self.user_id}")
            self.close()  # Kullanıcı bulunamazsa bağlantıyı kapat

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

    def disconnect(self, code):
        # Kullanıcıyı offline olarak işaretle ve kaydet
        if hasattr(self, 'user'):
            self.user.profile.online = False
            self.user.profile.save()

            # Kullanıcının offline olduğunu gruba bildir
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {
                    'type': 'user_status_change',
                    'message': {
                        'id': str(self.user.id),
                        'username': self.user.username,
                        'online': False
                    }
                }
            )

        # Grubun dışına çıkar
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.channel_name}")
