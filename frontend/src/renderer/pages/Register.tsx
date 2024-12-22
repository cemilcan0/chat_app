import React, { useState } from "react";
import photo from "../../../assets/images/login_background.jpg";
import logo from "../../../assets/images/logo.jpg";
import { useNavigate } from "react-router-dom";
import apiClient from "../apiClient";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);

  const predefinedErrors: { [key: string]: string } = {
    "A user with that username already exists.": "A user with that username already exists.",
    "This email is already registered.": "This email is already registered.",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    apiClient
      .post("/chat-app/registration/", formData)
      .then((res) => {
        navigate("/login?ref=register");
      })
      .catch((error) => {
        if (error.response?.data) {
          const responseErrors = error.response.data;
          let foundError = false;

          for (const key in responseErrors) {
            const errorMessages = Array.isArray(responseErrors[key])
              ? responseErrors[key]
              : [responseErrors[key]];
            for (const message of errorMessages) {
              if (predefinedErrors[message]) {
                setError(predefinedErrors[message]);
                foundError = true;
                break;
              }
            }
            if (foundError) break;
          }

          if (!foundError) {
            setError("An error occurred, please try again later!");
          }
        } else {
          setError("An error occurred, please try again later!");
        }
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
          Create an account
        </h2>
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-lg text-center">
            {error}
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
                value={formData.username}
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="first_name" className="sr-only">
              First Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="last_name" className="sr-only">
              Last Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition text-sm sm:text-base"
          >
            Register
          </button>
        </form>
        <div className="my-6 text-center text-gray-500 text-sm sm:text-base">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
