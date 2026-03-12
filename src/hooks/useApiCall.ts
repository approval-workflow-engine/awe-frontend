import { useState, useCallback } from "react";
import { useSnackbar } from "notistack";
import type { AxiosResponse } from "axios";
import { extractApiError } from "../utils/apiError";

interface ApiCallOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (err: unknown) => void;
  successMsg?: string;
  errorMsg?: string;
  showError?: boolean;
}

interface UseApiCallReturn {
  loading: boolean;
  error: string | null;
  call: <T = unknown>(
    apiFn: () => Promise<AxiosResponse<T>>,
    options?: ApiCallOptions,
  ) => Promise<T | null>;
}

export function useApiCall(): UseApiCallReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const call = useCallback(
    async <T = unknown>(
      apiFn: () => Promise<AxiosResponse<T>>,
      options: ApiCallOptions = {},
    ): Promise<T | null> => {
      const {
        onSuccess,
        onError,
        successMsg,
        errorMsg,
        showError = true,
      } = options;
      setLoading(true);
      setError(null);
      try {
        const response = await apiFn();
        const raw = response.data as { success?: boolean; data?: unknown };

        const payload =
          raw !== null &&
          typeof raw === "object" &&
          typeof raw.success === "boolean" &&
          "data" in raw
            ? (raw.data as T)
            : response.data;
        if (successMsg) enqueueSnackbar(successMsg, { variant: "success" });
        setError(null);
        if (onSuccess) onSuccess(payload);
        return payload as T;
      } catch (err: unknown) {
        const message = extractApiError(err);
        setError(message);
        if (showError) {
          enqueueSnackbar(errorMsg || message, { variant: "error" });
        }
        if (onError) onError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar, setError],
  );

  return { loading, error, call };
}
