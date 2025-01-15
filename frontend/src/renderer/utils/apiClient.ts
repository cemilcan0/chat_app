import axios from "axios";

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: "https://testapi.berat-dogan.com",
  // baseURL: "http://localhost:8000",
});

// Request interceptor: Bearer Token ekle
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor: Progress kontrolü veya hata işleme
apiClient.interceptors.response.use(
  (response) => {
    // Progress bar burada bitirilebilir (opsiyonel)
    return response;
  },
  (error) => {
    // Hata mesajları işlenebilir
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // Kullanıcıyı login sayfasına yönlendir
    }
    
    console.error("Response Error:", error.response || error);
    return Promise.reject(error);
  }
);

export default apiClient;
