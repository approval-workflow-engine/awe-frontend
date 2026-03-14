import axios from "axios";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { TOKEN_KEYS } from "../constants/tokens";

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  refreshQueue = [];
}

function clearAndRedirect(): void {
  Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
  window.location.href = "/login";
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              (
                originalRequest.headers as Record<string, string>
              ).Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);

      if (!refreshToken || refreshToken === "undefined") {
        clearAndRedirect();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const newToken: string = data.data?.accessToken || data.accessToken;
        const newRefreshToken: string =
          data.data?.refreshToken || data.refreshToken;
        localStorage.setItem(TOKEN_KEYS.ACCESS, newToken);
        if (newRefreshToken) {
          localStorage.setItem(TOKEN_KEYS.REFRESH, newRefreshToken);
        }
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        if (originalRequest.headers) {
          (
            originalRequest.headers as Record<string, string>
          ).Authorization = `Bearer ${newToken}`;
        }
        processQueue(null, newToken);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
