import React from "react";
import { Navigate } from "react-router-dom";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token"); // Token'i kontrol ediyoruz
  return token ? <Navigate to="/" /> : <>{children}</>;
};

export default PublicRoute;
