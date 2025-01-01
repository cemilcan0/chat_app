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

  fetchFriendRequests: async () => {
    try {
      const response = await apiClient.get('/chat-app/pending-friend-requests/');
      console.log('Pending friend requests fetched:', response.data);

      set({ friendRequests: response.data });
    } catch (error) {
      console.error('Error fetching pending friend requests:', error);
    }
  },

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
    const userData = localStorage.getItem('user');
    if (userData) {
      set({ user: JSON.parse(userData) });
    } else {
      console.warn('No user found in localStorage!');
    }
  },

  addFriend: async (username) => {
    try {
      const response = await apiClient.post('/chat-app/send-friend-request/', { username });
      console.log('Friend request sent:', response.data);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  },

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

  connectMessageSocket: (username) => {
    const socket = new WebSocket(`wss://testapi.berat-dogan.com/ws/message/${username}/`);
    // const socket = new WebSocket(`ws://localhost:8000/ws/message/${username}/`);

    socket.onopen = () => {
      console.log('Message WebSocket connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

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
      set({ socket: null });
    };

    set({ socket });
  },

  connectNotificationSocket: () => {
    const notificationSocket = new WebSocket(`wss://testapi.berat-dogan.com/ws/notification/`);
    // const notificationSocket = new WebSocket(`ws://localhost:8000/ws/notification/`);

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
      set({ notificationSocket: null });
    };

    set({ notificationSocket });
  },
}));

export default useChatStore;
