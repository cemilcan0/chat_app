import React, { useEffect } from 'react';
import useChatStore from '../store/chatStore';
import dummyPhoto from '../../../assets/images/photo.jpg';
import { MessageType } from '../types';
import { getCurrentTime } from '../utils/helpers';

const Friends: React.FC = () => {
  const { chats, fetchChats, setActiveChat, activeChat, user, friendRequests, fetchFriendRequests } = useChatStore();

  useEffect(() => {
    fetchChats();
    fetchFriendRequests();
  }, [fetchChats]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#1A1A22] text-white">
      <h2 className="px-4 py-2 text-lg font-bold text-gray-400">ALL MESSAGES</h2>
      {chats.map((chat, index) => {
        const lastMessage: MessageType | null =
          chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1]
            : null;

        return (
          <div
            key={index}
            className={`p-4 flex items-center justify-between border-b border-gray-700 cursor-pointer transition-colors ${
              activeChat?.username === chat.username ? 'bg-[#2C2B39]' : 'hover:bg-[#2C2B39]'
            }`}
            onClick={() => setActiveChat(chat)}
          >
            {/* Profil Fotoğrafı */}
            <div className="relative">
              <img
                src={chat.photo || dummyPhoto}
                alt={`${chat.name}'s profile`}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1A1A22] ${
                  chat.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                }`}
              ></div>
            </div>

            {/* Sohbet Bilgileri */}
            <div className="flex-1 ml-4">
              <h3 className="text-sm font-semibold">{chat.name}</h3>
              <p className="text-xs text-gray-400 truncate">
                {lastMessage
                  ? lastMessage.sender === user?.username
                    ? `You: ${lastMessage.text}`
                    : `${lastMessage.sender}: ${lastMessage.text}`
                  : 'No messages yet'}
              </p>
            </div>

            {/* Mesaj Zamanı */}
            <div className="text-right">
              <p className="text-xs text-gray-400">
                {lastMessage ? getCurrentTime(lastMessage.date_time) : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Friends;
