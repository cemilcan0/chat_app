from rest_framework import generics, permissions, status
from rest_framework.response import Response
from chat_app.models import Friendship, User
from rest_framework.views import APIView
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from chat_app.authentication import BearerAuthentication
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from chat_app.serializers import FriendsWithLastMessageSerializer, BaseUserSerializer


def send_notification(user, message_type, message_content):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'notification', {
            'type': message_type,
            'message': message_content
        }
    )


class FriendsView(generics.ListAPIView):
    serializer_class = FriendsWithLastMessageSerializer
    authentication_classes = [SessionAuthentication,
                              BasicAuthentication, BearerAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Kullanıcı hem from_user hem de to_user olarak arkadaşlık ilişkilerinde olabilir
        from_user_friends = Friendship.objects.filter(
            from_user=self.request.user, status='accepted'
        ).values_list('to_user', flat=True)

        to_user_friends = Friendship.objects.filter(
            to_user=self.request.user, status='accepted'
        ).values_list('from_user', flat=True)

        # Tüm arkadaşlıkları birleştir
        friend_ids = list(from_user_friends) + list(to_user_friends)
        return User.objects.filter(id__in=friend_ids)


class SendFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")  # Kullanıcı adı alınacak
        try:
            # Kullanıcı adıyla sorgula
            to_user = User.objects.get(username=username)
            friendship, created = Friendship.objects.get_or_create(
                from_user=request.user, to_user=to_user)
            if created:
                # Bildirim gönder
                send_notification(to_user, 'new_friend_request', {
                    'from_user': request.user.username,
                    'message': 'You have a new friend request.'
                })
                return Response({"message": "Friend request sent."}, status=status.HTTP_201_CREATED)
            else:
                return Response({"message": "Friend request already sent."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class AcceptFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")  # Kullanıcı adı alınacak
        try:
            # Kullanıcı adıyla sorgula
            from_user = User.objects.get(username=username)
            friendship = Friendship.objects.get(
                from_user=from_user, to_user=request.user, status='pending')
            friendship.status = 'accepted'
            friendship.save()

            # Bildirim gönder
            send_notification(from_user, 'friend_request_accepted', {
                'to_user': request.user.username,
                'message': 'Your friend request has been accepted.'
            })
            return Response({"message": "Friend request accepted."}, status=status.HTTP_200_OK)
        except (User.DoesNotExist, Friendship.DoesNotExist):
            return Response({"error": "Friend request not found."}, status=status.HTTP_404_NOT_FOUND)


class DeclineFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")  # Kullanıcı adı alınacak
        try:
            # Kullanıcı adıyla sorgula
            from_user = User.objects.get(username=username)
            friendship = Friendship.objects.get(
                from_user=from_user, to_user=request.user, status='pending')
            friendship.delete()  # İsteği silerek reddet
            return Response({"message": "Friend request declined."}, status=status.HTTP_200_OK)
        except (User.DoesNotExist, Friendship.DoesNotExist):
            return Response({"error": "Friend request not found."}, status=status.HTTP_404_NOT_FOUND)


class PendingFriendRequestsView(generics.ListAPIView):
    serializer_class = BaseUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        pending_requests = Friendship.objects.filter(
            to_user=self.request.user, status='pending'
        ).select_related('from_user__profile').values_list('from_user', flat=True)
        return User.objects.filter(id__in=pending_requests)
