import React, { useState } from 'react';
import useChatStore from '../store/chatStore';

interface CallButtonProps {
  icon: string;
  altText: string;
  receiver: string; // Aramanın yapılacağı kullanıcının username'i
  type: 'audio' | 'video'; // Arama türü: sesli veya görüntülü
}

const CallButton: React.FC<CallButtonProps> = ({ icon, altText, receiver, type }) => {
  const { connectPeer, startCall, endCall, user } = useChatStore();
  const [isCalling, setIsCalling] = useState(false); // Arama durumu

  const handleCall = async () => {
    if (!user) {
      console.error('User not found');
      return;
    }

    console.log(`Starting ${type} call with ${receiver}...`);

    // PeerJS bağlantısını başlat
    connectPeer(user.username);

    setIsCalling(true); // Aramanın başladığını belirtir

    try {
      await startCall(receiver);
    } catch (error) {
      console.error('Error starting call:', error);
      setIsCalling(false); // Hata durumunda arama durumunu sıfırla
    }
  };

  const handleCancelCall = () => {
    console.log('Call canceled');
    endCall(); // Çağrıyı sonlandır
    setIsCalling(false); // Arama durumunu sıfırla
  };

  return (
    <>
      {/* Arama Başlatma Butonu */}
      <button
        onClick={handleCall}
        className="p-2 bg-gray-600 bg-opacity-30 hover:bg-opacity-50 rounded-full transition-all duration-200"
      >
        <img src={icon} alt={altText} className="w-5 h-5 text-white" />
      </button>

      {/* Arama Durumu Gösterimi */}
      {isCalling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg flex flex-col items-center">
            <p className="text-lg font-semibold text-gray-700">Calling {receiver}...</p>
            <div className="loader mt-4"></div>
            <button
              onClick={handleCancelCall}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CallButton;
