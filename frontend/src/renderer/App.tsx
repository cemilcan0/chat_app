import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import { NotificationProvider } from "./context/NotificationContext";
import { CallProvider } from "./context/CallContext";
import useChatStore from "./store/chatStore";
import './App.css'

const App: React.FC = () => {
  const { initializeSocket, closeSocket, fetchUsers } = useChatStore();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (storedUser && storedUser.username) {
      const socketUrl = `wss://testapi.berat-dogan.com/ws/message/${storedUser.username}/`;
      initializeSocket(socketUrl);
    }

    return () => {
      closeSocket();
    };
  }, [initializeSocket, closeSocket]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers])

  return (
    <NotificationProvider>
      <CallProvider>
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
                  <Chat />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </CallProvider>
    </NotificationProvider>
  );
};

export default App;
