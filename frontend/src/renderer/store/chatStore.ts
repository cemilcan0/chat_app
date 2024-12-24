import { create } from 'zustand';
import apiClient from '../apiClient';
import { ChatStateType } from '../types';

const useChatStore = create<ChatStateType>((set, get) => ({
  chats: [],
  activeChat: null,
  user: null,
  socket: null,
  notificationSocket: null,

  // Tüm chat'leri API'den çekmek için
  fetchChats: async () => {
    try {
      const response = await apiClient.get('/chat-app/users/');
      set({ chats: response.data });
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  },

  // Mesaj göndermek için
  sendMessage: async (text, receiver) => {
    const { socket, user, activeChat, chats } = get();
  
    // Mesajı WebSocket üzerinden gönder
    if (socket) {
      socket.send(
        JSON.stringify({
          type: 'new_message',
          message: text,
          receiver: receiver,
        })
      );
    }
  
    // Mesajı backend'e POST isteğiyle gönder
    try {
      const response = await apiClient.post('/chat-app/message/', {
        text: text,
        receiver: receiver,
        sender: user?.username, // Kullanıcının username bilgisi
      });
  
      console.log('Message saved via POST:', response.data);
  
      // Yeni mesajı oluştur
      const newMessage = {
        text: text,
        sender: user?.username || 'unknown',
        date_time: new Date().toISOString(),
        read: true, // Varsayılan olarak okundu
      };
  
      // Hem activeChat'i hem de chats listesini güncelle
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

  // Aktif chat'i belirlemek için
  setActiveChat: (chat) => set({ activeChat: chat }),

  // Kullanıcı bilgisini localStorage'dan yüklemek için
  loadUser: () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      set({ user: JSON.parse(userData) });
    }
  },

  // Mesajlar için WebSocket bağlantısını başlat
  connectMessageSocket: (username) => {
    const socket = new WebSocket(`ws://localhost:8000/ws/message/${username}/`);

    socket.onopen = () => {
      console.log('Message WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'new_message') {
        console.log('New message:', data.message);

        // Gelen mesajı MessageType ile uyumlu hale getiriyoruz
        const newMessage = {
          text: data.message,
          sender: data.sender, // Backend'den gelen sender
          date_time: new Date().toISOString(), // Örnek olarak tarih ekliyoruz
          read: false, // Mesajın okunup okunmadığını belirten varsayılan bir değer
        };

        const { chats, activeChat } = get();
        const updatedChats = chats.map((chat) =>
          chat.username === activeChat?.username
            ? { ...chat, messages: [...chat.messages, newMessage] }
            : chat
        );
        set({ chats: updatedChats });
      }
    };

    socket.onclose = () => {
      console.log('Message WebSocket disconnected');
      set({ socket: null });
    };

    set({ socket });
  },

  // Bildirimler için WebSocket bağlantısını başlat
  connectNotificationSocket: () => {
    const notificationSocket = new WebSocket(`ws://localhost:8000/ws/notification/`);

    notificationSocket.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    notificationSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === 'new_user') {
        console.log('New user notification:', data.message);
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