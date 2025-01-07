import React, { useState, useEffect } from 'react';
import photo from '../../../assets/images/photo.jpg';
import logout from '../../../assets/icons/logout-svgrepo-com.svg';
import { UserType } from '../types';
import Friends from '../components/friends';
import Chat from '../components/chat';
import AddFriend from '../components/add-friend';
import useChatStore from '../store/chatStore';

const Home: React.FC = () => {
  const { incomingCall, setIncomingCall } = useChatStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const user: UserType | null = (() => {
    const userData = localStorage.getItem('user');
    return userData ? (JSON.parse(userData) as UserType) : null;
  })();

  useEffect(() => {
    console.log('Incoming call:', incomingCall);
  }, [incomingCall]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const handleAcceptCall = async () => {
    console.log('Call accepted:', incomingCall);
    if (!incomingCall || !incomingCall.offer) {
      console.error('Offer information is missing!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      const audioElement = document.getElementById('local-audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.srcObject = stream;
        audioElement.muted = true;
        audioElement.play();
      }

      await useChatStore.getState().acceptCall(incomingCall.offer, incomingCall.sender);

      const peerConnection = useChatStore.getState().peerConnection;
      if (peerConnection) {
        peerConnection.ontrack = (event) => {
          const remoteStream = new MediaStream();
          event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
          setRemoteStream(remoteStream);

          const remoteAudioElement = document.getElementById('remote-audio') as HTMLAudioElement;
          if (remoteAudioElement) {
            remoteAudioElement.srcObject = remoteStream;
            remoteAudioElement.play();
          }
        };
      }

      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleRejectCall = () => {
    console.log('Call rejected:', incomingCall);
    setIncomingCall(null);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-[#F3F5F7] border-r border-gray-300 flex flex-col">
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