import { create } from "zustand";
import apiClient from "../utils/apiClient";
import websocketService from "../utils/websocket";
import { UserType, MessageType } from "../types";
import Peer from "peerjs";

interface IncomingCall {
  callerName: string;
  callerPhoto: string;
  callerPeerId: string;
  isVideoCall: boolean;
}

interface ChatStore {
  resetStore: () => void;

  users: UserType[];
  selectedUser: UserType | null;
  incomingCall: IncomingCall | null;
  friendRequests: UserType[];
  fetchUsers: () => Promise<void>;
  setSelectedUser: (user: UserType | null) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  sendMessage: (messageText: string, loggedInUser: UserType) => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  acceptFriendRequest: (username: string) => Promise<void>;
  declineFriendRequest: (username: string) => Promise<void>;
  deleteFriendRequest: (username: string) => Promise<void>;
  initializeSocket: (url: string) => void;
  closeSocket: () => void;
  acceptCall: (
    localVideoRef: HTMLVideoElement,
    remoteVideoRef: HTMLVideoElement
  ) => void;
}

const useChatStore = create<ChatStore>((set, get) => ({
  users: [],
  selectedUser: null,
  incomingCall: null,
  friendRequests: [],

  fetchUsers: async () => {
    try {
      const response = await apiClient.get("/chat-app/friends/");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      const fetchedUsers: UserType[] = response.data.map((user: UserType) => ({
        ...user,
        unreadMessages: user.messages.filter(
          (msg) => !msg.read && msg.sender !== storedUser.username
        ).length,
      }));

      set({ users: fetchedUsers });
    } catch (error) {
      console.error("Error fetching users and messages:", error);
    }
  },

  setSelectedUser: (user: UserType | null) => {
    set({ selectedUser: user });

    if (user) {
      apiClient
        .post(`/chat-app/read-messages/${user.username}`)
        .then(() => {
          set((state) => ({
            users: state.users.map((u) =>
              u.username === user.username
                ? { ...u, unreadMessages: 0 }
                : u
            ),
          }));
        })
        .catch((error) => {
          console.error("Error marking messages as read:", error);
        });
    }
  },

  setIncomingCall: (call: IncomingCall | null) => {
    set({ incomingCall: call });
  },

  sendMessage: async (messageText: string, loggedInUser: UserType) => {
    const { selectedUser } = get();
    if (!selectedUser || messageText.trim() === "") return;

    const newMessage = {
      text: messageText,
      sender: loggedInUser.username,
      receiver: selectedUser.id,
      date_time: new Date().toISOString(),
      read: true,
    };

    try {
      await apiClient.post("/chat-app/message/", {
        text: newMessage.text,
        receiver: newMessage.receiver,
      });

      set((state) => ({
        users: [
          {
            ...selectedUser,
            messages: [...selectedUser.messages, newMessage],
          },
          ...state.users
            .filter((user) => user.username !== selectedUser.username)
            .map((user) =>
              user.username === selectedUser.username
                ? {
                  ...user,
                  messages: [...user.messages, newMessage],
                }
                : user
            ),
        ],
        selectedUser: {
          ...selectedUser,
          messages: [...selectedUser.messages, newMessage],
        },
      }));
    } catch (error) {
      console.error("Error sending message:", error);
    }
  },

  fetchFriendRequests: async () => {
    try {
      const response = await apiClient.get("/chat-app/pending-friend-requests/");
      set({ friendRequests: response.data });
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  },

  acceptFriendRequest: async (username: string) => {
    try {
      const response = await apiClient.post("/chat-app/accept-friend-request/", { username });
      const newFriend = response.data.data;

      set((state) => ({
        friendRequests: state.friendRequests.filter(
          (request) => request.username !== username
        ),
        users: [newFriend, ...state.users],
      }));
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  },

  declineFriendRequest: async (username: string) => {
    try {
      await apiClient.post("/chat-app/decline-friend-request/", { username });
      set((state) => ({
        friendRequests: state.friendRequests.filter(
          (request) => request.username !== username
        ),
      }));
    } catch (error) {
      console.error("Error declining friend request:", error);
    }
  },

  deleteFriendRequest: async (username: string) => {
    const { users, selectedUser } = get();

    try {
      const response = await apiClient.post("/chat-app/delete-friend/", { username });

      // Kullanıcıyı arkadaş listesinden çıkar
      const updatedUsers = users.filter((user) => user.username !== username);
      set((state) => ({
        users: updatedUsers
      }))

      // Eğer silinen kullanıcı seçiliyse, seçim temizlenir
      if (selectedUser?.username === username) {
        set((state) => ({
          selectedUser: null
        }))
      }

      console.log("Friend deleted successfully:", response.data);
    } catch (error) {
      console.error("Error deleting friend:", error);
      throw error;
    }
  },

  initializeSocket: (url: string) => {
    websocketService.connect(url);

    websocketService.onMessage((data) => {
      console.log("New message received:", data);

      if (data.status === "new_message") {
        const { sender, text, date_time } = data.message;
        const newMessage: MessageType = { text, sender, date_time, read: false };

        set((state) => {
          const updatedUsers = state.users
            .map((user) =>
              user.username === sender
                ? {
                  ...user,
                  messages: [...user.messages, newMessage],
                  unreadMessages:
                    user.username === state.selectedUser?.username
                      ? user.unreadMessages
                      : user.unreadMessages + 1,
                }
                : user
            )
            .filter((user) => user.username !== sender); 

          const senderUser = state.users.find((user) => user.username === sender);
          const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
          if (senderUser) {
            updatedUsers.unshift({
              ...senderUser,
              messages: [...senderUser.messages, newMessage],
              unreadMessages:
                senderUser.username === state.selectedUser?.username || senderUser.username === loggedInUser.username
                  ? senderUser.unreadMessages
                  : senderUser.unreadMessages + 1,
            });
          }

          return {
            users: updatedUsers,
          };
        });

        if (get().selectedUser?.username === sender) {
          set((state) => ({
            selectedUser: {
              ...state.selectedUser!,
              messages: [...state.selectedUser!.messages, newMessage],
            },
          }));

          apiClient
            .post(`/chat-app/read-messages/${sender}`)
            .then(() => {
              set((state) => ({
                users: state.users.map((user) =>
                  user.username === sender
                    ? { ...user, unreadMessages: 0 }
                    : user
                ),
              }));
            })
            .catch((error) => {
              console.error("Error marking messages as read:", error);
            });
        }
      } else if (data.status === "new_call") {
        set({
          incomingCall: {
            callerName: data.message.display.name,
            callerPhoto: data.message.display.photo,
            callerPeerId: data.message.data.peer_id,
            isVideoCall: data.message.data.isVideoCall,
          },
        });
      } else if (data.status === "new_friendship_request") {
        // Yeni arkadaşlık isteği geldiğinde friendRequests'e ekle
        const newRequest = data.message.sender; // Doğru veri yapısını kullan
        set((state) => ({
          friendRequests: [...state.friendRequests, newRequest],
        }));
      } else if (data.status === "accepted_friendship_request") {
        // Arkadaşlık isteği kabul edildiğinde users'a ekle (ilk sıraya)
        const newFriend = data.message.receiver; // Yeni arkadaş bilgisi
        set((state) => ({
          users: [newFriend, ...state.users], // Yeni kullanıcıyı ilk sıraya ekle
        }));
      }
    });
  },
  

  resetStore: () => {
    set(() => ({
      users: [],
      friendRequests: [],
      selectedUser: null, // Mevcut seçili kullanıcıyı sıfırla
      messages: [], // Eğer mesajları da tutuyorsanız temizleyin
      // Diğer state'leri de burada sıfırlayın
    }));
  },
  

  closeSocket: () => {
    websocketService.close();
  },

  acceptCall: (
    localVideoRef: HTMLVideoElement,
    remoteVideoRef: HTMLVideoElement
  ) => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    const peer = new Peer();

    peer.on("open", () => {
      console.log("Peer connected with ID:", peer.id);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
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

          const call = peer.call(incomingCall.callerPeerId, stream);

          call.on("stream", (remoteStream: MediaStream) => {
            console.log("Remote stream received:", remoteStream);

            if (remoteVideoRef.srcObject !== remoteStream) {
              remoteVideoRef.srcObject = remoteStream;

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
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream);
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

    set({ incomingCall: null });
  },
}));

export default useChatStore;
