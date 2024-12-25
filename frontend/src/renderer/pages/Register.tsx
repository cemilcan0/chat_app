import React, { useState } from "react";
import photo2 from "../../../assets/images/login_backround_desert.jpg";
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
  const [termsAccepted, setTermsAccepted] = useState(false); // Terms & Conditions kontrolü
  const [loading, setLoading] = useState(false); // Loading durumu
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Hata mesajı

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(""); // Hata mesajını sıfırla

    if (!termsAccepted) {
      setErrorMessage("You must accept the Terms & Conditions to register.");
      return;
    }

    setLoading(true); // Loading durumunu başlat

    apiClient
      .post("/chat-app/registration/", formData)
      .then((res) => {
        navigate("/login?ref=register");
      })
      .catch((error) => {
        const message =
          error.response?.data?.detail || "Registration failed. Please try again.";
        setErrorMessage(message); // Hata mesajını ayarla
      })
      .finally(() => {
        setLoading(false); // Loading durumunu bitir
      });
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
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="First Name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#3A3248] border border-[#4E435F] rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            {/* Terms & Conditions */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 border-[#4E435F] rounded bg-[#3A3248] text-purple-500 focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="terms" className="ml-2 text-gray-400">
                I agree to the{" "}
                <a
                  href="https://perlanera.co/policies/legal-notice"
                  className="text-purple-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms & Conditions
                </a>
              </label>
            </div>
            <button
              type="submit"
              className={`w-full py-2 rounded-lg transition ${loading
                  ? "bg-purple-600 opacity-50 text-white cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
                } ${!termsAccepted && !loading ? "opacity-50" : ""}`}
              disabled={!termsAccepted || loading}
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
