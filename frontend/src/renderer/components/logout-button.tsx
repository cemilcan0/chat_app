import React from "react";
import { useNavigate } from "react-router-dom";
import logout from '../../../assets/icons/logout.svg';
import useChatStore from "../store/chatStore";

const LogoutButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    useChatStore.getState().resetStore();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
    >
      <img src={logout} alt="Logout" className="w-5 h-5" />
    </button>
  );
};

export default LogoutButton;
