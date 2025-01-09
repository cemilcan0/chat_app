import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient";
import photo2 from "../../../assets/images/login_backround_desert.jpg";
import axios from "axios";



const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await apiClient.post("/chat-app/login/", { username, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/chat");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.detail || "Login failed. Please check your credentials.";
        setErrorMessage(message);
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="flex min-h-screen bg-[#2B2738] relative">
      <div
        className="hidden md:flex w-1/2 items-center justify-center m-6 rounded-lg"
        style={{
          backgroundImage: `url(${photo2})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-white text-center px-8">
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-lg">Experience seamless communication!</p>
        </div>
      </div>
      <div className="grid place-items-center min-h-screen w-full md:w-1/2 bg-[#2B2738]">
        <div className="bg-[#2B2738] text-white p-8 rounded-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-4">Login to your account</h1>
          <p className="text-center text-gray-400 mb-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate("/register")}
              className="text-purple-500 hover:underline"
            >
              Register now
            </button>
          </p>
          {errorMessage && (
            <p className="text-red-500 text-center mb-4">{errorMessage}</p>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className={`w-full py-2 rounded-lg transition ${loading
                ? "bg-purple-600 opacity-50 text-white cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

