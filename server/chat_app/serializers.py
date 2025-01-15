import datetime

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth.hashers import make_password
from django.db.models import Q
from rest_framework import serializers

from chat_app.models import Message, Friendship, User

from chat_app.models import Message

from rest_framework import serializers
from chat_app.models import ChatGroup, GroupMessage
from django.contrib.auth import get_user_model

# Kullanıcı modelini getirme
User = get_user_model()


class BaseUserSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='pk', read_only=True)
    name = serializers.SerializerMethodField()
    photo = serializers.ImageField(source='profile.photo')
    online = serializers.BooleanField(source='profile.online')
    status = serializers.CharField(source='profile.status')
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ('id', 'name', 'username', 'photo',
                  'online', 'status', 'email')

    def get_name(self, obj):
        if isinstance(obj, User):
            if obj.first_name:
                return obj.get_full_name()
            return obj.username
        elif isinstance(obj, dict):
            return obj.get('name', 'Unknown')
        return 'Unknown'


class UserWithPhotoURLSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    online = serializers.BooleanField(source='profile.online')
    status = serializers.CharField(source='profile.status')
    messages = serializers.SerializerMethodField()  # Messages alanı

    class Meta:
        model = User
        fields = ('name', 'username', 'photo', 'online',
                  'status', 'messages')  # Messages eklendi

    def get_name(self, obj):
        if isinstance(obj, User):
            if obj.first_name:
                return obj.get_full_name()
            return obj.username
        elif isinstance(obj, dict):
            return obj.get('name', 'Unknown')
        return 'Unknown'

    def get_photo(self, obj):
        """
        Profil fotoğrafını tam bir link olarak döndürür.
        """
        request = self.context.get('request')
        if obj.profile.photo:
            return request.build_absolute_uri(obj.profile.photo.url)
        return None

    def get_messages(self, obj):
        """
        Kullanıcı ile ilgili mesajları döndürür.
        """
        messages = Message.objects.filter(
            Q(receiver=obj, sender=self.context['request'].user) |
            Q(sender=obj, receiver=self.context['request'].user)
        ).order_by('date_time')
        serializer = MessageModelSerializer(messages, many=True)
        return serializer.data


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
    receiver = serializers.UUIDField(write_only=True)

    def create(self, validated_data):
        try:
            user = User.objects.get(pk=validated_data['receiver'])
            message = Message()
            message.text = validated_data['text']
            message.sender = self.context['request'].user
            message.receiver = user
            message.save()
            self._broadcast(message)
            return validated_data
        except User.DoesNotExist:
            print('User not found from serializers.')
            raise serializers.ValidationError({'receiver': 'User not found.'})
        except Exception as e:
            raise serializers.ValidationError({'error': str(e)})

    def _broadcast(self, message: Message):
        serializer = MessageModelSerializer(message, many=False)
        n_message = serializer.data
        channel_layer = get_channel_layer()
        print(f"Sending message to chat_{message.receiver.id}")
        async_to_sync(channel_layer.group_send)(
            'chat_%s' % message.receiver.id, {
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
    id = serializers.UUIDField(source='pk', read_only=True)
    email = serializers.EmailField()
    name = serializers.SerializerMethodField()
    photo = serializers.ImageField(source='profile.photo')
    online = serializers.BooleanField(source='profile.online')
    status = serializers.CharField(source='profile.status')
    messages = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'username', 'photo',
                  'online', 'status', 'messages', 'last_message')

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


class SendFriendRequestSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        fields = ('username', 'user')

    def get_user(self, obj):
        # Yeni serializer ile tam URL döndürülüyor
        return UserWithPhotoURLSerializer(obj['sender'], context=self.context).data

    def create(self, validated_data):
        sender = self.context['request'].user
        receiver = User.objects.filter(
            username=validated_data['username']).first()

        if not receiver:
            raise serializers.ValidationError({'username': 'User not found.'})

        friendship, created = Friendship.objects.get_or_create(
            from_user=sender,
            to_user=receiver,
            defaults={'status': 'pending'}
        )

        if not created:
            raise serializers.ValidationError(
                {'username': 'Friend request already sent.'})

        message_content = {
            'sender': UserWithPhotoURLSerializer(sender, context=self.context).data,
            'message': 'You have a new friend request.'
        }
        self._broadcast(f'chat_{receiver.id}',
                        'new_friendship_request', message_content)
        return {'sender': sender, 'receiver': receiver}

    def _broadcast(self, channel_name, message_type, message_content):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            channel_name, {
                'type': message_type,
                'message': message_content
            }
        )


class AcceptFriendRequestSerializer(serializers.Serializer):
    username = serializers.CharField(write_only=True)
    user = serializers.SerializerMethodField()

    class Meta:
        fields = ('username', 'user')

    def get_user(self, obj):
        return UserWithPhotoURLSerializer(obj['receiver'], context=self.context).data

    def create(self, validated_data):
        receiver = self.context['request'].user
        sender = User.objects.filter(
            username=validated_data['username']).first()

        if not sender:
            raise serializers.ValidationError({'username': 'User not found.'})

        friendship = Friendship.objects.filter(
            from_user=sender, to_user=receiver, status='pending').first()

        if not friendship:
            raise serializers.ValidationError(
                {'username': 'Friend request not found.'})

        friendship.status = 'accepted'
        friendship.save()

        message_content = {
            'receiver': UserWithPhotoURLSerializer(receiver, context=self.context).data,
            'message': f'{receiver.username} accepted your friend request.'
        }
        self._broadcast(f'chat_{sender.id}',
                        'accepted_friendship_request', message_content)
        return {'sender': sender, 'receiver': receiver}

    def _broadcast(self, channel_name, message_type, message_content):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            channel_name, {
                'type': message_type,
                'message': message_content
            }
        )
