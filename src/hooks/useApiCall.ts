import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import type { AxiosResponse } from 'axios';

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
    options?: ApiCallOptions
  ) => Promise<T | null>;
}

export function useApiCall(): UseApiCallReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const call = useCallback(
    async <T = unknown>(
      apiFn: () => Promise<AxiosResponse<T>>,
      options: ApiCallOptions = {}
    ): Promise<T | null> => {
      const { onSuccess, onError, successMsg, errorMsg, showError = true } = options;
      setLoading(true);
      setError(null);
      try {
        const response = await apiFn();
        if (successMsg) enqueueSnackbar(successMsg, { variant: 'success' });
        if (onSuccess) onSuccess(response.data);
        return response.data;
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
        const message =
          e.response?.data?.error?.message ||
          e.response?.data?.message ||
          e.message ||
          'An error occurred';
        setError(message);
        if (showError) enqueueSnackbar(errorMsg || message, { variant: 'error' });
        if (onError) onError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar]
  );

  return { loading, error, call };
}
