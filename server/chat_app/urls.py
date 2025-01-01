from django.urls import path

from chat_app.views.auth_view import *
from rest_framework.authtoken import views

from chat_app.views.call_view import StartCall, EndCall
from chat_app.views.message_view import MessageView
from config import settings
from chat_app.views.friendship_view import SendFriendRequestView, AcceptFriendRequestView, FriendsView, DeclineFriendRequestView, PendingFriendRequestsView


from chat_app.views.group_view import CreateGroupView, AddGroupMemberView


urlpatterns = [
    path('api-token-auth/', views.obtain_auth_token),
    path('login/', Login.as_view()),
    path('registration/', RegisterView.as_view()),
    path('logout/', LogOutView.as_view()),
    path('users/', UsersView.as_view()),
    path('message/', MessageView.as_view()),
    path('start-call/', StartCall.as_view()),
    path('end-call/', EndCall.as_view()),
    path('test-socket/', test_socket),
    path('create-group/', CreateGroupView.as_view(), name='create-group'),
    path('add-group-member/<int:pk>/', AddGroupMemberView.as_view(), name='add-group-member'),
    path('friends/', FriendsView.as_view(), name='friends'),
    path('send-friend-request/', SendFriendRequestView.as_view(), name='send-friend-request'),
    path('accept-friend-request/', AcceptFriendRequestView.as_view(), name='accept-friend-request'),
    path('decline-friend-request/', DeclineFriendRequestView.as_view(), name='decline-friend-request'),
    path('pending-friend-requests/', PendingFriendRequestsView.as_view(), name='pending-friend-requests'),
]
