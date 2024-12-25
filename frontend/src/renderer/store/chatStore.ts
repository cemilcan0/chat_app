import { create } from 'zustand';
import apiClient from '../apiClient';
import { ChatStateType, ChatType, MessageType } from '../types';

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
      console.log('Chats fetched:', response.data);
  
      // Her chat için okunmamış mesajları say
      const chatsWithUnread = response.data.map((chat: ChatType) => {
        const unreadCount = chat.messages.filter((message: MessageType) => !message.read).length;
        return { ...chat, unreadCount }; // unreadCount'u her chat'e ekle
      });

      console.log('Chats with unread:', chatsWithUnread);
  
      set({ chats: chatsWithUnread });
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
    } else {
      console.warn('WebSocket is not connected!');
    }

    // Mesajı backend'e POST isteğiyle gönder
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
        read: true, // Varsayılan olarak okundu
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

  setActiveChat: (chat) => {
    set({ activeChat: chat });
  },

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
      }
    };

    socket.onclose = () => {
      console.log('Message WebSocket disconnected');
      set({ socket: null });
    };

    set({ socket });
  },

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
