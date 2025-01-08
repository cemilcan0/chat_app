import { create } from 'zustand';
import Peer from 'peerjs';
import apiClient from '../apiClient';
import { ChatStateType, ChatType, MessageType } from '../types';

const useChatStore = create<ChatStateType>((set, get) => ({
  chats: [],
  activeChat: null,
  user: null,
  socket: null,
  notificationSocket: null,
  friendRequests: [],
  incomingCall: null,
  peer: null, // PeerJS nesnesi
  localStream: null, // Yerel medya akışı
  remoteStream: null, // Uzaktan gelen medya akışı

  // Chatleri getir
  fetchChats: async () => {
    try {
      const response = await apiClient.get('/chat-app/friends/');

      const chatsWithUnread = response.data.map((chat: ChatType) => {
        const unreadCount = chat.messages.filter((message: MessageType) => !message.read).length;
        return { ...chat, unreadCount };
      });

      set({ chats: chatsWithUnread });
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  },

  // Arkadaşlık isteklerini getir
  fetchFriendRequests: async () => {
    try {
      const response = await apiClient.get('/chat-app/pending-friend-requests/');
      console.log('Pending friend requests fetched:', response.data);

      set({ friendRequests: response.data });
    } catch (error) {
      console.error('Error fetching pending friend requests:', error);
    }
  },

  // Mesaj gönder
  sendMessage: async (text, receiver) => {
    const { socket, user, activeChat, chats } = get();

    if (socket) {
      socket.send(
        JSON.stringify({
          type: 'new_message',
          message: text,
          receiver: receiver,
        })
      );
    } else {
      console.warn('WebSocket is not connected!');
    }

    try {
      const response = await apiClient.post('/chat-app/message/', {
        text: text,
        receiver: receiver,
        sender: user?.username,
      });

      const newMessage = {
        text: text,
        sender: user?.username || 'unknown',
        date_time: new Date().toISOString(),
        read: true,
      };

      const updatedChats = chats.map((chat) =>
        chat.username === activeChat?.username
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      );

      const updatedActiveChat = activeChat
        ? { ...activeChat, messages: [...activeChat.messages, newMessage] }
        : null;

      set({ chats: updatedChats, activeChat: updatedActiveChat });
    } catch (error) {
      console.error('Error sending message via POST:', error);
    }
  },

  // Aktif chati belirle
  setActiveChat: (chat) => {
    set({ activeChat: chat });
  },

  // Gelen çağrıyı ayarlamak veya sıfırlamak için fonksiyon
  setIncomingCall: (callData) => {
    set({ incomingCall: callData });
  },

  // Kullanıcı bilgilerini yükle
  loadUser: () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      set({ user: JSON.parse(userData) });
    } else {
      console.warn('No user found in localStorage!');
    }
  },

  // Arkadaşlık isteği gönder
  addFriend: async (username) => {
    try {
      const response = await apiClient.post('/chat-app/send-friend-request/', { username });
      console.log('Friend request sent:', response.data);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  },

  // Arkadaşlık isteğini kabul et
  acceptFriendRequest: async (username) => {
    try {
      const response = await apiClient.post('/chat-app/accept-friend-request/', { username });
      console.log('Friend request accepted:', response.data);

      set((state) => ({
        friendRequests: state.friendRequests.filter((request) => request.username !== username),
      }));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  },

  // Arkadaşlık isteğini reddet
  declineFriendRequest: async (username) => {
    try {
      const response = await apiClient.post('/chat-app/decline-friend-request/', { username });
      console.log('Friend request declined:', response.data);

      set((state) => ({
        friendRequests: state.friendRequests.filter((request) => request.username !== username),
      }));
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  },

  // PeerJS bağlantısını başlat
  connectPeer: (peerId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Kendi kullanıcı adınızı Peer ID olarak kullanın
        const peer = new Peer(peerId); 
  
        // PeerJS bağlantısı başarılı olduğunda
        peer.on('open', (id) => {
          console.log('PeerJS connected with ID:', id);
          set({ peer }); // Peer nesnesini kaydet
          resolve(); // Promise tamamlandı
        });
  
        // Gelen çağrıyı işleme
        peer.on('call', (call) => {
          console.log('Incoming call:', call);
  
          const acceptCall = async () => {
            try {
              // Yerel medya akışını al
              const localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
              set({ localStream });
  
              // Çağrıyı cevapla
              call.answer(localStream);
  
              // Uzak akışı al
              call.on('stream', (remoteStream) => {
                console.log('Remote stream received');
                set({ remoteStream });
              });
  
              call.on('close', () => {
                console.log('Call ended');
                set({ remoteStream: null, localStream: null });
              });
  
              call.on('error', (err: Error) => {
                console.error('Error during call:', err);
              });
            } catch (error) {
              console.error('Error accepting call:', error);
            }
          };
  
          // Gelen çağrıyı sakla
          set({
            incomingCall: {
              call,
              accept: acceptCall,
              display: {
                photo: 'https://example.com/default-photo.jpg',
                name: 'Unknown Caller',
                status: 'Incoming call...',
              },
            },
          });
        });
  
        // PeerJS bağlantı hatalarını ele al
        peer.on('error', (err: Error) => {
          console.error('PeerJS error:', err);
          set({ peer: null });
          reject(err); // Hata durumunda promise'i reddet
        });
      } catch (error) {
        console.error('Error initializing PeerJS:', error);
        reject(error); // Genel hata durumu
      }
    });
  },
  
  

  // Sesli çağrı başlat
  startCall: async (receiver: string) => {
    const { peer, localStream } = get();
  
    if (!peer) {
      console.error('PeerJS instance not initialized!');
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      set({ localStream: stream });
  
      // Logları buraya ekle
      console.log('Local stream before call:', stream);
      console.log('Peer instance before call:', peer);
  
      const call = peer.call(receiver, stream);
  
      if (!call) {
        console.error('Failed to establish a call with PeerJS.');
        return;
      }
  
      call.on('stream', (remoteStream: MediaStream) => {
        console.log('Remote stream received in startCall:', remoteStream);
        set({ remoteStream });
  
        const remoteVideoElement = document.getElementById('remote-video') as HTMLVideoElement;
        if (remoteVideoElement) {
          remoteVideoElement.srcObject = remoteStream;
          remoteVideoElement.play().catch((err) => {
            console.error('Error playing remote video in startCall:', err);
          });
        }
      });
  
      call.on('close', () => {
        console.log('Call ended. Cleaning up streams.');
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }
        set({ localStream: null, remoteStream: null });
      });
  
      call.on('error', (err: Error) => {
        console.error('Error during call:', err);
      });
    } catch (error) {
      console.error('Error starting call:', error);
  
      // Hata durumunda akışları temizle
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      set({ localStream: null });
    }
  },
  
  
  

  // Çağrıyı sonlandır
  endCall: () => {
    const { peer, localStream, remoteStream } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      set({ localStream: null });
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      set({ remoteStream: null });
    }

    if (peer) {
      peer.disconnect();
      set({ peer: null });
    }

    console.log('Call ended');
  },

  // Gelen çağrıyı kabul et
  acceptCall: async () => {
    const { incomingCall } = get();

    if (!incomingCall) {
      console.error('No incoming call to accept!');
      return;
    }

    try {
      await incomingCall.accept();
      set({ incomingCall: null });
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  },

  // Gelen çağrıyı reddet
  rejectCall: () => {
    const { incomingCall } = get();

    if (incomingCall) {
      incomingCall.call.close();
      set({ incomingCall: null });
    }

    console.log('Call rejected');
  },

  // Mesaj WebSocket bağlantısını başlat
  connectMessageSocket: (username) => {
    const socket = new WebSocket(`wss://testapi.berat-dogan.com/ws/message/${username}/`);

    socket.onopen = () => {
      console.log('Message WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === 'new_message') {
        const newMessage = {
          text: data.message.text,
          sender: data.message.sender,
          date_time: data.message.date_time,
          read: data.message.read,
        };

        const { chats, activeChat } = get();

        const updatedChats = chats.map((chat) =>
          chat.username === data.message.sender
            ? { ...chat, messages: [...chat.messages, newMessage] }
            : chat
        );

        set({ chats: updatedChats });

        if (activeChat && activeChat.username === data.message.sender) {
          set({ activeChat: { ...activeChat, messages: [...activeChat.messages, newMessage] } });
        }
      } else if (data.status === 'new_call') {
        console.log('Incoming call:', data);

        const incomingCallData = {
          ...data.message,
        };

        set({ incomingCall: incomingCallData });
      }
    };

    socket.onclose = () => {
      console.log('Message WebSocket disconnected');
      set({ socket: null });
    };

    set({ socket });
  },

  // Bildirim WebSocket bağlantısını başlat
  connectNotificationSocket: () => {
    const notificationSocket = new WebSocket(`wss://testapi.berat-dogan.com/ws/notification/`);

    notificationSocket.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    notificationSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'new_user') {
        console.log('Processing new user notification:', data.message);
      }
    };

    notificationSocket.onclose = () => {
      console.log('Notification WebSocket disconnected');
      set({ notificationSocket: null });
    };

    set({ notificationSocket });
  },
}));

export default useChatStore;
