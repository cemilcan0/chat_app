import React from "react";
import { useNotification } from "../context/NotificationContext";

const NotificationList: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="absolute top-4 right-4 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-blue-500 text-white p-4 rounded shadow-md cursor-pointer"
          onClick={() => removeNotification(notification.id)}
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
