    # consumers/group_consumer.py

from channels.generic.websocket import AsyncWebsocketConsumer
import json
from chat_app.models import ChatGroup, GroupMessage
from asgiref.sync import sync_to_async

class GroupConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.group_name = f'group_{self.group_id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender_username = self.scope['user'].username

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender_username
            }
        )

        await sync_to_async(GroupMessage.objects.create)(
            group_id=self.group_id,
            sender=self.scope['user'],
            text=message
        )

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender
        }))
