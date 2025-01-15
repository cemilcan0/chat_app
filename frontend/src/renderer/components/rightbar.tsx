import React, { useRef, useState, useEffect } from "react";
import useChatStore from "../store/chatStore";
import { useCall } from "../context/CallContext";
import phone from "../../../assets/icons/phone-call.svg";
import camera from "../../../assets/icons/camera.svg";
import info from "../../../assets/icons/info.svg";
import dummyPhoto from "../../../assets/images/photo.jpg";
import microphone from "../../../assets/icons/microphone.svg";
import callCancel from "../../../assets/icons/call-cancel.svg";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";


const Rightbar: React.FC = () => {
  const { selectedUser, sendMessage } = useChatStore();
  const {
    localVideoRef,
    remoteVideoRef,
    startCall,
    isCalling,
    isWaitingForAcceptance,
    onCall,
  } = useCall();

  const [message, setMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Emoji picker görünürlüğü

  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoStreamRef = useRef<MediaStream | null>(null);

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
        await sendMessage(message, loggedInUser);
        setMessage(""); // Mesaj gönderildikten sonra input alanını temizle
      } catch (error) {
        console.error("Mesaj gönderilirken hata oluştu:", error);
      }
    }
  };

  const handleEmojiClick = (emoji: EmojiClickData) => {
    const unicodeEmoji = emoji.emoji; // Bu Unicode karakterdir
    setMessage((prev) => prev + unicodeEmoji);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const closeCallPopup = () => {
    // Implement the logic to close the call popup
  };

  const handleStartCall = async (isVideoCall: boolean) => {
    try {
      if (selectedUser) {
        await startCall(isVideoCall, selectedUser);
      }
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  return (
    <div className="w-2/3 xl:w-3/4 bg-white flex">
      <div className="flex flex-col w-full p-4">
        {/* Video Alanı */}
        <div className={`border-b pb-4 ${!onCall ? "hidden" : ""}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center items-center">
            {/* Yerel Video */}
            <div className="w-full h-full flex justify-end items-center relative">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-auto max-h-[300px] rounded-lg aspect-video border shadow-md"
              ></video>
            </div>
            {/* Uzak Video */}
            <div className="w-full h-full flex justify-start items-center relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-auto max-h-[300px] rounded-lg aspect-video border shadow-md"
              ></video>
            </div>
          </div>
          <div className="flex justify-center space-x-4 py-4">
            <button>
              <img src={microphone} alt="Mute" className="w-6 h-6" />
            </button>
            <button>
              <img src={camera} alt="Toggle Camera" className="w-6 h-6" />
            </button>
            <button>
              <img src={callCancel} alt="End Call" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {selectedUser ? (
          <>
            <div className="flex items-center mb-4 border-b py-2">
              <img
                src={selectedUser.photo || dummyPhoto}
                alt="User Avatar"
                className="w-12 h-12 rounded-full mr-4 object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedUser.online ? "Online" : "Offline"}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleStartCall(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full"
                >
                  <img src={phone} alt="Voice Call" className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleStartCall(true)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full"
                >
                  <img src={camera} alt="Video Call" className="w-6 h-6" />
                </button>

                <button
                  className="text-gray-400 hover:text-gray-600 flex items-center justify-center p-2 rounded-full"
                  onClick={() => setIsInfoPanelOpen((prev) => !prev)} // Panel açma/kapatma
                >
                  <img src={info} alt="Information" className="w-5 h-5" />
                </button>

              </div>
            </div>

            {/* Mesaj Listesi */}
            <div className="flex-grow overflow-y-auto">
              {(() => {
                const messagesWithSeparators: JSX.Element[] = [];
                let lastDate: string | null = null;

                selectedUser.messages.forEach((msg, index) => {
                  const messageDate = new Date(msg.date_time).toDateString();

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
                      className={`flex items-center mb-2 ${msg.sender === loggedInUser.username
                        ? "justify-end mr-2"
                        : "justify-start ml-2"
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
                          className={`relative p-2 rounded-md w-fit max-w-xs ${msg.sender === loggedInUser.username
                            ? "bg-[#76589A] text-white"
                            : "bg-[#D4D4D7] text-black"
                            }`}
                        >
                          <p className="message-text emoji-text">
                            {typeof msg.text === "string" ? msg.text : "Invalid message"}
                          </p>

                          <span
                            className={`absolute top-1/2 ${msg.sender === loggedInUser.username
                              ? "right-[-8px]"
                              : "left-[-8px]"
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
                      {
                        msg.sender === loggedInUser?.username && (
                          <img
                            src={`https://testapi.berat-dogan.com${loggedInUser?.photo}` || dummyPhoto}
                            alt={loggedInUser?.name || "User"}
                            className="w-8 h-8 rounded-full ml-2 object-cover"
                          />
                        )
                      }
                    </div>
                  );
                });

                return messagesWithSeparators;
              })()}
              <div ref={messageEndRef}></div>
            </div>


            {/* Mesaj Gönderme Alanı */}
            <form onSubmit={handleSubmit} className="flex items-center bg-gray-100 px-4 py-2 rounded-full shadow-md relative ">
              {/* Emoji Picker */}

              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-50 emoji-picker-container">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
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

              {/* Emoji İkonu */}
              <button
                type="button"
                className="mr-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              >
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
      </div>

      {/* Çağrı Popup */}
      {
        isCalling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              {isWaitingForAcceptance ? (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    Waiting for {selectedUser?.name} to accept...
                  </h2>
                  <button
                    onClick={closeCallPopup}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Cancel Call
                  </button>
                </>
              ) : (
                <h2 className="text-xl font-bold mb-4">Connecting...</h2>
              )}
            </div>
          </div>
        )
      }
      {isInfoPanelOpen && (
        <div className="w-2/4 bg-gray-100 shadow-md">
          <div className="pt-20 flex flex-col items-center bg-gray-200 text-center">
            <img
              src={selectedUser?.photo || dummyPhoto}
              alt="User Avatar"
              className="w-40 h-40 rounded-full object-cover border-4 border-purple-500"
            />
            <h1 className="mt-5 text-gray-600 font-bold text-2xl">
              {selectedUser?.name || "Unknown"}
            </h1>
            <p className="mt-2 text-gray-600">
              {selectedUser?.username || "N/A"}
            </p>
          </div>

          <div className="mt-4 bg-gray-200 p-3 rounded-md shadow-inner">
            <h2 className="text-gray-700 font-semibold text-m">Status:</h2>
            <p className="text-gray-600 mt-1 text-sm">{selectedUser?.status || "N/A"}</p>
          </div>

          <div>
            <div className="mt-4 bg-gray-200 p-3 rounded-md shadow-inner">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-300"
                    fill="black"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                    />
                  </svg>
                  <p className="ml-4">Starred Messages</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-300"
                  fill="black"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>

            </div>
            <div className="mt-4">
              <div className="bg-gray-200">
                <div className="flex justify-between ">
                  <h2 className="text-gray-700 font-semibold text-lg p-2">Shared Media</h2>
                  <p className="text-blue-500 cursor-pointer self-end p-2">See all</p>

                </div>

                <div className="grid grid-cols-2 gap-4  p-4 rounded-md ">
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="w-24 h-24 bg-gray-300 flex items-center justify-center rounded-md">
                      <p className="text-gray-500 text-sm">No Image</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


        </div>
      )}
    </div >

  );
};

export default Rightbar;
