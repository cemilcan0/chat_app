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


class BaseUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    photo = serializers.ImageField(source='profile.photo')
    online = serializers.BooleanField(source='profile.online')
    status = serializers.CharField(source='profile.status')

    class Meta:
        model = User
        fields = ('name', 'username', 'photo', 'online', 'status')

    def get_name(self, obj):
        if obj.first_name:
            return obj.get_full_name()
        return obj.username


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
    read = serializers.BooleanField()

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


class UserSerializer(BaseUserSerializer):
    messages = serializers.SerializerMethodField()

    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + ('messages',)

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
    photo = serializers.ImageField(source='profile.photo')
    online = serializers.BooleanField(source='profile.online')
    status = serializers.CharField(source='profile.status')
    messages = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('name', 'username', 'photo', 'online',
                  'status', 'messages', 'last_message')

    def get_name(self, obj):
        if obj.first_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username

    def get_messages(self, obj):
        # Mesajları getir
        messages = Message.objects.filter(
            Q(sender=obj, receiver=self.context['request'].user) |
            Q(sender=self.context['request'].user, receiver=obj)
        ).order_by('date_time')
        serializer = MessageModelSerializer(messages, many=True)
        return serializer.data

    def get_last_message(self, obj):
        # Son mesajı getir
        last_message = Message.objects.filter(
            Q(sender=obj, receiver=self.context['request'].user) |
            Q(sender=self.context['request'].user, receiver=obj)
        ).order_by('-date_time').first()
        if last_message:
            return {
                "text": last_message.text,
                "date_time": last_message.date_time,
            }
        return None


class EditProfileSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="profile.status", required=False)
    photo = serializers.ImageField(source="profile.photo", required=False)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "status", "photo"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        instance.first_name = validated_data.get(
            "first_name", instance.first_name)
        instance.last_name = validated_data.get(
            "last_name", instance.last_name)
        instance.save()

        # Profile alanlarını güncelle
        profile = instance.profile
        profile.status = profile_data.get("status", profile.status)
        if "photo" in profile_data:
            profile.photo = profile_data["photo"]
        profile.save()

        return instance
