import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getInstance, resumeInstance as resumeApi } from '../../../api/instanceApi';
import type { BackendInstance } from '../../../types';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'terminated']);

export function useInstance() {
  const { loading, error, call } = useApiCall();
  const [instance, setInstance] = useState<BackendInstance | null>(null);

  const fetch = useCallback(
    async (id: string) => {
      const res = await call(() => getInstance(id));
      const inst = (res as { instance: BackendInstance } | null)?.instance ?? null;
      setInstance(inst);
      return inst;
    },
    [call],
  );

  const silentFetch = useCallback(
    async (id: string) => {
      const res = await call(() => getInstance(id), { silent: true });
      const inst = (res as { instance: BackendInstance } | null)?.instance ?? null;
      setInstance(inst);
      return inst;
    },
    [call],
  );

  const resume = useCallback(
    async (id: string) => {
      const res = await call(() => resumeApi(id), { successMsg: 'Instance resumed successfully' });
      const inst = (res as { instance: BackendInstance } | null)?.instance ?? null;
      if (inst) setInstance(inst);
      return inst;
    },
    [call],
  );

  const isTerminal = useCallback(
    (status: string | undefined) => (status ? TERMINAL_STATUSES.has(status) : false),
    [],
  );

  return { instance, loading, error, fetch, silentFetch, resume, isTerminal };
}
