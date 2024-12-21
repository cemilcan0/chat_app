from django.urls import path

from chat_app.consumers.message import MessageConsumer
from chat_app.consumers.notification import NewUserConsumer
from chat_app.consumers.group_consumer import GroupConsumer


websocket_urlpatterns = [
    path('ws/notification/', NewUserConsumer.as_asgi()),
    path('ws/group/<int:group_id>/', GroupConsumer.as_asgi()),
    path('ws/message/<str:username>/', MessageConsumer.as_asgi())
]
