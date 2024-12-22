export interface User {
  name: string;
  username: string;
  photo: string;
  status: string;
}

export interface Chat {
  name: string;
  username: string;
  photo: string;
  online: boolean;
  status: string;
  messages: Message[];
}

export interface Message {
  text: string;
  sender: string;
  date_time: string;
  read: boolean;
}