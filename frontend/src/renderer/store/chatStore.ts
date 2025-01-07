import { create } from 'zustand';
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
  peerConnection: null,
  localStream: null,
  remoteStream: null,

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

  // Gelen çağrıyı ayarla
  setIncomingCall: (call) => {
    set({ incomingCall: call });
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

        // Gelen çağrı bilgilerini düzenle
        const incomingCallData = {
          ...data.message, // `receiver`, `sender`, `peer_id` gibi bilgiler
          offer: data.offer || null, // Eğer `offer` varsa ekle
          sdp: data.sdp || null, // Eğer `sdp` varsa ekle
        };

        set({ incomingCall: incomingCallData });
      } else if (data.type === 'answer') {
        console.log('Received answer:', data.answer);

        const peerConnection = get().peerConnection;
        if (peerConnection) {
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
            .then(() => console.log('Answer set as remote description'))
            .catch((error) => console.error('Error setting answer as remote description:', error));
        }
      } else if (data.type === 'ice_candidate') {
        console.log('Received ICE candidate:', data.candidate);

        const peerConnection = get().peerConnection;
        if (peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
            .then(() => console.log('ICE candidate added'))
            .catch((error) => console.error('Error adding ICE candidate:', error));
        }
      } else if (data.status === 'end_call') {
        console.log(`Call ended by ${data.message.sender}`);
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

  // Sesli çağrı başlat
  startCall: async (peerId: string, receiver: string) => {
    const { socket, user } = get();

    if (!user || !socket) {
      console.error('User or WebSocket not found!');
      return;
    }

    try {
      // RTCPeerConnection oluştur
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Yerel medya akışını al
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

      // ICE Candidate'larını yakala ve WebSocket ile gönder
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.send(
            JSON.stringify({
              type: 'ice_candidate',
              candidate: event.candidate,
              receiver,
            })
          );
        }
      };

      // Offer oluştur
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Backend'e çağrı başlatma isteği gönder
      const response = await apiClient.post('/chat-app/start-call/', {
        sender: user.username,
        receiver,
        peer_id: peerId,
        offer, // offer bilgisi gönderiliyor
      });

      console.log('Call successfully started:', response.data);

      set({ peerConnection, localStream });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  },

  // Sesli çağrıyı sonlandır
  endCall: async (peerId: string, receiver: string) => {
    const { socket, user } = get();

    if (!user || !socket) {
      console.error('User or WebSocket not found!');
      return;
    }

    try {
      // Backend'e çağrı sonlandırma isteği gönder
      const response = await apiClient.post('/chat-app/end-call/', {
        sender: user.username,
        receiver: receiver,
        peer_id: peerId,
      });

      console.log('Call successfully ended:', response.data);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  },

  // Gelen çağrıyı kabul et
  acceptCall: async (offer: RTCSessionDescriptionInit, sender: string) => {
    const { socket } = get();

    try {
      // RTCPeerConnection oluştur
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Yerel medya akışını al ve PeerConnection'a ekle
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
      set({ localStream });

      // Remote description olarak gelen offer'ı ekle
      await peerConnection.setRemoteDescription(offer);

      // Answer oluştur ve WebSocket ile gönder
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket?.send(
        JSON.stringify({
          type: 'answer',
          answer: answer, // Oluşturulan yanıt
          receiver: sender, // Arayan kişi
        })
      );

      // ICE Candidate'ları dinle ve gönder
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.send(
            JSON.stringify({
              type: 'ice_candidate',
              candidate: event.candidate,
              receiver: sender,
            })
          );
        }
      };

      // Remote stream'i dinle
      peerConnection.ontrack = (event) => {
        set((state) => ({
          ...state,
          remoteStream: state.remoteStream
            ? new MediaStream([...state.remoteStream.getTracks(), ...event.streams[0].getTracks()])
            : event.streams[0],
        }));
      };

      set({ peerConnection });
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  },

  // Gelen çağrıyı reddet
  rejectCall: async (peerId: string, sender: string) => {
    const { socket, user } = get();

    if (!user || !socket) {
      console.error('User or WebSocket not found!');
      return;
    }

    try {
      // Backend'e çağrı reddetme isteği gönder
      const response = await apiClient.post('/chat-app/end-call/', {
        sender: user.username,
        receiver: sender,
        peer_id: peerId,
      });

      console.log('Call successfully rejected in backend:', response.data);

      // Çağrıyı reddettiğini WebSocket üzerinden bildir
      socket.send(
        JSON.stringify({
          type: 'reject_call',
          receiver: sender,
        })
      );
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  },
}));

export default useChatStore;