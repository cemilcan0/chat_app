import React, { useRef } from "react";
import Leftbar from "../components/leftbar";
import Rightbar from "../components/rightbar";
import { useChat } from "../context/ChatContext";

const Chat: React.FC = () => {
  const { incomingCall, setIncomingCall, acceptCall } = useChat();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const handleAcceptCall = () => {
    if (localVideoRef.current && remoteVideoRef.current) {
      acceptCall(localVideoRef.current, remoteVideoRef.current);
    }
  };

  const closePopup = () => {
    setIncomingCall(null); // Popup'ı kapat
  };

  return (
    <div className="flex h-screen">
      <Leftbar />
      <Rightbar />

      {/* Gelen Arama Popup'ı */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <img
              src={incomingCall.callerPhoto}
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

      {/* Video Alanı */}
      <div
        className={`fixed bottom-0 right-0 m-4 ${!localVideoRef.current?.srcObject || !remoteVideoRef.current?.srcObject
            ? "hidden"
            : ""
          }`}
      >
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="w-48 h-48 bg-black"
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-48 h-48 bg-black"
        ></video>
      </div>
    </div>
  );
};

export default Chat;
