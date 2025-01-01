import React, { useState, useEffect, useRef } from 'react';
import useChatStore from '../store/chatStore';
import phone from '../../../assets/icons/phone-call.svg';
import cancelCall from '../../../assets/icons/call-cancel.svg';
import microphone from '../../../assets/icons/microphone.svg';
import camera from '../../../assets/icons/camera.svg';
import dummyPhoto from '../../../assets/images/photo.jpg';

const Chat: React.FC = () => {
  const { activeChat, sendMessage, user } = useChatStore();
  const [isCalling, setIsCalling] = useState(false);

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
    <div className="flex h-full w-2/3">
      <div className={`flex flex-col transition-all duration-300 w-full bg-[#1A1A22]`}>
        {activeChat ? (
          <>
            <div className="relative">
              {/* Başlık Çubuğu */}
              <div
                className="absolute top-0 left-0 right-0 bg-[#202126] bg-opacity-75 shadow-md flex items-center justify-between z-10 px-5 py-3"
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
                  <button className="p-2 bg-gray-600 bg-opacity-30 hover:bg-opacity-50 rounded-full transition-all duration-200">
                    <img src={phone} alt="Phone Call" className="w-5 h-5 text-white" />
                  </button>
                  <button className="p-2 bg-gray-600 bg-opacity-30 hover:bg-opacity-50 rounded-full transition-all duration-200">
                    <img src={camera} alt="Video Call" className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>




            {isCalling && (
              <div className="py-2 px-5 bg-gray-900 text-white flex items-center justify-between">
                <div className='flex flex-col justify-center items-center gap-4 w-full py-6'>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={activeChat?.photo || dummyPhoto}
                        alt={activeChat?.name}
                        className="w-20 h-20 rounded-full border-2"
                      />
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-black"></div>
                    </div>
                    <div className="relative">
                      <img
                        src={`https://testapi.berat-dogan.com${user?.photo}` || dummyPhoto}
                        alt={user?.username}
                        className="w-20 h-20 rounded-full border-2"
                      />
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-black"></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <img src={microphone} alt="Microphone" className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <img src={camera} alt="Camera" className="w-5 h-5" />
                    </button>
                    <button
                      className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center"
                      onClick={() => setIsCalling(false)}
                    >
                      <img src={cancelCall} alt="Cancel Call" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto">
              {activeChat.messages.length === 0 ? (
                <div className="text-gray-500 text-center">No messages yet.</div>
              ) : (
                activeChat.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 my-2 rounded-full w-fit max-w-[45%] ${message.sender === user?.username
                      ? 'bg-[#86DFF3] ml-auto text-black'
                      : 'bg-[#2C2B39] mr-auto text-white'
                      }`}
                  >
                    <p>{typeof message.text === 'string' ? message.text : 'Invalid message'}</p>
                  </div>
                ))
              )}
              {/* Ref point for scrolling */}
              <div ref={messagesEndRef} />
            </div>
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
    </div>
  );
};

export default Chat;