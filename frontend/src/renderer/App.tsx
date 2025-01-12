import React, { useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import { NotificationProvider } from "./context/NotificationContext";
import { CallProvider } from "./context/CallContext";
import useChatStore from "./store/chatStore";
import './App.css';

const App: React.FC = () => {
  const { initializeSocket, closeSocket, fetchUsers } = useChatStore();

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return {};
    }
  }, []);

  useEffect(() => {
    if (!storedUser || !storedUser.username) return;

    const socketUrl = `wss://testapi.berat-dogan.com/ws/message/${storedUser.username}/`;
    initializeSocket(socketUrl);

    return () => {
      closeSocket();
    };
  }, [initializeSocket, closeSocket, storedUser.username]);

  useEffect(() => {
    if (!storedUser || !storedUser.username) return;

    fetchUsers();
  }, [fetchUsers, storedUser.username]);

  return (
    <Router>
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
              <NotificationProvider>
                <CallProvider>
                  <Chat />
                </CallProvider>
              </NotificationProvider>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
