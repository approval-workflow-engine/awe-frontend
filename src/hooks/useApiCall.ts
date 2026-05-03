import { useState, useCallback } from "react";
import { useSnackbar } from "notistack";
import type { AxiosResponse } from "axios";
import { ApiClientError } from "../api/client";

interface ApiCallOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (err: unknown) => void;
  successMsg?: string;
  errorMsg?: string;
  showError?: boolean;
  silent?: boolean;
}

interface UseApiCallReturn {
  loading: boolean;
  error: string | null;
  notFound: boolean;
  forbidden: boolean;
  unauthorized: boolean;
  call: <T = unknown>(
    apiFn: () => Promise<AxiosResponse<T>> | Promise<T>,
    options?: ApiCallOptions,
  ) => Promise<T | null>;
}

export function useApiCall(): UseApiCallReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const call = useCallback(
    async <T = unknown>(
      apiFn: () => Promise<AxiosResponse<T>> | Promise<T>,
      options: ApiCallOptions = {},
    ): Promise<T | null> => {
      const {
        onSuccess,
        onError,
        successMsg,
        errorMsg,
        showError = true,
        silent = false,
      } = options;
      
      if (!silent) {
        setLoading(true);
        setError(null);
        setNotFound(false);
        setForbidden(false);
        setUnauthorized(false);
      }
      try {
        const response = await apiFn();

        // Handle typed service responses (direct data) as well as raw Axios responses.
        const isAxiosResponse =
          response && typeof response === "object" && "data" in response;

        let payload: T;
        if (isAxiosResponse) {
          const axiosResponse = response as AxiosResponse<T>;
          const raw = axiosResponse.data as {
            success?: boolean;
            data?: unknown;
          };

          payload = (
            raw !== null &&
            typeof raw === "object" &&
            typeof raw.success === "boolean" &&
            "data" in raw
              ? (raw.data as T)
              : axiosResponse.data
          ) as T;
        } else {
          payload = response as T;
        }

        if (successMsg) enqueueSnackbar(successMsg, { variant: "success" });
        if (!silent) setError(null);
        if (onSuccess) onSuccess(payload);
        return payload;
      } catch (err: unknown) {
        let message = "Request failed";
        let isNotFound = false;
        let isForbidden = false;
        let isUnauthorized = false;

        if (err instanceof ApiClientError) {
          message = err.message;
          isNotFound = err.isNotFound;
          isForbidden = err.isForbidden;
          isUnauthorized = err.isUnauthorized;
        } else if (err instanceof Error) {
          message = err.message;
        }

        if (!silent) {
          if (isNotFound) setNotFound(true);
          if (isForbidden) setForbidden(true);
          if (isUnauthorized) setUnauthorized(true);
          
          setError(message);
          
          // Don't show toast for 404 and 403 because they have dedicated UI states usually
          if (showError && !isNotFound && !isForbidden && !isUnauthorized) {
            enqueueSnackbar(errorMsg || message, { variant: "error" });
          }
        }
        
        if (onError) onError(err);
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [enqueueSnackbar],
  );

  return { loading, error, notFound, forbidden, unauthorized, call };
}

