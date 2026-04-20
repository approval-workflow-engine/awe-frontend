import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { z } from "zod";
import { TOKEN_KEYS } from "../constants/tokens";
import { ApiErrorSchema } from "./schemas";
import { API_BASE_URL } from "./baseUrl";
import {
  DEFAULT_ENVIRONMENT,
  getActiveEnvironmentType,
} from "../constants/environment";

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export class ApiValidationError extends Error {
  public validationErrors: z.ZodError;

  constructor(message: string, validationErrors: z.ZodError) {
    super(message);
    this.name = "ApiValidationError";
    this.validationErrors = validationErrors;
  }
}

export class ApiClientError extends Error {
  public status?: number;
  public response?: AxiosResponse;

  constructor(message: string, status?: number, response?: AxiosResponse) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.response = response;
  }
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: QueueItem[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        const activeEnvironmentType =
          getActiveEnvironmentType() || DEFAULT_ENVIRONMENT;
        const url = config.url ?? "";
        const path = url.split("?")[0] ?? "";
        const method = (config.method ?? "GET").toUpperCase();
        const isTargetedNoEnvironmentEndpoint = (() => {
          if (method === "POST" || method === "PATCH" || method === "DELETE") {
            if (
              (method === "POST" && /^\/workflows\/[^/]+\/versions$/.test(path)) ||
              (method === "POST" && /^\/workflows\/(save|validate)$/.test(path)) ||
              (method === "PATCH" && /^\/workflows\/[^/]+$/.test(path)) ||
              (method === "POST" && /^\/workflows\/versions\/[^/]+\/(validate|publish|activate|deactivate|clone|promote)$/.test(path)) ||
              (method === "PATCH" && /^\/workflows\/versions\/[^/]+$/.test(path)) ||
              (method === "DELETE" && /^\/workflows\/[^/]+$/.test(path)) ||
              (method === "POST" && /^\/instances$/.test(path)) ||
              (method === "POST" && /^\/instances\/[^/]+\/(resume|pause|terminate|retry)$/.test(path)) ||
              (method === "POST" && /^\/tasks\/[^/]+\/(complete|retry)$/.test(path))
            ) {
              return true;
            }
          }

          if (method === "GET") {
            return (
              /^\/workflows\/versions\/[^/]+$/.test(path) ||
              /^\/workflows\/[^/]+\/versions$/.test(path) ||
              /^\/workflows\/[^/]+$/.test(path) ||
              /^\/instances\/[^/]+$/.test(path) ||
              /^\/instances\/[^/]+\/execution-sequence$/.test(path) ||
              /^\/instances\/[^/]+\/tasks\/[^/]+$/.test(path) ||
              /^\/instances\/[^/]+\/constants$/.test(path) ||
              /^\/tasks\/[^/]+$/.test(path) ||
              /^\/audit\/[^/]+$/.test(path)
            );
          }

          return false;
        })();
        const shouldSkipEnvironmentFilter =
          url.startsWith("/auth/") ||
          (method === "GET" && (path === "/me" || path.startsWith("/api-keys"))) ||
          (method === "POST" && path === "/organizations/register") ||
          isTargetedNoEnvironmentEndpoint;

        if (!shouldSkipEnvironmentFilter) {
          if (method === "GET") {
            // GET: send environment as query parameter
            if (!config.params) {
              config.params = { environment: activeEnvironmentType };
            } else if (
              !(config.params instanceof URLSearchParams) &&
              typeof config.params === "object" &&
              !("environment" in config.params)
            ) {
              config.params = {
                ...(config.params as Record<string, unknown>),
                environment: activeEnvironmentType,
              };
            } else if (config.params instanceof URLSearchParams) {
              if (!config.params.has("environment")) {
                config.params.set("environment", activeEnvironmentType);
              }
            }
          } else {
            // Non-GET: inject environment into request body
            if (config.data == null) {
              config.data = { environment: activeEnvironmentType };
            } else if (typeof config.data === "string") {
              try {
                const parsed = JSON.parse(config.data);
                if (!("environment" in parsed)) {
                  parsed.environment = activeEnvironmentType;
                }
                config.data = JSON.stringify(parsed);
              } catch {
                // leave as-is if parsing fails
              }
            } else if (
              typeof config.data === "object" &&
              config.data !== null &&
              !("environment" in (config.data as Record<string, unknown>))
            ) {
              (config.data as Record<string, unknown>).environment =
                activeEnvironmentType;
            }
          }
        }

        return config;
      },
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise<string>((resolve, reject) => {
              this.refreshQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  (
                    originalRequest.headers as Record<string, string>
                  ).Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);

          if (!refreshToken || refreshToken === "undefined") {
            this.clearAndRedirect();
            return Promise.reject(error);
          }

          try {
            const { data } = await axios.post(
              `${this.client.defaults.baseURL}/auth/refresh`,
              {
                refreshToken,
              },
            );

            const newToken: string = data.data?.accessToken || data.accessToken;
            const newRefreshToken: string =
              data.data?.refreshToken || data.refreshToken;

            localStorage.setItem(TOKEN_KEYS.ACCESS, newToken);
            if (newRefreshToken) {
              localStorage.setItem(TOKEN_KEYS.REFRESH, newRefreshToken);
            }

            this.client.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            if (originalRequest.headers) {
              (
                originalRequest.headers as Record<string, string>
              ).Authorization = `Bearer ${newToken}`;
            }

            this.processQueue(null, newToken);
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.clearAndRedirect();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private processQueue(error: unknown, token: string | null = null): void {
    this.refreshQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token as string);
    });
    this.refreshQueue = [];
  }

  private clearAndRedirect(): void {
    Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
    window.location.href = "/login";
  }

  private validateResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
    let unwrappedData = data;
    if (
      data &&
      typeof data === "object" &&
      "success" in data &&
      "data" in data &&
      (data as { success: boolean }).success === true
    ) {
      unwrappedData = (data as { data: unknown }).data;
    }

    try {
      return schema.parse(unwrappedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.group("Schema Validation Failed");
        console.error("Original response:", data);
        console.error("Unwrapped data:", unwrappedData);
        console.error("Validation issues:");
        error.issues.forEach((issue, index) => {
          console.error(
            `  ${index + 1}. Path: ${issue.path.join(".")} | Code: ${issue.code} | Message: ${issue.message}`,
          );
        });
        console.groupEnd();
        throw new ApiValidationError("Response validation failed", error);
      }
      throw error;
    }
  }

  private handleApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      let message = "An error occurred";

      if (data) {
        const validatedError = ApiErrorSchema.safeParse(data);
        if (validatedError.success) {
          message = validatedError.data.message;
        } else if (typeof data === "string") {
          message = data;
        } else if (data.message) {
          message = data.message;
        }
      }

      throw new ApiClientError(message, status, error.response);
    }

    throw error;
  }

  async get<T>(
    endpoint: string,
    responseSchema: z.ZodSchema<T>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.get(endpoint, config);
      return this.validateResponse(response.data, responseSchema);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async post<TRequest, TResponse>(
    endpoint: string,
    data: TRequest,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema<TRequest>,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    try {
      const validatedData = requestSchema ? requestSchema.parse(data) : data;
      const response = await this.client.post(endpoint, validatedData, config);
      return this.validateResponse(response.data, responseSchema);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async patch<TRequest, TResponse>(
    endpoint: string,
    data: TRequest,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema<TRequest>,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    try {
      const validatedData = requestSchema ? requestSchema.parse(data) : data;
      const response = await this.client.patch(endpoint, validatedData, config);
      return this.validateResponse(response.data, responseSchema);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async put<TRequest, TResponse>(
    endpoint: string,
    data: TRequest,
    responseSchema: z.ZodSchema<TResponse>,
    requestSchema?: z.ZodSchema<TRequest>,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    try {
      const validatedData = requestSchema ? requestSchema.parse(data) : data;
      const response = await this.client.put(endpoint, validatedData, config);
      return this.validateResponse(response.data, responseSchema);
    } catch (error) {
      this.handleApiError(error);
    }
  }

  async delete<T>(
    endpoint: string,
    responseSchema: z.ZodSchema<T>,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.delete(endpoint, config);
      return this.validateResponse(response.data, responseSchema);
    } catch (error) {
      this.handleApiError(error);
    }
  }
}

export const apiClient = new ApiClient();
