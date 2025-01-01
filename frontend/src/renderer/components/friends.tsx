import React, { useEffect } from 'react';
import useChatStore from '../store/chatStore';
import dummyPhoto from '../../../assets/images/photo.jpg';
import { MessageType } from '../types';

const Friends: React.FC = () => {
  const { chats, fetchChats, setActiveChat, activeChat, user, friendRequests, fetchFriendRequests } = useChatStore();

  useEffect(() => {
    fetchChats();
    fetchFriendRequests();
  }, [fetchChats]);

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat, index) => {
        const lastMessage: MessageType | null =
          chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1]
            : null;

        return (
          <div
            key={index}
            className={`p-4 flex justify-between items-center border-b border-gray-300 cursor-pointer transition-colors ${activeChat?.username === chat.username ? 'bg-blue-100' : 'hover:bg-blue-50'
              }`}
            onClick={() => setActiveChat(chat)}
          >
            <div className="flex w-full gap-2">
              <div className="relative">
                <img
                  src={chat.photo || dummyPhoto}
                  alt={`${chat.name}'s profile`}
                  className="w-10 h-10 rounded-full"
                />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${chat.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                ></div>
              </div>

              <div>
                <h3 className="text-m font-bold text-[#5C52C7]">{chat.name}</h3>
                <p className="text-xs text-gray-500">
                  {lastMessage
                    ? lastMessage.sender === user?.username
                      ? `You: ${lastMessage.text}`
                      : `${lastMessage.sender}: ${lastMessage.text}`
                    : 'No messages yet'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Friends;
