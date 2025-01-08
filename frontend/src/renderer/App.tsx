import React, { useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import "tailwindcss/tailwind.css";
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SkeletonLoader from './SkeletonLoader';
import useChatStore from './store/chatStore';
import Peer from 'peerjs';

const userData = localStorage.getItem('user');

if (userData) {
  const user = JSON.parse(userData);
  const username = user?.username;

  // Peer ID oluştur ve benzersiz hale getir
  

  // Peer ID'yi localStorage'a kaydet
  localStorage.setItem('peerId', username);

  // PeerJS bağlantısını başlat
  const peer = new Peer(username, {
    host: 'localhost', // PeerJS sunucusunun adresi
    port: 9000,        // PeerJS sunucusunun portu
    path: '/',         // Varsayılan yol
  });

  // Peer bağlantısı açıldığında
  peer.on('open', (id) => {
    console.log(`Connected to PeerJS server with ID: ${id}`);
  });

  // Gelen çağrıları dinleme
  peer.on('call', (call) => {
    console.log('Incoming call:', call);

    // Medya akışını al ve çağrıyı cevapla
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((localStream) => {
        call.answer(localStream); // Gelen çağrıyı cevapla

        // Gelen uzak akışı işleme
        call.on('stream', (remoteStream) => {
          console.log('Remote stream received:', remoteStream);

          // Uzak akışı bir video elementine bağlayabilirsiniz
          const remoteVideoElement = document.getElementById('remote-video') as HTMLVideoElement;
          if (remoteVideoElement) {
            remoteVideoElement.srcObject = remoteStream;
            remoteVideoElement.play();
          }
        });

        call.on('close', () => {
          console.log('Call ended.');
        });
      })
      .catch((err) => {
        console.error('Error accessing local media:', err);
      });
  });

  // PeerJS bağlantı hatalarını ele al
  peer.on('error', (err) => {
    console.error('PeerJS connection error:', err);
  });
}



const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  const { loadUser, connectMessageSocket, connectNotificationSocket, user } = useChatStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      connectMessageSocket(user.username);
      connectNotificationSocket();
    }
  }, [user, connectMessageSocket, connectNotificationSocket]);

  return (
    <React.Suspense fallback={<SkeletonLoader />}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </React.Suspense>
  );
}
