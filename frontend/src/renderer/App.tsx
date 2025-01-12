import React, { useEffect, useMemo } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import { NotificationProvider } from "./context/NotificationContext";
import { CallProvider } from "./context/CallContext";
import useChatStore from "./store/chatStore";
import './App.css';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

const App: React.FC = () => {
  const { initializeSocket, closeSocket, fetchUsers } = useChatStore();

  const storedUser = useMemo(() => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : {};
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return {};
    }
  }, []);

  useEffect(() => {
    if (!storedUser || !storedUser.username) return;

    try {
      const socketUrl = `wss://testapi.berat-dogan.com/ws/message/${storedUser.username}/`;
      initializeSocket(socketUrl);
    } catch (error) {
      console.error("Error initializing socket:", error);
    }

    return () => {
      try {
        closeSocket();
      } catch (error) {
        console.error("Error closing socket:", error);
      }
    };
  }, [initializeSocket, closeSocket, storedUser.username]);

  useEffect(() => {
    if (!storedUser || !storedUser.username) return;

    try {
      fetchUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [fetchUsers, storedUser.username]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <NotificationProvider>
                <CallProvider>
                  <Chat />
                </CallProvider>
              </NotificationProvider>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
};

export default App;
