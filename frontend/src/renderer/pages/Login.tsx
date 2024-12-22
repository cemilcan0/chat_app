import React, { useEffect, useState } from "react";
import photo from "../../../assets/images/login_background.jpg";
import logo from "../../../assets/images/logo.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../apiClient";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("ref") === "register") {
      setSuccessMessage("Registration successful! You can now log in.");
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    apiClient
      .post("/chat-app/login/", { username, password })
      .then((res) => {
        const { token, user } = res.data;
        localStorage.setItem("token", token); 
        localStorage.setItem("user", JSON.stringify(user)); 
        navigate("/"); 
      })
      .catch((error) => {
        const message = error.response?.data?.detail || "Login failed. Please try again.";
        setErrorMessage(message); // Hata mesajını ayarlıyoruz
      });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${photo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8 w-full max-w-sm sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Ebolt" className="h-8 sm:h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
          Sign in with username
        </h2>
        {successMessage && (
          <div className="mb-4 text-center text-green-600 font-semibold">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 text-center text-red-600 font-semibold">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition text-sm sm:text-base"
          >
            Log In
          </button>
        </form>
        <div className="my-6 text-center text-gray-500 text-sm sm:text-base">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-blue-500 hover:underline"
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
