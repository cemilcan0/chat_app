import React from 'react';
import photo from '../../../assets/images/photo.jpg';
import logout from '../../../assets/icons/logout-svgrepo-com.svg';
import { UserType } from '../types';
import Friends from '../components/friends';
import Chat from '../components/chat';
import AddFriend from '../components/add-friend';

const Home: React.FC = () => {
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
      <div className="w-1/3 bg-[#F3F5F7] border-r border-gray-300 flex flex-col">
        <div className="flex px-6 py-7 items-center">
          <div className="border-2 border-[#5C52C7] rounded-full overflow-hidden">
            <img src={`https://testapi.berat-dogan.com${user?.photo}` || photo} className="w-20 h-20" alt="Profile" />
          </div>

          <div className="p-5 flex flex-col items-start">
            <p className="text-[#5C52C7] font-bold text-lg">{user?.name || "Guest User"}</p>
            <p className="text-xs text-gray-500 font-bold">{user?.username || "guest_user"}</p>
            <p className="text-xs text-gray-500 font-bold">{user?.status || "No status"}</p>
          </div>

          <button className='ml-auto mr-8' onClick={handleLogout}>
            <img src={logout} alt="Logout" className='w-5 h-5' />
          </button>
        </div>

        <div className='px-4 py-1 border-b border-gray-300 flex items-center justify-between'>
          <p>Friends</p>

          <AddFriend />
        </div>

        <Friends />
      </div>

      {/* Sağ Panel */}
      <Chat />
    </div>
  );
};

export default Home;
