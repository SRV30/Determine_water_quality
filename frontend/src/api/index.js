import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "Token expired, please login again"
    ) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const uploadToCloudinary = async (formData) => {
  const response = await axiosInstance.post("/image/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response;
};

export const deleteFromCloudinary = async (publicId) => {
  const response = await axiosInstance.delete(`/image/delete/${publicId}`);
  return response;
};

export const signupUser = async (name, email, password) => {
  const res = await axiosInstance.post("/user/signup", {
    name,
    email,
    password,
  });
  localStorage.setItem("token", res.data.token); // Save token
  return res.data;
};

// Login
export const loginUser = async (email, password) => {
  const res = await axiosInstance.post("/user/login", { email, password });
  localStorage.setItem("token", res.data.token); // Save token
  return res.data;
};

// Get logged-in user profile
export const getProfile = async () => {
  const res = await axiosInstance.get("/user/me");
  return res.data;
};

export const addHealthInfo = async (healthData) => {
  const res = await axiosInstance.post("/details/health", healthData);
  return res.data;
};

export const updateHealthInfo = async (healthData) => {
  const res = await axiosInstance.put("/details/health", healthData);
  return res.data;
};

export const fetchHealthInfo = async () => {
  const res = await axiosInstance.get("/details/health");
  return res.data;
};

export const addWaterLog = async (waterData) => {
  const res = await axiosInstance.post("/water-log/add", waterData);
  return res.data;
};

export const getDailyWaterLog = async () => {
  const res = await axiosInstance.get("/water-log/today");
  return res.data;
};

export const getWeeklyWaterLog = async () => {
  const res = await axiosInstance.get("/water-log/week");
  return res.data;
};

export const getMonthlyWaterLog = async () => {
  const res = await axiosInstance.get("/water-log/month");
  return res.data;
};

export default axiosInstance;
