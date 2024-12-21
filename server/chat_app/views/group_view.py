# views/group_view.py

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from chat_app.models import ChatGroup
from chat_app.serializers import GroupSerializer
from django.contrib.auth.models import User

from chat_app.models import ChatGroup, Friendship, User

class CreateGroupView(generics.CreateAPIView):
    queryset = ChatGroup.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)

class AddGroupMemberView(generics.UpdateAPIView):
    queryset = ChatGroup.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        group = self.get_object()
        username = request.data.get("username")

        try:
            user = User.objects.get(username=username)
            if not Friendship.objects.filter(from_user=request.user, to_user=user, status='accepted').exists() and not Friendship.objects.filter(from_user=user, to_user=request.user, status='accepted').exists():
                return Response({"error": "You can only add friends to the group."}, status=status.HTTP_400_BAD_REQUEST)
            
            group.members.add(user)
            return Response({"message": f"{username} has been added to the group."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
