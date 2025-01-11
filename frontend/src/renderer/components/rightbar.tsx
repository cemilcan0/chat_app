import React, { useEffect, useRef, useState } from "react";
import useChatStore from "../store/chatStore";
import phone from "../../../assets/icons/phone-call.svg";
import camera from "../../../assets/icons/camera.svg";
import microphone from "../../../assets/icons/microphone.svg";
import callCancel from "../../../assets/icons/call-cancel.svg";
import dummyPhoto from "../../../assets/images/photo.jpg";
import Peer from "peerjs";
import apiClient from "../utils/apiClient";

interface RightbarProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

const Rightbar: React.FC<RightbarProps> = ({ localVideoRef, remoteVideoRef }) => {
  const { selectedUser, sendMessage } = useChatStore();
  const [message, setMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const [isCalling, setIsCalling] = useState(false); // Popup göstermek için state
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false); // Arama kabul durumu

  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Scroll işlemi
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedUser?.messages]);

  const handleSendMessage = async () => {
    if (selectedUser && message.trim() !== "") {
      try {
        await sendMessage(message, loggedInUser); // Zustand'daki `sendMessage` fonksiyonu
        setMessage(""); // Mesaj gönderildikten sonra input alanını temizle
      } catch (error) {
        console.error("Mesaj gönderilirken hata oluştu:", error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
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
      {/* Video Alanı */}
      {
        <div className="border-b">
          <div className="flex items-center space-x-4 justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="h-auto aspect-video bg-black"
            ></video>
            <video
              ref={remoteVideoRef}
              autoPlay
              className="h-auto aspect-video bg-black"
            ></video>
          </div>
          <div className="flex justify-center space-x-4 py-4">
            <button>
              <img src={microphone} alt="" className="w-6 h-6" />
            </button>
            <button>
              <img src={camera} alt="" className="w-6 h-6" />
            </button>
            <button>
              <img src={callCancel} alt="" className="w-6 h-6" />
            </button>
          </div>
        </div>
      }
      {selectedUser ? (
        <>
          <div className="flex items-center mb-4 border-b py-2">
            {/* Kullanıcı Avatarı */}
            <img
              src={selectedUser.photo || "https://via.placeholder.com/50"}
              alt="User Avatar"
              className="w-12 h-12 rounded-full mr-4 object-cover"
            />
            {/* Kullanıcı Bilgileri */}
            <div className="flex-1">
              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
              <p className="text-sm text-gray-500 flex items-center">
                {selectedUser.online ? (
                  <>
                    <span className="text-green-500 mr-1">●</span> Online
                  </>
                ) : (
                  "Offline"
                )}
              </p>
            </div>
            {/* Sağdaki Aksiyon Butonları */}
            <div className="flex items-center justify-end space-x-4">
              {/* Sesli Arama */}
              <button
                className="text-gray-400 hover:text-gray-600 flex items-center justify-center p-2 rounded-full"
                onClick={() => startCall(false)} // Sesli arama
              >
                <img src={phone} alt="Phone Call" className="w-5 h-5" />
              </button>
              {/* Görüntülü Arama */}
              <button
                className="text-gray-400 hover:text-gray-600 flex items-center justify-center p-2 rounded-full"
                onClick={() => startCall(true)} // Görüntülü arama
              >
                <img src={camera} alt="Video Call" className="w-6 h-6" />
              </button>
            </div>
          </div>


          {/* Mesaj listesi */}
          <div className="flex-grow overflow-y-auto">
            {(() => {
              const messagesWithSeparators: JSX.Element[] = []; // Tip açıkça belirtildi
              let lastDate: string | null = null; // Tarih tipi string veya null olabilir

              selectedUser.messages.forEach((msg, index) => {
                const messageDate = new Date(msg.date_time).toDateString(); // Tarihi al

                // Tarih separatoru ekle
                if (messageDate !== lastDate) {
                  lastDate = messageDate;
                  messagesWithSeparators.push(
                    <div
                      key={`date-${index}`}
                      className="flex items-center justify-center text-gray-400 text-xs my-4"
                    >
                      <div className="w-2/5 border-t border-gray-300"></div>
                      <span className="px-2">{messageDate}</span>
                      <div className="w-2/5 border-t border-gray-300"></div>
                    </div>

                  );
                }

                // Mesaj kutusunu ekle
                messagesWithSeparators.push(
                  <div
                    key={index}
                    className={`flex items-center mb-2 ${msg.sender === loggedInUser.username ? "justify-end mr-2" : "justify-start ml-2"
                      }`}
                  >
                    {msg.sender !== loggedInUser?.username && (
                      <img
                        src={selectedUser?.photo || dummyPhoto}
                        alt={selectedUser?.name || "User"}
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                    )}
                    <div className="flex items-center max-w-full">
                      {msg.sender === loggedInUser.username && (
                        <span className="text-xs text-gray-400 mr-2">
                          {typeof msg.date_time === "string"
                            ? new Date(msg.date_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : ""}
                        </span>
                      )}
                      <div
                        className={`relative p-2 rounded-md w-fit ${msg.sender === loggedInUser.username
                          ? "bg-[#76589A] text-white"
                          : "bg-[#D4D4D7] text-black"
                          }`}
                      >
                        <p className="break-words text-sm">
                          {typeof msg.text === "string" ? msg.text : "Invalid message"}
                        </p>
                        <span
                          className={`absolute top-1/2 ${msg.sender === loggedInUser.username ? "right-[-8px]" : "left-[-8px]"
                            } transform -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent ${msg.sender === loggedInUser.username
                              ? "border-l-[8px] border-l-[#76589A]"
                              : "border-r-[8px] border-r-[#D4D4D7]"
                            } border-b-[8px] border-b-transparent`}
                        ></span>
                      </div>
                      {msg.sender !== loggedInUser.username && (
                        <span className="text-xs text-gray-400 ml-2">
                          {typeof msg.date_time === "string"
                            ? new Date(msg.date_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : ""}
                        </span>
                      )}
                    </div>
                    {msg.sender === loggedInUser?.username && (
                      <img
                        src={`https://testapi.berat-dogan.com${loggedInUser?.photo}` || dummyPhoto}
                        alt={loggedInUser?.name || "User"}
                        className="w-8 h-8 rounded-full ml-2 object-cover"
                      />
                    )}
                  </div>
                );
              });

              return messagesWithSeparators;
            })()}
            <div ref={messageEndRef}></div>
          </div>


          {/* Mesaj gönderme alanı */}
          <form onSubmit={handleSubmit} className="flex items-center bg-gray-100 px-4 py-2 rounded-full shadow-md">
            {/* Ataş ikonu */}
            <button type="button" className="mr-2 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
              </svg>
            </button>

            {/* Metin alanı */}
            <input
              type="text"
              className="flex-grow border-none bg-transparent focus:outline-none text-gray-700 placeholder-gray-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
            />

            {/* Emoji ikonu */}
            <button type="button" className="mr-2 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 00-5.656 0M9 10h.01M15 10h.01M12 16h0"
                />
              </svg>
            </button>

            {/* Gönderme düğmesi */}
            <button type="submit" className="ml-2 text-white bg-purple-600 hover:bg-purple-700 p-2 rounded-full shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </button>
          </form>

        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a user to start chatting
        </div>
      )
      }

      {/* Arama Popup'u */}
      {
        isCalling && (
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
        )
      }
    </div>
  );
};

export default Rightbar;
