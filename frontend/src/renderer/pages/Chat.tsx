import React, { useRef } from "react";
import Leftbar from "../components/leftbar";
import Rightbar from "../components/rightbar";
import { useChat } from "../context/ChatContext";
import apiClient from "../utils/apiClient"; // Backend ile iletişim için

const Chat: React.FC = () => {
  const { incomingCall, setIncomingCall, acceptCall } = useChat();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const handleAcceptCall = () => {
    if (localVideoRef.current && remoteVideoRef.current) {
      acceptCall(localVideoRef.current, remoteVideoRef.current);
    } else {
      console.error("Video elementleri bulunamadı!");
    }
  };

  const closePopup = async () => {
    if (incomingCall) {
      try {
        // Backend'e arama reddedildiğini bildir
        await apiClient.post("/chat-app/reject-call/", {
          caller: incomingCall.callerName,
        });
      } catch (error) {
        console.error("Arama reddedilirken bir hata oluştu:", error);
      }
    }
    setIncomingCall(null); // Popup'u kapat
  };

  return (
    <div className="flex h-screen">
      <Leftbar />
      <Rightbar
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />

      {/* Gelen Arama Popup'ı */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <img
              src={incomingCall.callerPhoto || "https://via.placeholder.com/100"}
              alt="Caller Avatar"
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
            <h2 className="text-xl font-bold mb-4">
              Incoming Call from {incomingCall.callerName}
            </h2>
            <div className="flex justify-center space-x-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleAcceptCall}
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={closePopup}
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

export default Chat;
