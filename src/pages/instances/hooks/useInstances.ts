import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getInstances } from '../../../api/instanceApi';
import type { BackendInstance, PaginationParams } from '../../../types';

export function useInstances() {
  const { loading, error, call } = useApiCall();
  const [instances, setInstances] = useState<BackendInstance[]>([]);

  const fetch = useCallback(
    async (params?: PaginationParams) => {
      const res = await call(() => getInstances(params));
      setInstances((res as { instances: BackendInstance[] } | null)?.instances ?? []);
    },
    [call],
  );

  const silentFetch = useCallback(
    async (params?: PaginationParams) => {
      const res = await call(() => getInstances(params), { silent: true });
      setInstances((res as { instances: BackendInstance[] } | null)?.instances ?? []);
    },
    [call],
  );

  return { instances, loading, error, fetch, silentFetch };
}
