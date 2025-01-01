import React, { useEffect, useState } from "react";
import photo2 from "../../../assets/images/login_backround_desert.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../apiClient";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    apiClient
      .post("/chat-app/login/", formData)
      .then((res) => {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/");
      })
      .catch((error) => {
        const message =
          error.response?.data?.detail || "Login failed. Please try again.";
        setErrorMessage(message);
      })
      .finally(() => {
        setLoading(false);
      });
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
          <h1 className="text-3xl font-bold text-center mb-4">
            Login to your account
          </h1>
          <p className="text-center text-gray-400 mb-6">
            Don't have an account?{" "}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
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
