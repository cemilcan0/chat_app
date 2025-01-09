import React, { createContext, useContext, useState, ReactNode } from "react";
import apiClient from "../utils/apiClient";
import Peer from "peerjs";

interface Message {
  text: string;
  sender: string;
  date_time: string;
  read: boolean;
}

interface User {
  username: string;
  name: string;
  photo: string;
  online: boolean;
  status: string;
  messages: Message[];
  peerId?: string;
}

interface IncomingCall {
  callerName: string;
  callerPhoto: string;
  callerPeerId: string;
}

interface ChatContextProps {
  users: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
  addMessage: (username: string, message: Message) => void;
  incomingCall: IncomingCall | null;
  setIncomingCall: (call: IncomingCall | null) => void;
  acceptCall: (localVideoRef: HTMLVideoElement, remoteVideoRef: HTMLVideoElement) => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Kullanıcıları ve mesajları API'den çek
  React.useEffect(() => {
    const fetchUsersWithMessages = async () => {
      try {
        const response = await apiClient.get("/chat-app/friends/");
        const fetchedUsers: User[] = response.data;
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users and messages:", error);
      }
    };

    fetchUsersWithMessages();
  }, []);

  // WebSocket bağlantısı ve mesaj dinleme
  React.useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (!storedUser || !storedUser.username) {
      console.error("User not logged in.");
      return;
    }

    // WebSocket bağlan
    const ws = new WebSocket(
      `wss://testapi.berat-dogan.com/ws/message/${storedUser.username}/`
    );
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status === "new_message") {
          const newMessage: Message = {
            text: data.message.text,
            sender: data.message.sender,
            date_time: data.message.date_time,
            read: false,
          };
          addMessage(data.message.sender, newMessage); // Mesajı context'e ekle
        } else if (data.status === "new_call") {
          const caller = data.message.display;
          const callerPeerId = data.message.data.peer_id;
          setIncomingCall({
            callerName: caller.name || "Unknown",
            callerPhoto: caller.photo || "https://via.placeholder.com/150",
            callerPeerId: callerPeerId,
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Kullanıcı seçimi
  const handleSetSelectedUser = (user: User) => {
    setSelectedUser((prevUser: User | null) => ({
      ...user,
      peerId: user.peerId || prevUser?.peerId, // Eğer mevcut bir peerId varsa, koru
    }));
  };

  // Yeni mesaj ekleme
  const addMessage = (username: string, message: Message) => {
    // Kullanıcılar arasında ilgili kullanıcıyı bul ve mesajlarını güncelle
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) =>
        user.username === username
          ? { ...user, messages: [...user.messages, message] }
          : user
      );
      return updatedUsers;
    });

    // Eğer seçili kullanıcı güncelleniyorsa
    if (selectedUser?.username === username) {
      setSelectedUser((prevSelectedUser) => {
        if (!prevSelectedUser) return null;

        const updatedMessages = [...prevSelectedUser.messages, message];
        const updatedSelectedUser = {
          ...prevSelectedUser,
          messages: updatedMessages,
        };

        return updatedSelectedUser;
      });
    }
  };

  // Gelen çağrıyı kabul etme
  const acceptCall = (
    localVideoRef: HTMLVideoElement,
    remoteVideoRef: HTMLVideoElement
  ) => {
    if (!incomingCall) return;

    const peer = new Peer();

    peer.on("open", () => {
      console.log("Peer connected with ID:", peer.id);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Yerel video gösterimi
          localVideoRef.srcObject = stream;
          const localPlayPromise = localVideoRef.play();
          if (localPlayPromise !== undefined) {
            localPlayPromise
              .then(() => {
                console.log("Local video is playing...");
              })
              .catch((error) => {
                console.error("Error while playing local video:", error);
              });
          }

          // Gelen çağrıya cevap verme
          const call = peer.call(incomingCall.callerPeerId, stream);

          call.on("stream", (remoteStream: MediaStream) => {
            console.log("Remote stream received:", remoteStream);

            if (remoteVideoRef.srcObject !== remoteStream) {
              remoteVideoRef.srcObject = remoteStream;

              // Metadata tamamen yüklendiğinde video oynat
              remoteVideoRef.addEventListener("loadedmetadata", () => {
                const remotePlayPromise = remoteVideoRef.play();
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
        .catch((err) => console.error("Error accessing media devices:", err));
    });

    peer.on("call", (call) => {
      // Çağrıya cevap ver
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream); // Çağrıyı yanıtla
          localVideoRef.srcObject = stream;

          const localPlayPromise = localVideoRef.play();
          if (localPlayPromise !== undefined) {
            localPlayPromise
              .then(() => {
                console.log("Local video is playing...");
              })
              .catch((error) => {
                console.error("Error while playing local video:", error);
              });
          }

          call.on("stream", (remoteStream: MediaStream) => {
            console.log("Remote stream received");
            remoteVideoRef.srcObject = remoteStream;

            const remotePlayPromise = remoteVideoRef.play();
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
        })
        .catch((err) => console.error("Error accessing media devices:", err));
    });

    setIncomingCall(null); // Popup'ı kapat
  };

  return (
    <ChatContext.Provider
      value={{
        users,
        selectedUser,
        setSelectedUser: handleSetSelectedUser,
        addMessage,
        incomingCall,
        setIncomingCall,
        acceptCall,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
