export interface UserType {
  name: string;
  username: string;
  photo: string;
  status: string;
  peerId?: string;
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

export interface ChatStateType {
  chats: ChatType[]; // Kullanıcının sohbet listesi
  activeChat: ChatType | null; // Aktif sohbet
  user: UserType | null; // Kullanıcı bilgileri
  socket: WebSocket | null; // Mesaj WebSocket bağlantısı
  notificationSocket: WebSocket | null; // Bildirim WebSocket bağlantısı
  friendRequests: UserType[]; // Arkadaşlık istekleri
  incomingCall: {
    call: any;
    accept: () => Promise<void>;
    display: {
      photo: string; // Kullanıcı fotoğrafı
      name: string; // Kullanıcı adı
      status?: string; // Kullanıcı durumu (opsiyonel)
    };
  } | null;
  peer: any | null; // PeerJS nesnesi
  localStream: MediaStream | null; // Yerel medya akışı (kamera/mikrofon)
  remoteStream: MediaStream | null; // Uzaktan gelen medya akışı

  // Fonksiyon tanımları
  fetchChats: () => Promise<void>; // Kullanıcının sohbet listesini getir
  fetchFriendRequests: () => Promise<void>; // Kullanıcının arkadaşlık isteklerini getir
  sendMessage: (text: string, receiver: string) => void; // Mesaj gönder
  addFriend: (username: string) => void; // Arkadaşlık isteği gönder
  acceptFriendRequest: (username: string) => void; // Arkadaşlık isteğini kabul et
  declineFriendRequest: (username: string) => void; // Arkadaşlık isteğini reddet
  connectMessageSocket: (username: string) => void; // Mesaj WebSocket bağlantısını başlat
  connectNotificationSocket: () => void; // Bildirim WebSocket bağlantısını başlat
  setActiveChat: (chat: ChatType | null) => void; // Aktif sohbeti belirle
  loadUser: () => void; // Kullanıcı bilgilerini yükle

  // PeerJS ile ilgili çağrı fonksiyonları
  connectPeer: (peerId: string) => void; // PeerJS bağlantısını başlat
  startCall: (receiverPeerId: string) => Promise<void>; // PeerJS ile sesli/video çağrı başlat
  endCall: () => void; // Çağrıyı sonlandır
  acceptCall: () => Promise<void>; // Gelen çağrıyı kabul et
  rejectCall: () => void; // Gelen çağrıyı reddet

  setIncomingCall: (callData: {
    call: any;
    accept: () => Promise<void>;
    display: {
      photo: string;
      name: string;
      status?: string;
    };
  } | null) => void;
}
