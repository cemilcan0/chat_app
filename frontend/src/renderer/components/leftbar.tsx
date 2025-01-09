import React from "react";
import { useChat } from "../context/ChatContext";
import AddFriend from "./add-friend";
import Profile from "./profile";

const Leftbar: React.FC = () => {
  const { users, selectedUser, setSelectedUser } = useChat();

  return (
    <div className="w-1/3 bg-[#433259] flex flex-col">
      <div className="p-4">
        {/* Giriş Yapmış Kullanıcı */}
        <Profile />

        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Search for a user"
            className="w-full p-2 rounded-l-lg border border-gray-300 focus:outline-none"
          />
          <AddFriend />
        </div>
      </div>

      {/* Kullanıcı Listesi */}
      <div className="flex-grow overflow-y-auto text-white">
        {users.map((user) => {
          // Kullanıcının son mesajını al
          const lastMessage =
            user.messages && user.messages.length > 0
              ? user.messages[user.messages.length - 1]
              : null;

          return (
            <div
              key={user.username}
              className={`p-4 mb-2 cursor-pointer rounded-lg flex items-center relative ${selectedUser?.username === user.username
                } hover:bg-[#76589A] transition-colors duration-200`}
              onClick={() => setSelectedUser(user)}
            >
              {/* Kullanıcı Avatarı */}
              <img
                src={user.photo || "https://via.placeholder.com/40"}
                alt="User Avatar"
                className="w-10 h-10 rounded-full"
              />

              {/* Kullanıcı Bilgileri ve Son Mesaj */}
              <div className="flex-1 ml-4">
                <h3 className="text-sm font-semibold">{user.name}</h3>
                <p className="text-xs text-gray-400 truncate">
                  {lastMessage
                    ? lastMessage.sender === user?.username
                      ? `${user.name}: ${lastMessage.text}` // Eğer karşı taraf mesaj atmışsa
                      : `You: ${lastMessage.text}` // Eğer mesajı siz göndermişseniz
                    : "No messages yet"}
                </p>
              </div>

              {/* Okunmamış Mesajlar */}
              {user.unreadMessages > 0 && (
                <div className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {user.unreadMessages}
                </div>
              )}

              {/* Mesaj Zamanı */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {lastMessage
                  ? new Date(lastMessage.date_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : ""}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Leftbar;
