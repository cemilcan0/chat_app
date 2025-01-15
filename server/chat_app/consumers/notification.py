import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from django.contrib.auth import get_user_model

# Kullanıcı modelini getirme
User = get_user_model()


class NewUserConsumer(WebsocketConsumer):
    def connect(self):
        # URL'den gelen 'id'yi al
        user_id = self.scope['url_route']['kwargs']['id']
        self.room_name = 'new_user'
        self.room_group_name = 'notification'

        try:
            # Kullanıcıyı sorgula
            self.user = User.objects.get(pk=user_id)
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
                        # UUID'yi stringe dönüştürüyoruz
                        'id': str(self.user.id),
                        'username': self.user.username,
                        'online': True
                    }
                }
            )

        except User.DoesNotExist:
            print(f"No user found with ID: {user_id}")
            self.close()  # Kullanıcı bulunamazsa bağlantıyı kapat

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
                        # UUID'yi stringe dönüştürüyoruz
                        'id': str(self.user.id),
                        'username': self.user.username,
                        'online': False
                    }
                }
            )

        # Grubun dışına çıkar
        if hasattr(self, 'room_group_name'):
            async_to_sync(self.channel_layer.group_discard)(
                self.room_group_name,
                self.channel_name
            )
        print(f"WebSocket disconnected: {self.channel_name}")

    def receive(self, text_data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {
                'type': 'new_user_notification',
                'message': json.loads(text_data)['message']
            }
        )

    def user_status_change(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'type': 'user_status_change',
            'message': message
        }))

    def new_friend_request(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'type': 'new_friend_request',
            'message': message
        }))

    def friend_request_accepted(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'type': 'friend_request_accepted',
            'message': message
        }))
