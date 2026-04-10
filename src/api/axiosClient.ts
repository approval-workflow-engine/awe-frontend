import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { TOKEN_KEYS } from "../constants/tokens";
import {
  DEFAULT_ENVIRONMENT,
  getActiveEnvironmentTypes,
} from "../constants/environment";
import { API_BASE_URL } from "./baseUrl";

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function attachAccessToken(
  config: InternalAxiosRequestConfig | AxiosRequestConfig,
  token: string,
) {
  if (config.headers) {
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  }
}

function getStoredToken(key: string) {
  return localStorage.getItem(key);
}

function setStoredToken(key: string, value: string) {
  localStorage.setItem(key, value);
}

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
  if (token) {
    attachAccessToken(config, token);
  }

  const activeEnvironmentType =
    getActiveEnvironmentTypes().join(",") || DEFAULT_ENVIRONMENT;

  if (!config.params) {
    config.params = { environmentType: activeEnvironmentType };
  } else if (
    !(config.params instanceof URLSearchParams) &&
    typeof config.params === "object" &&
    !("environmentType" in config.params)
  ) {
    config.params = {
      ...(config.params as Record<string, unknown>),
      environmentType: activeEnvironmentType,
    };
  } else if (config.params instanceof URLSearchParams) {
    if (!config.params.has("environmentType")) {
      config.params.set("environmentType", activeEnvironmentType);
    }
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

function enqueueRefreshRetry(
  request: AxiosRequestConfig & { _retry?: boolean },
) {
  return new Promise<string>((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  })
    .then((token) => {
      attachAccessToken(request, token);
      return axiosClient(request);
    })
    .catch((err) => Promise.reject(err));
}

function persistRefreshedTokens(accessToken: string, refreshToken?: string) {
  setStoredToken(TOKEN_KEYS.ACCESS, accessToken);
  if (refreshToken) {
    setStoredToken(TOKEN_KEYS.REFRESH, refreshToken);
  }
  axiosClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}

async function refreshAccessToken(refreshToken: string) {
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });
  return {
    accessToken: (data.data?.accessToken || data.accessToken) as string,
    refreshToken: (data.data?.refreshToken || data.refreshToken) as
      | string
      | undefined,
  };
}

function shouldHandleUnauthorized(
  error: AxiosError,
  request: { _retry?: boolean } | undefined,
) {
  return error.response?.status === 401 && request && !request._retry;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (shouldHandleUnauthorized(error as AxiosError, originalRequest)) {
      if (isRefreshing) {
        return enqueueRefreshRetry(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getStoredToken(TOKEN_KEYS.REFRESH);

      if (!refreshToken || refreshToken === "undefined") {
        clearAndRedirect();
        return Promise.reject(error);
      }

      try {
        const refreshed = await refreshAccessToken(refreshToken);
        persistRefreshedTokens(refreshed.accessToken, refreshed.refreshToken);
        attachAccessToken(originalRequest, refreshed.accessToken);
        processQueue(null, refreshed.accessToken);
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
