import React, { useRef } from "react";
import Leftbar from "../components/leftbar";
import Rightbar from "../components/rightbar";
import useChatStore from "../store/chatStore";
import { useCall } from "../context/CallContext";

const Chat: React.FC = () => {
  const { incomingCall } = useChatStore();
  const { localVideoRef, remoteVideoRef, acceptCall } = useCall();

  const closePopup = () => {
    // Logic to close the popup
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
                onClick={() => acceptCall(incomingCall.callerPeerId)}
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
