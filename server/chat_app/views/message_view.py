from rest_framework import permissions, status
from chat_app.models import Message
from rest_framework.generics import CreateAPIView
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from chat_app.authentication import BearerAuthentication
from django.db.models import Q
from rest_framework.response import Response

from chat_app.serializers import MessageSerializer
from django.contrib.auth import get_user_model

# Kullanıcı modelini getirme
User = get_user_model()


class MessageView(CreateAPIView):
    serializer_class = MessageSerializer

    def post(self, request, *args, **kwargs):
        try:
            # Receiver UUID'yi isteğin body kısmından alıyoruz
            receiver_id = request.data.get('receiver')
            if not receiver_id:
                return Response({
                    "error": "Receiver ID is required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Receiver kullanıcıyı alıyoruz
            user = User.objects.get(pk=receiver_id)
            print(f"Receiver found: {user.username}")
            return self.create(request, *args, **kwargs)
        except User.DoesNotExist:
            error_message = f"User with primary key {receiver_id} does not exist."
            print(error_message)
            return Response({
                "error": error_message
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"An error occurred: {e}")
            return Response({
                "error": "An error occurred while processing the request.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
