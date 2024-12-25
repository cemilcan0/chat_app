from rest_framework import generics, permissions, status
from rest_framework.response import Response
from chat_app.models import Friendship, User
from rest_framework.views import APIView
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from chat_app.authentication import BearerAuthentication

from chat_app.serializers import FriendsWithLastMessageSerializer


class SendFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        to_user_id = request.data.get("to_user_id")
        try:
            to_user = User.objects.get(pk=to_user_id)
            friendship, created = Friendship.objects.get_or_create(
                from_user=request.user, to_user=to_user)
            if created:
                return Response({"message": "Friend request sent."}, status=status.HTTP_201_CREATED)
            else:
                return Response({"message": "Friend request already sent."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class AcceptFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from_user_id = request.data.get("from_user_id")
        try:
            from_user = User.objects.get(pk=from_user_id)
            friendship = Friendship.objects.get(
                from_user=from_user, to_user=request.user, status='pending')
            friendship.status = 'accepted'
            friendship.save()
            return Response({"message": "Friend request accepted."}, status=status.HTTP_200_OK)
        except (User.DoesNotExist, Friendship.DoesNotExist):
            return Response({"error": "Friend request not found."}, status=status.HTTP_404_NOT_FOUND)


class FriendsView(generics.ListAPIView):
    serializer_class = FriendsWithLastMessageSerializer
    authentication_classes = [SessionAuthentication,
                              BasicAuthentication, BearerAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        friends = Friendship.objects.filter(
            from_user=self.request.user, status='accepted'
        ).select_related('to_user__profile')
        return friends
