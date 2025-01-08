import React, { useState } from 'react';
import useChatStore from '../store/chatStore';

interface CallButtonProps {
  icon: string;
  altText: string;
  receiver: string; // Aramanın yapılacağı kullanıcının username'i (aynı zamanda Peer ID'si)
  type: 'audio' | 'video'; // Arama türü: sesli veya görüntülü
}

const CallButton: React.FC<CallButtonProps> = ({ icon, altText, receiver, type }) => {
  const { connectPeer, startCall, endCall, user } = useChatStore();

  const [isCalling, setIsCalling] = useState(false); // Arama durumu
  const [isConnecting, setIsConnecting] = useState(false); // PeerJS bağlantı durumu

  const handleCall = async () => {
    if (!user) {
      console.error('User not found');
      return;
    }
  
    if (!user.username) {
      console.error('User does not have a valid username');
      return;
    }
  
    if (!receiver) {
      console.error('Receiver Peer ID is missing');
      return;
    }
  
    try {
      console.log('Connecting PeerJS...');
      setIsConnecting(true); // Bağlantı durumu başlıyor
  
      // Kendi Peer bağlantısını başlat
      await connectPeer(user.username); // Burada kendi kullanıcı adını Peer ID olarak kullanıyoruz
  
      console.log('Starting call to:', receiver); // Aranan kişinin Peer ID'si
      setIsCalling(true); // Arama durumu başlıyor
  
      await startCall(receiver); 
    } catch (error) {
      console.error('Error during call:', error);
    } finally {
      setIsConnecting(false); // Bağlantı durumu tamamlanıyor
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

      {/* Bağlantı Bekleme Durumu */}
      {isConnecting && <p className="text-gray-500">Connecting...</p>}

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
