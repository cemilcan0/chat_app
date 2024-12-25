import React, { useState } from 'react';
import useChatStore from '../store/chatStore';

const Chat: React.FC = () => {
  const { activeChat, sendMessage, user } = useChatStore(); // user bilgisi burada!

  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !message.trim()) return;

    await sendMessage(message, activeChat.username);
    setMessage('');
  };

  return (
    <div className="flex h-full w-2/3">
      <div className={`flex flex-col bg-gray-200 transition-all duration-300 w-full`}>
        {activeChat ? (
          <>
            <div className="py-3 px-5 bg-blue-500 text-white shadow-md">
              <h2 className="font-semibold text-xl">{activeChat.name}</h2>
              <p className="text-sm text-white/80">{activeChat.status}</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
              {activeChat.messages.length === 0 ? (
                <div className="text-gray-500 text-center">No messages yet.</div>
              ) : (
                activeChat.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 my-2 rounded-lg w-fit max-w-[45%] ${
                      message.sender === user?.username
                        ? 'bg-blue-500 ml-auto text-white'
                        : 'bg-white mr-auto'
                    }`}
                  >
                    <p>{typeof message.text === 'string' ? message.text : 'Invalid message'}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 flex items-center gap-2 bg-white border-t border-gray-300">
              <form className="flex w-full" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
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
    </div>
  );
};

export default Chat;
