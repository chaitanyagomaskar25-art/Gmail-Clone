import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let token = localStorage.getItem("accessToken") || null;

export const setAccessToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem("accessToken", newToken);
  } else {
    localStorage.removeItem("accessToken");
  }
};

export const getAccessToken = () => token;

// Attach Bearer token to requests
api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401 response
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/refresh") ||
      originalRequest.url.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Endpoints
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  getUsers: (search = "") => api.get(`/auth/users?search=${encodeURIComponent(search)}`),
};

export const emailApi = {
  getInbox: (page = 1, limit = 20, search = "") =>
    api.get(`/email/inbox?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  getSent: (page = 1, limit = 20, search = "") =>
    api.get(`/email/sent?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  getStarred: (page = 1, limit = 20, search = "") =>
    api.get(`/email/starred?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  getDrafts: (page = 1, limit = 20, search = "") =>
    api.get(`/email/drafts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
  saveDraft: (data) => api.post("/email/draft", data),
  getStats: () => api.get("/email/stats"),
  getDetails: (id) => api.get(`/email/${id}`),
  sendEmail: (data) => api.post("/email", data),
  markAsRead: (id, isRead = true) => api.patch(`/email/${id}/read`, { isRead }),
  toggleStar: (id) => api.patch(`/email/${id}/star`),
  deleteEmail: (id) => api.delete(`/email/${id}`),
};
