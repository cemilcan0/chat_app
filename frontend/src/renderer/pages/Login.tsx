import React, { useEffect, useState } from "react";
import photo2 from "../../../assets/images/login_backround_desert.jpg";
import logo from "../../../assets/images/logo.jpg";
import { useNavigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", {
      firstName,
      lastName,
      email,
      password,
      termsAccepted,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("ref") === "register") {
      console.log("Registration successful! You can now log in.");
    }
  }, [location]);

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
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-lg">Experience seamless communication!</p>
        </div>
      </div>

      {/* Sağ Kısım - Kayıt Formu */}
      <div className="flex justify-center items-center min-h-screen bg-[#2B2738]">
        <div className="bg-[#2B2738] text-white p-8 rounded-lg w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-4">
            Create an account
          </h1>
          <p className="text-center text-gray-400 mb-6">
            Already have an account?{" "}
            <a href="/login" className="text-purple-500 hover:underline">
              Log in
            </a>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/2">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>
              <div className="w-1/2">
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 border-[#4E435F] rounded bg-[#3A3248] text-purple-500 focus:ring-2 focus:ring-purple-500"
                required
              />
              <label htmlFor="terms" className="ml-2 text-gray-400">
                I agree to the{" "}
                <a href="/terms" className="text-purple-500 hover:underline">
                  Terms & Conditions
                </a>
              </label>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Create account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
