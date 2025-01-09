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

  const renderMessagesWithDateSeparators = () => {
    if (!activeChat?.messages.length) return null;

    const messagesWithSeparators: JSX.Element[] = [];
    let lastDate = '';

    activeChat.messages.forEach((message, index) => {
      const messageDate = new Date(message.date_time).toDateString();

      if (messageDate !== lastDate) {
        lastDate = messageDate;
        messagesWithSeparators.push(
          <div key={`date-${index}`} className="text-center text-gray-400 text-xs my-2">
            {messageDate}
          </div>
        );
      }

      messagesWithSeparators.push(
        <div
          key={index}
          className={`flex items-end gap-2 my-1 ${
            message.sender === user?.username ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.sender !== user?.username && (
            <img
              src={activeChat.photo || dummyPhoto}
              alt={activeChat.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <div
            className={`p-2 rounded-md w-fit min-w-[15%] max-w-[35%] ${
              message.sender === user?.username
                ? 'bg-[#075E54] text-white ml-auto'
                : 'bg-[#2C2B39] text-white mr-auto'
            }`}
          >
            <p className="break-words text-sm">
              {typeof message.text === 'string' ? message.text : 'Invalid message'}
            </p>
            <p className="text-xs text-gray-400 text-right mt-1">
              {typeof message.date_time === 'string'
                ? getCurrentTime(message.date_time)
                : ''}
            </p>
          </div>
          {message.sender === user?.username && (
            <img
              src={`https://testapi.berat-dogan.com${user?.photo}` || dummyPhoto}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
        </div>
      );
    });

    return messagesWithSeparators;
  };

  return (
    <div className="relative flex flex-col h-full w-3/4 bg-[#1A1A22]">
      {activeChat ? (
        <>
          <div
            className="bg-[#202126] bg-opacity-75 shadow-md flex items-center justify-between z-10 px-5 py-3"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center gap-4">
              <img
                src={activeChat.photo || dummyPhoto}
                alt={activeChat.name}
                className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
              />
              <div>
                <h2 className="font-semibold text-lg text-white">{activeChat.name}</h2>
                <p className="text-sm text-gray-400">{activeChat.status || 'No status available'}</p>
              </div>
            </div>

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

          <div className="flex-1 p-2 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {activeChat.messages.length === 0 ? (
              <div className="text-gray-500 text-center mt-2">No messages yet.</div>
            ) : (
              renderMessagesWithDateSeparators()
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
            <form
              className="flex w-full items-center bg-[#2C2B39] rounded-full px-4 py-2"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                placeholder="Type something here..."
                className="flex-1 bg-transparent border-none text-white focus:outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className="ml-2 p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M22 12H2m20 0l-9 9m9-9l-9-9"
                  />
                </svg>
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
