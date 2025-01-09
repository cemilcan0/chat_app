import React from "react";
import { useChat } from "../context/ChatContext";
import AddFriend from "./add-friend";
import Profile from "./profile";

const Leftbar: React.FC = () => {
  const { users, selectedUser, setSelectedUser } = useChat();

  return (

    <div className="w-1/3 bg-[#433259] flex flex-col">
      <div className=" p-4">
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
        {users.map((user) => (
          <div
            key={user.username}
            className={`p-4 mb-2 cursor-pointer rounded-lg flex items-center ${selectedUser?.username === user.username} hover:bg-[#76589A]`}
            onClick={() => setSelectedUser(user)}
          >
            {/* Kullanıcı Avatarı */}
            <img
              src={user.photo || "https://via.placeholder.com/40"}
              alt="User Avatar"
              className="w-10 h-10 rounded-full mr-4"
            />
            {/* Kullanıcı Adı ve Durum */}
            <div className="flex-1">
              <h3 className="text-md font-bold">{user.name}</h3>
              <p className="text-sm text-gray-300">
                {user.online ? (
                  <>
                    <span className="text-green-500 mr-1">●</span> Online
                  </>
                ) : (
                  "Offline"
                )}
              </p>
            </div>
            {/* Okunmamış Mesaj Sayısı */}
            {user.unreadMessages > 0 && (
              <div className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                {user.unreadMessages}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Leftbar;
