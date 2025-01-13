import React, { useState, useEffect } from "react";
import useChatStore from "../store/chatStore";
import AddFriend from "./add-friend";
import Profile from "./profile";

const Leftbar: React.FC = () => {
  const { users, selectedUser, setSelectedUser } = useChatStore();

  const [searchQuery, setSearchQuery] = useState<string>(""); // Arama çubuğu için durum
  const [filteredUsers, setFilteredUsers] = useState(users); // Filtrelenmiş kullanıcılar
  const [maxMessageLength, setMaxMessageLength] = useState<number>(20); // Varsayılan daha düşük karakter sınırı

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width <= 1200) {
        setMaxMessageLength(14);
      } else {
        setMaxMessageLength(30);
      }
    };

    handleResize(); 
    window.addEventListener("resize", handleResize); 

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.name.toLowerCase().startsWith(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  return (
    <div className="w-1/3 xl:w-1/4 bg-[#433259] flex flex-col">
      <div className="p-4">
        {/* Giriş Yapmış Kullanıcı */}
        <Profile />

        <div className="flex items-center mb-4 p-2 rounded-full shadow-md bg-black bg-opacity-20">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 19a8 8 0 100-16 8 8 0 000 16zm10-2l-3.5-3.5"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search Conversations"
              className="w-full pl-10 py-2 text-sm bg-transparent text-white focus:outline-none placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Arama sorgusunu güncelle
            />
          </div>

          <AddFriend />
        </div>
      </div>

      {/* Kullanıcı Listesi */}
      <div className="flex-grow overflow-y-auto text-white">
        {filteredUsers.map((user) => {
          // Kullanıcının son mesajını al
          const lastMessage =
            user.messages && user.messages.length > 0
              ? user.messages[user.messages.length - 1]
              : null;

          return (
            <div
              key={user.username}
              className={`p-4 mb-2 cursor-pointer rounded-lg flex items-center relative ${selectedUser?.username === user.username
                ? "bg-[#76589A]"
                : "hover:bg-[#76589A]"
                } transition-colors duration-200`}
              onClick={() => setSelectedUser(user)}
            >
              {/* Kullanıcı Avatarı */}
              <div className="relative">
                <img
                  src={user.photo || "https://via.placeholder.com/40"}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full"
                />
                {/* Online/Offline Durumu */}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${user.online ? "bg-green-500" : "bg-red-500"}`}
                ></span>
              </div>

              {/* Kullanıcı Bilgileri ve Son Mesaj */}
              <div className="flex-1 ml-4">
                <h3 className="text-sm font-semibold">{user.name}</h3>
                <p className="text-xs text-gray-400 truncate">
                  {lastMessage
                    ? lastMessage.sender === user?.username
                      ? `${user.name}: ${lastMessage.text.length > maxMessageLength
                        ? lastMessage.text.slice(0, maxMessageLength) + "..."
                        : lastMessage.text
                      }` // Eğer karşı taraf mesaj atmışsa
                      : `You: ${lastMessage.text.length > maxMessageLength
                        ? lastMessage.text.slice(0, maxMessageLength) + "..."
                        : lastMessage.text
                      }` // Eğer mesajı siz göndermişseniz
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
                {lastMessage ? (
                  (() => {
                    const messageDate = new Date(lastMessage.date_time);
                    const today = new Date();

                    // Eğer mesaj bugün gönderilmişse, sadece saati göster
                    if (
                      messageDate.getDate() === today.getDate() &&
                      messageDate.getMonth() === today.getMonth() &&
                      messageDate.getFullYear() === today.getFullYear()
                    ) {
                      return messageDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    }

                    // Eğer mesaj başka bir gün gönderilmişse, tarihi göster
                    return messageDate.toLocaleDateString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                  })()
                ) : (
                  ""
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leftbar;
