import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getInstance, resumeInstance as resumeApi } from '../../../api/instanceApi';
import type { Instance } from '../../../api/schemas/instance';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'terminated']);

export function useInstance() {
  const { loading, error, call } = useApiCall();
  const [instance, setInstance] = useState<Instance | null>(null);

  const fetch = useCallback(
    async (id: string) => {
      const res = await call(() => getInstance(id));
      setInstance(res);
      return res;
    },
    [call],
  );

  const silentFetch = useCallback(
    async (id: string) => {
      const res = await call(() => getInstance(id), { silent: true });
      setInstance(res);
      return res;
    },
    [call],
  );

  const resume = useCallback(
    async (id: string) => {
      const res = await call(() => resumeApi(id), { successMsg: 'Instance resumed successfully' });
      // Advance endpoint returns empty object, so we need to refetch the instance
      if (res) {
        return await fetch(id);
      }
      return null;
    },
    [call, fetch],
  );

  const isTerminal = useCallback(
    (status: string | undefined) => (status ? TERMINAL_STATUSES.has(status) : false),
    [],
  );

  return { instance, loading, error, fetch, silentFetch, resume, isTerminal };
}
