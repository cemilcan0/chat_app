import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import phone from "../../../assets/icons/phone-call.svg";
import camera from "../../../assets/icons/camera.svg";
import { initializePeer } from "../utils/peer";
import Peer from "peerjs";
import apiClient from "../utils/apiClient";

interface RightbarProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

const Rightbar: React.FC<RightbarProps> = ({ localVideoRef, remoteVideoRef }) => {
  const { selectedUser, addMessage } = useChat();
  const [message, setMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const [isCalling, setIsCalling] = useState(false); // Popup göstermek için state
  const [isVideoCall, setIsVideoCall] = useState(false); // Aramanın türü (sesli/görüntülü)
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false); // Arama kabul durumu

  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Scroll işlemi
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedUser?.messages]);

  const sendMessage = async () => {
    if (selectedUser && message.trim() !== "") {
      const msg = {
        text: message,
        sender: loggedInUser.username,
        receiver: selectedUser.username,
        date_time: new Date().toISOString(),
        read: true,
      };

      try {
        await apiClient.post("/chat-app/message/", {
          text: msg.text,
          receiver: msg.receiver,
        });

        addMessage(selectedUser.username, msg);
        setMessage("");
      } catch (error) {
        console.error("Mesaj gönderilirken hata oluştu:", error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Arama başlatma isteği
  const startCall = async (isVideoCall: boolean) => {
    try {
      const peer = new Peer();

      peer.on("open", async (peerId) => {
        console.log("Peer connected with ID:", peerId);

        setIsCalling(true); // Popup'u göster
        setIsWaitingForAcceptance(true); // Arama bekleme durumu

        // Backend'e arama başlatma isteği gönder
        await apiClient.post("/chat-app/start-call/", {
          sender: loggedInUser.username,
          receiver: selectedUser?.username,
          peer_id: peerId,
          is_video_call: isVideoCall, // Arama türü: sesli/görüntülü
        });
      });

      // Arama çağrısı yanıtlandığında
      peer.on("call", (call) => {
        console.log("Arama kabul edildi, bağlanılıyor...");
        setIsWaitingForAcceptance(false); // Arama kabul durumu sıfırla

        // Medya cihazlarına erişim
        navigator.mediaDevices
          .getUserMedia({ video: isVideoCall, audio: true })
          .then((stream) => {
            call.answer(stream); // Aramayı yanıtla
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream; // Yerel video
              localVideoRef.current
                .play()
                .catch((err) =>
                  console.error("Error while playing local video:", err)
                );
            }

            // Uzak video akışını dinle
            call.on("stream", (remoteStream) => {
              console.log("Uzak akış alındı");
              if (remoteVideoRef.current) {
                // Aynı stream'in birden fazla kez atanmasını önlemek için kontrol
                if (remoteVideoRef.current.srcObject !== remoteStream) {
                  remoteVideoRef.current.srcObject = remoteStream;
                  remoteVideoRef.current
                    .play()
                    .catch((err) =>
                      console.error("Error while playing remote video:", err)
                    );
                }
              }
            });

            call.on("error", (err) => {
              console.error("Call error:", err);
            });
          })
          .catch((err) => {
            console.error("Media device error:", err);
            setIsCalling(false); // Hata durumunda popup'u kapat
          });
      });

      peer.on("error", (err) => {
        console.error("PeerJS error:", err);
        setIsCalling(false); // Hata durumunda popup'u kapat
        setIsWaitingForAcceptance(false);
      });
    } catch (error) {
      console.error("Arama başlatılırken hata oluştu:", error);
    }
  };

  const closeCallPopup = () => {
    setIsCalling(false); // Popup'u kapat
    setIsWaitingForAcceptance(false); // Arama bekleme durumunu sıfırla
  };

  return (
    <div className="w-2/3 bg-white p-4 flex flex-col">
      {selectedUser ? (
        <>
          <div className="flex items-center mb-4 border-b pb-2">
            <img
              src={selectedUser.photo || "https://via.placeholder.com/50"}
              alt="User Avatar"
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
              <p className="text-sm text-gray-500">
                {selectedUser.online ? "Online" : "Offline"}
              </p>
            </div>
            <div className="ml-auto flex space-x-2">
              {/* Sesli arama butonu */}
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={() => startCall(false)} // Sesli arama
              >
                <img src={phone} alt="Voice Call" className="w-5 h-5 text-white" />
              </button>

              {/* Görüntülü arama butonu */}
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => startCall(true)} // Görüntülü arama
              >
                <img src={camera} alt="Video Call" className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Mesaj listesi */}
          <div className="flex-grow overflow-y-auto">
            {selectedUser.messages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-2 ${msg.sender === loggedInUser.username
                  ? "justify-end mr-2"
                  : "justify-start"
                  }`}
              >
                <div className="p-2 rounded w-max max-w-xs bg-gray-100">
                  <p className="break-words">{msg.text}</p>
                  <span className="text-xs text-gray-500 block mt-1">
                    {new Date(msg.date_time).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>

          {/* Mesaj gönderme alanı */}
          <form onSubmit={handleSubmit} className="flex items-center mt-4">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded p-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </form>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a user to start chatting
        </div>
      )}

      {/* Arama Popup'u */}
      {isCalling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            {isWaitingForAcceptance ? (
              <>
                <h2 className="text-xl font-bold mb-4">
                  Waiting for {selectedUser?.name} to accept the call...
                </h2>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={closeCallPopup}
                >
                  Cancel Call
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Call Accepted!</h2>
                <p className="text-gray-700">Connecting to {selectedUser?.name}...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Alanı */}
      <div className="fixed bottom-0 right-0 m-4">
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

export default Rightbar;
