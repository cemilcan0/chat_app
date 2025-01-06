import React, { useState, useEffect, useRef } from 'react';
import useChatStore from '../store/chatStore';
import phone from '../../../assets/icons/phone-call.svg';
import camera from '../../../assets/icons/camera.svg';
import dummyPhoto from '../../../assets/images/photo.jpg';
import useEscKeyListener from '../hooks/useEscKeyListener';
import CallButton from './call-button';
import { getCurrentTime } from '../utils/helpers';

const Chat: React.FC = () => {
  useEscKeyListener();
  const { activeChat, sendMessage, user } = useChatStore();

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !message.trim()) return;

    await sendMessage(message, activeChat.username);
    setMessage('');
  };

  const scrollToBottom = (smooth: boolean) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom(true);
  }, [activeChat?.messages.length]);

  return (
    <div className="relative flex flex-col h-full w-2/3 bg-[#1A1A22]">
      {activeChat ? (
        <>
          {/* Başlık Çubuğu */}
          <div
            className="bg-[#202126] bg-opacity-75 shadow-md flex items-center justify-between z-10 px-5 py-3"
            style={{
              backdropFilter: 'blur(10px)', // Arka plan bulanıklığı
              WebkitBackdropFilter: 'blur(10px)', // Safari desteği
            }}
          >
            {/* Kullanıcı Bilgileri */}
            <div className="flex items-center gap-4">
              <img
                src={activeChat.photo || dummyPhoto}
                alt={activeChat.name}
                className="w-12 h-12 rounded-full border-2 border-gray-600"
              />
              <div>
                <h2 className="font-semibold text-lg text-white">{activeChat.name}</h2>
                <p className="text-sm text-gray-400">
                  {activeChat.status || 'No status available'}
                </p>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center gap-3">
              <CallButton
                icon={phone}
                altText="Phone Call"
                receiver={activeChat.username}
                type="audio"
              />
              <CallButton
                icon={camera}
                altText="Video Call"
                receiver={activeChat.username}
                type="video"
              />
            </div>
          </div>

          {/* Mesaj Alanı */}
          <div className="flex-1 p-2 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {activeChat.messages.length === 0 ? (
              <div className="text-gray-500 text-center mt-2">No messages yet.</div>
            ) : (
              activeChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 my-1 rounded-md w-fit min-w-[15%] max-w-[35%] ${message.sender === user?.username
                      ? 'bg-[#075E54] ml-auto text-white'
                      : 'bg-[#2C2B39] mr-auto text-white'
                    }`}
                >
                  <p className="break-words text-sm">{typeof message.text === 'string' ? message.text : 'Invalid message'}</p>
                  <p className="text-xs text-gray-400 text-right mt-1">
                    {typeof message.date_time === 'string' ? getCurrentTime(message.date_time) : ''}
                  </p>
                </div>
              ))
            )}
            {/* Ref point for scrolling */}
            <div ref={messagesEndRef} />
          </div>



          {/* Mesaj Gönderme */}
          <div className="p-4 flex items-center gap-2 bg-[#1A1A22] border-t border-gray-600">
            <form className="flex w-full" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 p-2 border border-gray-600 rounded-md focus:ring focus:ring-blue-300 focus:outline-none bg-[#2C2B39] text-white"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Send
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex flex-1 justify-center items-center text-gray-500">
          <h3>Select a chat to start messaging</h3>
        </div>
      )}
    </div>
  );
};

export default Chat;