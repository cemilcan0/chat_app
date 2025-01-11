import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationList from "./components/notification-list";
import useChatStore from "./store/chatStore"; // Zustand store
import "./App.css";

const App = () => {
  const { fetchUsers, initializeSocket, closeSocket } = useChatStore();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (storedUser && storedUser.username) {
      const socketUrl = `wss://testapi.berat-dogan.com/ws/message/${storedUser.username}/`;
      initializeSocket(socketUrl); // WebSocket bağlantısını başlat
    }

    return () => {
      closeSocket(); // Uygulama kapanırken WebSocket bağlantısını kapat
    };
  }, [initializeSocket, closeSocket]);

  useEffect(() => {
    // Kullanıcıları ve mesajları API'den çek
    fetchUsers();
  }, [fetchUsers]); // fetchUsers bağımlılık olarak eklendi

  return (
    <NotificationProvider>
      <Router basename="/">
        <NotificationList />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;
