import React, { useState } from "react";
import apiClient from "../utils/apiClient";
import { useNavigate } from "react-router-dom";
import photo2 from "../../../assets/images/login_backround_desert.jpg";


const Register: React.FC = () => {
  console.log("Register page rendered");
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await apiClient.post("/chat-app/registration/", formData);
      alert(response.data.message || "Registration successful!");
      navigate("/login");
    } catch (error: any) {
      if (error.response && error.response.data) {
        const errors = error.response.data;
        for (const [key, value] of Object.entries(errors)) {
          alert(`${key}: ${value}`);
        }
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex min-h-screen bg-[#2B2738] relative">
      {/* Sol Kısım - Görsel Arka Plan */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center m-6 rounded-lg"
        style={{
          backgroundImage: `url(${photo2})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-white text-center px-8">
          <h1 className="text-4xl font-bold mb-4">Join Us Today</h1>
          <p className="text-lg">Create an account and start connecting!</p>
        </div>
      </div>

      {/* Sağ Kısım - Register Formu */}
      <div className="grid place-items-center min-h-screen w-full md:w-1/2 bg-[#2B2738]">
        <div className="bg-[#2B2738] text-white p-8 rounded-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-4">
            Create an Account
          </h1>
          <p className="text-center text-gray-400 mb-6">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-purple-500 hover:underline"
            >
              Login here
            </button>
          </p>
          {errorMessage && (
            <p className="text-red-500 text-center mb-4">{errorMessage}</p>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
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
              {loading ? "Loading..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

