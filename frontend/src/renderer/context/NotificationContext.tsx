import React, { createContext, useContext, useState, ReactNode } from "react";
import websocketService from "../utils/websocket";

interface Notification {
  id: string;
  type: "new_user" | "new_message";
  message: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  React.useEffect(() => {
    // Kullanıcı bilgilerini localStorage'dan alıyoruz
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (!storedUser || !storedUser.username) {
      console.error("User not logged in.");
      return;
    }

    // WebSocket bağlantısı
    websocketService.connect("wss://testapi.berat-dogan.com/ws/notification/");
    // websocketService.connect("ws://localhost:8000/ws/notification/");

    // Bağlantı kurulduğunda loggedInUser ve online durumunu gönder
    websocketService.onOpen(() => {
      websocketService.sendMessage({
        type: "status_update",
        username: storedUser.username,
        online: true,
      });
    });

    // Gelen mesajları dinle
    websocketService.onMessage((data) => {
      if (data.type === "new_user") {
        addNotification({
          id: new Date().toISOString(),
          type: "new_user",
          message: `${data.username} is now online.`,
        });
      }
    });

    // Çıkış yaparken veya bileşen unmount olurken loggedInUser ve online durumunu False olarak gönder
    return () => {
      websocketService.sendMessage({
        type: "status_update",
        username: storedUser.username,
        online: false,
      });
      websocketService.close(); // WebSocket bağlantısını kapat
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
