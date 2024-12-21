from django.contrib import admin

# Register your models here.
from chat_app.models import Profile
from chat_app.models import Profile, ChatGroup, GroupMessage



@admin.register(Profile)
class Profile(admin.ModelAdmin):
    list_display = ('user', 'photo', 'status', 'online')



@admin.register(ChatGroup)
class ChatGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin', 'created_at')
    search_fields = ('name',)
    filter_horizontal = ('members',)

@admin.register(GroupMessage)
class GroupMessageAdmin(admin.ModelAdmin):
    list_display = ('group', 'sender', 'text', 'date_time')
    search_fields = ('group__name', 'sender__username', 'text')