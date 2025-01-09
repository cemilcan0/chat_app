import React, { useState } from "react";
import apiClient from "../utils/apiClient";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/chat-app/registration/", formData);
      alert(response.data.message || "Registration successful!");
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.response && error.response.data) {
        const errors = error.response.data;
        for (const [key, value] of Object.entries(errors)) {
          alert(`${key}: ${value}`);
        }
      } else {
        alert("Registration failed. Please try again.");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        className="bg-white p-6 rounded shadow-md w-96"
        onSubmit={handleRegister}
      >
        <h2 className="text-2xl mb-4 text-center">Register</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            name="username"
            className="w-full border border-gray-300 rounded p-2 mt-1"
            value={formData.username}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            name="first_name"
            className="w-full border border-gray-300 rounded p-2 mt-1"
            value={formData.first_name}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            name="last_name"
            className="w-full border border-gray-300 rounded p-2 mt-1"
            value={formData.last_name}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            className="w-full border border-gray-300 rounded p-2 mt-1"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
