from rest_framework import permissions, status
from django.contrib.auth.models import User
from chat_app.models import Message
from rest_framework.generics import CreateAPIView
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from chat_app.authentication import BearerAuthentication
from django.db.models import Q
from rest_framework.response import Response

from chat_app.serializers import MessageSerializer


class MessageView(CreateAPIView):
    serializer_class = MessageSerializer

    def post(self, request, *args, **kwargs):
        user = User.objects.get(pk=1)
        print(user.sender)
        return self.create(request, *args, **kwargs)


class ReadMessageView(CreateAPIView):
    authentication_classes = [SessionAuthentication,
                              BasicAuthentication, BearerAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, username):
        try:
            # Oturum açmış kullanıcıyı al
            user = request.user

            # Kullanıcının aldığı mesajları filtrele
            messages = Message.objects.filter(
                Q(sender__username=username, receiver=user),
                read=False  # Sadece okunmamış mesajları al
            )

            # Mesajları read=True olarak güncelle
            updated_count = messages.update(read=True)

            return Response({
                "message": f"{updated_count} messages marked as read.",
                "success": True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": "An error occurred while marking messages as read.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
