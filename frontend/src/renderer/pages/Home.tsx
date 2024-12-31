import React, { useState } from 'react';
import photo from '../../../assets/images/photo.jpg';
import logout from '../../../assets/icons/logout-svgrepo-com.svg';
import { ChatType, UserType } from '../types';
import Friends from '../components/friends';
import Chat from '../components/chat';

const Home: React.FC = () => {
  const [activeChat, setActiveChat] = useState<ChatType | null>(null);

  const user: UserType | null = (() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) as UserType : null;
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  }

  return (
    <div className="flex h-screen">
      {/* Sol Panel */}
      <div className="w-1/3 bg-[#F3F5F7] border-r border-gray-300 flex flex-col">
        <div className="flex m-8 items-center">
          {/* Profil Fotoğrafı */}
          <div className="border-2 border-[#5C52C7] rounded-full overflow-hidden">
            <img src={`https://testapi.berat-dogan.com${user?.photo}` || photo} className="w-20 h-20" alt="Profile" />
          </div>

          {/* Ad ve Mesaj */}
          <div className="p-5 flex flex-col items-start">
            <h4 className="text-[#5C52C7] font-bold text-lg">{user?.name || "Guest User"}</h4>
            <p className="text-xs text-gray-500 font-bold">{user?.status || "No status"}</p>
          </div>

          <button className='ml-auto mr-8' onClick={handleLogout}>
            <img src={logout} alt="Logout" className='w-5 h-5' />
          </button>
        </div>

        <Friends />
      </div>

      {/* Sağ Panel */}
      <Chat />
    </div>
  );
};

export default Home;
