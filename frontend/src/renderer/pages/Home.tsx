import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import photo from '../../../assets/images/photo.jpg';

interface User {
  id: number;
  name: string;
  lastMessage: string;
  status: "online" | "offline";
}

interface Chat {
  selectedUser: User;
  messages: {
    message: string;
    senderId: number;
    time: number;
  }[];
}

const Home: React.FC = () => {
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState<string>("");

  // Dummy users data with profile images
  const users: User[] = [
    {
      id: 1,
      name: "Berat",
      lastMessage: "Hey there!",
      status: "online",
    },
    {
      id: 2,
      name: "Bob",
      lastMessage: "See you soon!",
      status: "offline",
    },
    {
      id: 3,
      name: "Charlie",
      lastMessage: "Let's catch up.",
      status: "online",
    },
  ];
  
  const handleUserClick = (user: User) => {
    const chat: Chat = {
      selectedUser: user,
      messages: [{
        message: "Selam kanka nabıyorsun hayat nasıl gidiyor bana anlat bir şeyler!",
        senderId: 1,
        time: 1734807971
      },
      {
        message: "İyi hocam senden",
        senderId: 2,
        time: 1734807971
      },]
    }

    setActiveChat(chat);
  };

  const handleSendMessage = () => {
    if (!activeChat) return;

    const newMessage = {
      message: message,
      senderId: 1,
      time: Date.now()
    };

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, newMessage]
    };

    setActiveChat(updatedChat);
    setMessage("");
  };

  return (
    <div className="flex h-screen">
      {/* Sol Panel */}
      <div className="w-1/3 bg-[#F3F5F7] border-r border-gray-300 flex flex-col">
        <div className="flex m-8 items-center">
          {/* Profil Fotoğrafı */}
          <div className="border-2 border-[#5C52C7] rounded-full overflow-hidden">
            <img src={photo} className="w-20 h-20" />
          </div>

          {/* Ad ve Mesaj */}
          <div className="p-5 flex flex-col items-start">
            <h4 className="text-[#5C52C7] font-bold text-lg">Cemil Can Şahin</h4>
            <p className="text-xs text-gray-500 font-bold">ali koç istifa</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-4 flex justify-between items-center border-b border-gray-300 cursor-pointer transition-colors ${activeChat?.selectedUser.id === user.id ? "bg-blue-100" : "hover:bg-blue-50"
                }`}
              onClick={() => handleUserClick(user)}
            >
              <div className="flex gap-2">
                <img src={photo} alt={`${user.name}'s profile`} className="w-10 h-10 rounded-full" />

                <div>
                  <h3 className="text-m font-bold text-[#5C52C7]">{user.name}</h3>
                  <p className="text-xs text-gray-500">{user.lastMessage}</p>
                </div>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${user.status === "online" ? "bg-green-500" : "bg-red-500"
                  }`}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ Panel */}
      <div className="flex-1 flex flex-col bg-gray-200">
        {activeChat ? (
          <>
            <div className="p-4 bg-blue-500 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg">{activeChat.selectedUser.name}</h2>
              <span
                className={`text-sm ${activeChat.selectedUser.status === "online"
                    ? "text-green-300"
                    : "text-red-300"
                  }`}
              >
                {activeChat.selectedUser.status}
              </span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
              {activeChat.messages.length === 0 ? (
                  <div className="text-gray-500 text-center">
                    No messages yet.
                  </div>
                ) : (
                  activeChat.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-2 my-2 rounded-lg w-fit max-w-[45%] ${
                        message.senderId === 1 ? "bg-blue-500 ml-auto text-white" : "bg-white mr-auto"
                      }`}
                    >
                      <p>{message.message}</p>
                    </div>
                  ))
              )}
            </div>
            <div className="p-4 flex items-center gap-2 bg-white border-t border-gray-300">
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // Sayfa yenilenmesini önler
                  handleSendMessage();
                }}
                className="flex w-full"
              >
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

export default Home;