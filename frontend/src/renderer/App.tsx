import React, { useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import "tailwindcss/tailwind.css";
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SkeletonLoader from './SkeletonLoader';
import useChatStore from './store/chatStore';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  const loadUser = useChatStore((state) => state.loadUser);
  const connectMessageSocket = useChatStore((state) => state.connectMessageSocket);
  const connectNotificationSocket = useChatStore((state) => state.connectNotificationSocket);
  const user = useChatStore((state) => state.user);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      connectMessageSocket(user.username); // Kullanıcı adı ile bağlan
      connectNotificationSocket(); // Bildirimler için bağlan
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
