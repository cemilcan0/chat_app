import datetime

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import serializers

from chat_app.models import Message, Friendship, User

from chat_app.models import Message

from rest_framework import serializers
from chat_app.models import ChatGroup, GroupMessage


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatGroup
        fields = ('id', 'name', 'description',
                  'admin', 'members', 'created_at')
        read_only_fields = ('admin', 'created_at')


class GroupMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMessage
        fields = ('group', 'sender', 'text', 'date_time')


class MessageSerializer(serializers.Serializer):
    text = serializers.CharField()
    receiver = serializers.SlugField(write_only=True)

    def create(self, validated_data):
        try:
            user = User.objects.get(username=validated_data['receiver'])
            message = Message()
            message.text = validated_data['text']
            message.sender = self.context['request'].user
            message.receiver = user
            message.save()
            # __broadcast yerine _broadcast kullanıyoruz
            self._broadcast(message)
            return validated_data
        except User.DoesNotExist:
            raise serializers.ValidationError({'receiver': 'User not found.'})
        except Exception as e:
            raise serializers.ValidationError({'error': str(e)})

    def _broadcast(self, message: Message):
        serializer = MessageModelSerializer(message, many=False)
        n_message = serializer.data
        n_message['read'] = False
        print(n_message)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'chat_%s' % message.receiver.username, {
                'type': 'new_message',
                'message': n_message
            }
        )


class MessageModelSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(read_only=True, source='sender.username')
    read = serializers.BooleanField(default=True)

    class Meta:
        model = Message
        fields = ('text', 'sender', 'date_time', 'read')


class UsersWithMessageSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    photo = serializers.ImageField(source='profile.photo')
    online = serializers.BooleanField(source='profile.online')
    status = serializers.CharField(source='profile.status')
    messages = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('name', 'username', 'photo', 'online', 'status', 'messages')

    def get_name(self, obj):
        if obj.first_name:
            return obj.get_full_name()
        return obj.username

    def get_messages(self, obj):
        messages = Message.objects.filter(
            Q(receiver=obj, sender=self.context['request'].user) |
            Q(sender=obj, receiver=self.context['request'].user)).prefetch_related('sender', 'receiver')
        serializer = MessageModelSerializer(
            messages.order_by('date_time'), many=True)
        return serializer.data


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    photo = serializers.ImageField(source='profile.photo')
    online = serializers.BooleanField(source='profile.online')
    status = serializers.CharField(source='profile.status')
    messages = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('name', 'username', 'photo', 'online', 'status', 'messages')

    def get_name(self, obj):
        if obj.first_name:
            return obj.get_full_name()
        return obj.username

    def get_messages(self, obj):
        return []


class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "password", "first_name", "last_name", "email")
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        user = super(RegistrationSerializer, self).create(validated_data)
        self.__notify_others(user)
        return validated_data

    def __notify_others(self, user):
        serializer = UserSerializer(user, many=False)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'notification', {
                'type': 'new_user_notification',
                'message': serializer.data
            }
        )


class FriendsWithLastMessageSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    photo = serializers.ImageField(source='to_user.profile.photo')
    online = serializers.BooleanField(source='to_user.profile.online')
    status = serializers.CharField(source='to_user.profile.status')
    username = serializers.CharField(source='to_user.username')
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ('name', 'username', 'photo',
                  'online', 'status', 'last_message')

    def get_name(self, obj):
        if obj.to_user.first_name:
            return f"{obj.to_user.first_name} {obj.to_user.last_name}"
        return obj.to_user.username

    def get_last_message(self, obj):
        last_message = Message.objects.filter(
            Q(sender=obj.to_user, receiver=self.context['request'].user) |
            Q(sender=self.context['request'].user, receiver=obj.to_user)
        ).order_by('-date_time').first()
        if last_message:
            return {
                "text": last_message.text,
                "date_time": last_message.date_time,
            }
        return None
