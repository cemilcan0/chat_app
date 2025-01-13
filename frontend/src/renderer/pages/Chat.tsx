import React, { useEffect, useMemo, useRef } from "react";
import Leftbar from "../components/leftbar";
import Rightbar from "../components/rightbar";
import useChatStore from "../store/chatStore";
import { useCall } from "../context/CallContext";

const Chat: React.FC = () => {
  const { initializeSocket, closeSocket, fetchUsers } = useChatStore();

  const storedUser = useMemo(() => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : {};
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return {};
    }
  }, []);

  useEffect(() => {
    if (!storedUser || !storedUser.username) return;

    try {
      // const socketUrl = `wss://testapi.berat-dogan.com/ws/message/${storedUser.username}/`;
      const socketUrl = `ws://localhost:8000/ws/message/${storedUser.username}/`;
      initializeSocket(socketUrl);
    } catch (error) {
      console.error("Error initializing socket:", error);
    }

    return () => {
      try {
        closeSocket();
      } catch (error) {
        console.error("Error closing socket:", error);
      }
    };
  }, [initializeSocket, closeSocket, storedUser.username]);

  useEffect(() => {
    if (!storedUser || !storedUser.username) return;

    try {
      fetchUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [fetchUsers, storedUser.username]);

  const { incomingCall, setIncomingCall } = useChatStore();
  const { acceptCall } = useCall();

  const closePopup = () => {
    // Logic to close the popup
    setIncomingCall(null);
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
                onClick={() => acceptCall(incomingCall, setIncomingCall)}
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
