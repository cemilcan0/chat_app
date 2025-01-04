import React, { useState, useEffect } from 'react';
import photo from '../../../assets/images/photo.jpg';
import logout from '../../../assets/icons/logout-svgrepo-com.svg';
import { UserType } from '../types';
import Friends from '../components/friends';
import Chat from '../components/chat';
import AddFriend from '../components/add-friend';
import useChatStore from '../store/chatStore';

const Home: React.FC = () => {
  const user: UserType | null = (() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) as UserType : null;
  })();

  const { socket, acceptCall, rejectCall } = useChatStore(); // Yeni fonksiyonları ekledik
  const [incomingCall, setIncomingCall] = useState<null | any>(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  // WebSocket'ten gelen çağrıyı dinleme
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.status === 'new_call') {
          console.log('Incoming call:', data);

          // Gelen çağrıyı popup için state'e kaydet
          setIncomingCall(data.message);
        }
      };
    }
  }, [socket]);

  const handleAcceptCall = async () => {
    console.log('Call accepted:', incomingCall);

    if (!incomingCall) return;

    try {
      await acceptCall(incomingCall.data.peer_id, incomingCall.data.sender); // Accept Call fonksiyonunu çağırıyoruz
      setIncomingCall(null); // Popup'ı kapatıyoruz
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleRejectCall = async () => {
    console.log('Call rejected:', incomingCall);

    if (!incomingCall) return;

    try {
      await rejectCall(incomingCall.data.peer_id, incomingCall.data.sender); // Reject Call fonksiyonunu çağırıyoruz
      setIncomingCall(null); // Popup'ı kapatıyoruz
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3 bg-[#F3F5F7] border-r border-gray-300 flex flex-col">
        <div className="flex px-6 py-7 items-center">
          <div className="border-2 border-[#5C52C7] rounded-full overflow-hidden">
            <img
              src={`https://testapi.berat-dogan.com${user?.photo}` || photo}
              className="w-20 h-20"
              alt="Profile"
            />
          </div>

          <div className="p-5 flex flex-col items-start">
            <p className="text-[#5C52C7] font-bold text-lg">{user?.name || "Guest User"}</p>
            <p className="text-xs text-gray-500 font-bold">{user?.username || "guest_user"}</p>
            <p className="text-xs text-gray-500 font-bold">{user?.status || "No status"}</p>
          </div>

          <button className="ml-auto mr-8" onClick={handleLogout}>
            <img src={logout} alt="Logout" className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-1 border-b border-gray-300 flex items-center justify-between">
          <p>Friends</p>
          <AddFriend />
        </div>

        <Friends />
      </div>

      {/* Sağ Panel */}
      <Chat />

      {/* Gelen Çağrı Popup */}
      {incomingCall && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <img
              src={incomingCall.display.photo}
              alt={incomingCall.display.name}
              className="w-20 h-20 rounded-full mb-4"
            />
            <h2 className="text-lg font-semibold">{incomingCall.display.name}</h2>
            <p className="text-sm text-gray-500">{incomingCall.display.status}</p>

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleAcceptCall}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Accept
              </button>
              <button
                onClick={handleRejectCall}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
