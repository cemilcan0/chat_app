"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/asgi/
"""

import os
import django  # Django'yu açıkça başlatacağız

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()  # Bu satır, AppRegistry'nin yüklenmesini sağlar

from chat_app import ws_urls  # ws_urls import'u buraya taşıdık

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # HTTP istekleri
    "websocket": AuthMiddlewareStack(
        URLRouter(ws_urls.websocket_urlpatterns)  # WebSocket URL'lerini yönlendir
    )
})
