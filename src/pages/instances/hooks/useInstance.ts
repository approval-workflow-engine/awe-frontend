import { useState, useCallback } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { getInstance, resumeInstance as resumeApi } from '../../../api/instanceApi';
import type { BackendInstance } from '../../../types';

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

  const resume = useCallback(
    async (id: string) => {
      const res = await call(() => resumeApi(id), { successMsg: 'Instance resumed successfully' });
      const inst = (res as { instance: BackendInstance } | null)?.instance ?? null;
      if (inst) setInstance(inst);
      return inst;
    },
    [call],
  );

  return { instance, loading, error, fetch, resume };
}
