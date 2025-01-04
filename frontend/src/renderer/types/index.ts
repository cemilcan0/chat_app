export interface UserType {
  name: string;
  username: string;
  photo: string;
  status: string;
}

export interface ChatType {
  name: string;
  username: string;
  photo: string;
  online: boolean;
  status: string;
  messages: MessageType[];
}

export interface MessageType {
  text: string;
  sender: string;
  date_time: string;
  read: boolean;
}

export interface ChatStateType {
  chats: ChatType[];
  activeChat: ChatType | null;
  user: UserType | null;
  socket: WebSocket | null;
  notificationSocket: WebSocket | null;
  friendRequests: UserType[];
  fetchChats: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  sendMessage: (text: string, receiver: string) => void;
  addFriend: (username: string) => void;
  acceptFriendRequest: (username: string) => void;
  declineFriendRequest: (username: string) => void;
  connectMessageSocket: (username: string) => void;
  connectNotificationSocket: () => void;
  setActiveChat: (chat: ChatType | null) => void;
  loadUser: () => void;
  startCall: (peerId: string, receiver: string) => void;
  endCall: (peerId: string, receiver: string) => void;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  acceptCall: (offer: RTCSessionDescriptionInit, sender: string) => void;
  rejectCall: (peerId: string, sender: string) => void;
}
