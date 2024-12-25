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
      console.log('Fetching chats...');
      const response = await apiClient.get('/chat-app/users/');
      console.log('Chats fetched:', response.data);
      set({ chats: response.data });
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  },

  // Mesaj göndermek için
  sendMessage: async (text, receiver) => {
    const { socket, user, activeChat, chats } = get();
    console.log('Sending message:', { text, receiver, user });

    // Mesajı WebSocket üzerinden gönder
    if (socket) {
      console.log('Sending message via WebSocket...');
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

    // Mesajı backend'e POST isteğiyle gönder
    try {
      console.log('Sending message via POST API...');
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
      console.log('Updated chats after POST:', updatedChats);

      const updatedActiveChat = activeChat
        ? { ...activeChat, messages: [...activeChat.messages, newMessage] }
        : null;

      console.log('Updated activeChat after POST:', updatedActiveChat);

      set({ chats: updatedChats, activeChat: updatedActiveChat });
    } catch (error) {
      console.error('Error sending message via POST:', error);
    }
  },

  // Aktif chat'i belirlemek için
  setActiveChat: (chat) => {
    console.log('Setting active chat:', chat);
    set({ activeChat: chat });
  },

  // Kullanıcı bilgisini localStorage'dan yüklemek için
  loadUser: () => {
    console.log('Loading user from localStorage...');
    const userData = localStorage.getItem('user');
    if (userData) {
      console.log('User loaded:', JSON.parse(userData));
      set({ user: JSON.parse(userData) });
    } else {
      console.warn('No user found in localStorage!');
    }
  },

  // Mesajlar için WebSocket bağlantısını başlat
  connectMessageSocket: (username) => {
    console.log('Connecting to WebSocket for messages...');
    const socket = new WebSocket(`ws://localhost:8000/ws/message/${username}/`);

    socket.onopen = () => {
      console.log('Message WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message from WebSocket:', data);

      if (data.status === 'new_message') {
        // Gelen mesajı olduğu gibi alıyoruz
        const newMessage = {
          text: data.message.text, // Objenin text alanı
          sender: data.message.sender, // Objenin sender alanı
          date_time: data.message.date_time, // Objenin date_time alanı
          read: data.message.read, // Objenin read alanı
        };

        console.log('Formatted new message:', newMessage);

        const { chats, activeChat } = get();
        console.log('Current chats:', chats);
        console.log('Current activeChat:', activeChat);

        // Sohbetleri güncelle
        const updatedChats = chats.map((chat) =>
          chat.username === activeChat?.username
            ? { ...chat, messages: [...chat.messages, newMessage] }
            : chat
        );

        console.log('Updated chats after WebSocket message:', updatedChats);

        set({ chats: updatedChats });

        if (activeChat && activeChat.username === data.message.sender) {
          const updatedActiveChat = {
            ...activeChat,
            messages: [...activeChat.messages, newMessage],
          };
          console.log('Updated activeChat:', updatedActiveChat);
          set({ activeChat: updatedActiveChat });
        }
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
    console.log('Connecting to WebSocket for notifications...');
    const notificationSocket = new WebSocket(`ws://localhost:8000/ws/notification/`);

    notificationSocket.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    notificationSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received notification from WebSocket:', data);
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
