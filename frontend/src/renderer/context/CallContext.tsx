import React, { createContext, useContext, useState, ReactNode, useRef } from "react";
import Peer from "peerjs";
import apiClient from "../utils/apiClient";
import { UserType } from "../types";

interface IncomingCall {
  callerName: string;
  callerPhoto: string;
  callerPeerId: string;
}

interface CallContextProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isCalling: boolean;
  isWaitingForAcceptance: boolean;
  onCall: UserType | null;
  startCall: (isVideoCall: boolean, selectedUser: UserType) => Promise<void>;
  acceptCall: (incomingCall: IncomingCall | null, setIncomingCall: (call: IncomingCall | null) => void) => void;
}

const CallContext = createContext<CallContextProps | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [onCall, setOnCall] = useState<UserType | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  let peer: Peer | null = null; // PeerJS nesnesi

  const startCall = async (isVideoCall: boolean, selectedUser: UserType) => {
    try {
      peer = new Peer();

      // PeerJS bağlantısı açıldığında
      peer.on("open", async (peerId) => {
        console.log("Peer connected with ID:", peerId);

        setIsCalling(true); // Popup'u göster
        setIsWaitingForAcceptance(true); // Arama bekleme durumu

        // Giriş yapmış kullanıcıyı al
        const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

        // Backend'e arama başlatma isteği gönder
        await apiClient.post("/chat-app/start-call/", {
          sender: loggedInUser.username,
          receiver: selectedUser?.id,
          peer_id: peerId,
          isVideoCall: isVideoCall, // Arama türü: sesli/görüntülü
        });
      });

      // Arama çağrısı yanıtlandığında
      peer.on("call", (call) => {
        console.log("Arama kabul edildi, bağlanılıyor...");
        setIsWaitingForAcceptance(false); // Arama bekleme durumu sıfırla
        setIsCalling(false); // Popup'u kapat
        setOnCall(selectedUser); 

        // Medya cihazlarına erişim
        navigator.mediaDevices
          .getUserMedia({ video: isVideoCall, audio: true })
          .then((stream) => {
            call.answer(stream); // Aramayı yanıtla

            // Yerel video akışını ayarla ve oynat
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;

              // Oynatma işlemi için Promise kullan
              const playPromise = localVideoRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log("Yerel video oynatılıyor...");
                  })
                  .catch((err) => {
                    console.error("Yerel video oynatma hatası:", err);
                  });
              }
            }

            // Uzak video akışını dinle
            call.on("stream", (remoteStream) => {
              console.log("Uzak akış alındı");
              if (remoteVideoRef.current) {
                // Eğer akış farklıysa yeni akışı ata
                if (remoteVideoRef.current.srcObject !== remoteStream) {
                  remoteVideoRef.current.srcObject = remoteStream;

                  // Metadata yüklendiğinde oynat
                  remoteVideoRef.current.addEventListener("loadedmetadata", () => {
                    const playPromise = remoteVideoRef.current?.play();
                    if (playPromise !== undefined) {
                      playPromise
                        .then(() => {
                          console.log("Uzak video oynatılıyor...");
                        })
                        .catch((err) => {
                          console.error("Uzak video oynatma hatası:", err);
                        });
                    }
                  });
                }
              }
            });

            call.on("error", (err) => {
              console.error("Call error:", err);
            });
          })
          .catch((err) => {
            console.error("Medya cihazına erişim hatası:", err);
            setIsCalling(false); // Hata durumunda popup'u kapat
          });
      });

      peer.on("error", (err) => {
        console.error("PeerJS error:", err);
        setIsCalling(false); // Hata durumunda popup'u kapat
        setIsWaitingForAcceptance(false);
      });
    } catch (error) {
      console.error("Error starting call:", error);
      setIsCalling(false);
      setIsWaitingForAcceptance(false);
    }
  };

  const acceptCall = (incomingCall: IncomingCall | null, setIncomingCall: (call: IncomingCall | null) => void) => {
    if (!incomingCall) return;

    const peer = new Peer();

    peer.on("open", () => {
      console.log("Peer connected with ID:", peer.id);

      setIncomingCall(null); // Gelen çağrıyı kapat
      console.log("Incoming call accepted, connecting...", incomingCall);
      setOnCall({ username: incomingCall.callerName, photo: incomingCall.callerPhoto } as UserType);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Yerel video gösterimi
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            const localPlayPromise = localVideoRef.current.play();
            if (localPlayPromise !== undefined) {
              localPlayPromise
                .then(() => {
                  console.log("Local video is playing...");
                })
                .catch((error) => {
                  console.error("Error while playing local video:", error);
                });
            }
          }

          // Gelen çağrıya cevap verme
          const call = peer.call(incomingCall.callerPeerId, stream);

          call.on("stream", (remoteStream: MediaStream) => {
            console.log("Remote stream received:", remoteStream);

            if (
              remoteVideoRef.current &&
              remoteVideoRef.current.srcObject !== remoteStream
            ) {
              remoteVideoRef.current.srcObject = remoteStream;

              // Metadata tamamen yüklendiğinde video oynat
              remoteVideoRef.current.addEventListener("loadedmetadata", () => {
                const remotePlayPromise = remoteVideoRef.current?.play();
                if (remotePlayPromise !== undefined) {
                  remotePlayPromise
                    .then(() => {
                      console.log("Remote video is playing...");
                    })
                    .catch((error) => {
                      console.error("Error while playing remote video:", error);
                    });
                }
              });
            }
          });

          call.on("error", (err) => {
            console.error("Call error:", err);
          });
        })
        .catch((err) => {
          console.error("Error accessing media devices:", err);
        });
    });

    peer.on("call", (call) => {
      // Çağrıya cevap ver
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream); // Çağrıyı yanıtla
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;

            const localPlayPromise = localVideoRef.current.play();
            if (localPlayPromise !== undefined) {
              localPlayPromise
                .then(() => {
                  console.log("Local video is playing...");
                })
                .catch((error) => {
                  console.error("Error while playing local video:", error);
                });
            }
          }

          call.on("stream", (remoteStream: MediaStream) => {
            console.log("Remote stream received");
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;

              const remotePlayPromise = remoteVideoRef.current.play();
              if (remotePlayPromise !== undefined) {
                remotePlayPromise
                  .then(() => {
                    console.log("Remote video is playing...");
                  })
                  .catch((error) => {
                    console.error("Error while playing remote video:", error);
                  });
              }
            }
          });
        })
        .catch((err) => {
          console.error("Error accessing media devices:", err);
        });
    });
  };

  return (
    <CallContext.Provider
      value={{
        localVideoRef,
        remoteVideoRef,
        isCalling,
        isWaitingForAcceptance,
        onCall,
        startCall,
        acceptCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextProps => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
