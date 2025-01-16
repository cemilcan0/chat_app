import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserType } from "../types";
import useChatStore from "../store/chatStore";

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
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const { users, setUsers } = useChatStore();

    const addNotification = (notification: Notification) => {
        setNotifications((prev) => [...prev, notification]);
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    const isValidWebSocketMessage = (data: any): data is { type: string; message: any } => {
        return data && typeof data.type === "string" && data.message !== undefined;
    };

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        if (!storedUser || !storedUser.username) {
            console.error("User not logged in.");
            return;
        }

        // Yeni bir WebSocket bağlantısı oluştur
        const ws = new WebSocket(`wss://testapi.berat-dogan.com/ws/notification/${storedUser.id}/`);
        setWebSocket(ws);

        // Mesaj alındığında çalışacak event listener
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data); // JSON.parse işlemini güvenli hale getiriyoruz
                console.log("WebSocket message received:", data);

                if (data.type === "new_user") {
                    addNotification({
                        id: new Date().toISOString(),
                        type: "new_user",
                        message: `${data.message.username} is now online.`,
                    });
                } else if (data.type === "user_status_change") {
                    setUsers((prevUsers: UserType[]) =>
                        prevUsers.map((user) =>
                            user.id === data.message.id ? { ...user, online: data.message.online } : user
                        )
                    );
                }
            } catch (error) {
                console.log("Error parsing WebSocket message:", error);
                console.log("Raw WebSocket message:", event.data); // Gelen ham mesajı logluyoruz
            }
        };

        // Hata durumunda çalışacak event listener
        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // Bağlantı kapatıldığında çalışacak event listener
        ws.onclose = () => {
            console.log("WebSocket connection closed");
        };

        // Cleanup: bileşen unmount olduğunda bağlantıyı kapat
        return () => {
            ws.close();
        };
    }, [setUsers]);

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
