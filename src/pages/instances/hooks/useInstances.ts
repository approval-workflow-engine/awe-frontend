import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getInstances } from '../../../api/instanceApi';
import type { InstanceListItem } from '../../../api/schemas/instance';
import type { PaginationParams } from '../../../types';

export function useInstances() {
  const { loading, error, call } = useApiCall();
  const [instances, setInstances] = useState<InstanceListItem[]>([]);

  const fetch = useCallback(
    async (params?: PaginationParams) => {
      const res = await call(() => getInstances(params));
      setInstances(res?.instances ?? []);
    },
    [call],
  );

  const silentFetch = useCallback(
    async (params?: PaginationParams) => {
      const res = await call(() => getInstances(params), { silent: true });
      setInstances(res?.instances ?? []);
    },
    [call],
  );

  return { instances, loading, error, fetch, silentFetch };
}
