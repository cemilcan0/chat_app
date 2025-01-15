export interface UserType {
  id: string;
  email: string;
  username: string;
  name: string;
  photo: string;
  online: boolean;
  status: string;
  messages: MessageType[];
  peerId?: string;
  unreadMessages: number;
  lastMessage?: MessageType;
}

export interface MessageType {
  text: string;
  sender: string;
  date_time: string;
  read: boolean;
}

export interface CallType {
  data: {
    receiver: string;
    sender: string;
    peerId: string;
  }
  display: {
    name: string;
    photo: string;
    status: string;
    username: string;
    online: boolean;
    messages: MessageType[];
  }
}
