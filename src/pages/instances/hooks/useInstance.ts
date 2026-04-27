import { useState, useCallback } from "react";
import { useApiCall } from "../../../hooks/useApiCall";
import { instanceService } from "../../../api/services/instance";
import type { Instance } from "../../../api/schemas/instance";

const TERMINAL_STATUSES = new Set(["completed", "failed", "terminated"]);

export function useInstance() {
  const { loading, error, notFound, forbidden, unauthorized, call } = useApiCall();
  const [instance, setInstance] = useState<Instance | null>(null);

  const fetch = useCallback(
    async (id: string) => {
      const res = await call(() => instanceService.getInstance(id));
      setInstance(res);
      return res;
    },
    [call],
  );

  const silentFetch = useCallback(
    async (id: string) => {
      const res = await call(() => instanceService.getInstance(id), {
        silent: true,
      });
      setInstance(res);
      return res;
    },
    [call],
  );

  const runAction = useCallback(
    async (
      action: (id: string) => Promise<unknown>,
      successMsg: string,
      id: string,
    ) => {
      const res = await call(() => action(id), { successMsg });
      if (res) {
        return await fetch(id);
      }
      return null;
    },
    [call, fetch],
  );

  const resume = useCallback(
    async (id: string) =>
      runAction(
        (targetId) => instanceService.resumeInstance(targetId),
        "Instance resumed successfully",
        id,
      ),
    [runAction],
  );

  const pause = useCallback(
    async (id: string) =>
      runAction(
        (targetId) => instanceService.pauseInstance(targetId),
        "Instance paused successfully",
        id,
      ),
    [runAction],
  );

  const terminate = useCallback(
    async (id: string) =>
      runAction(
        (targetId) => instanceService.terminateInstance(targetId),
        "Instance terminated successfully",
        id,
      ),
    [runAction],
  );

  const isTerminal = useCallback(
    (status: string | undefined) =>
      status ? TERMINAL_STATUSES.has(status) : false,
    [],
  );

  return {
    instance,
    loading,
    error,
    notFound,
    forbidden,
    unauthorized,
    fetch,
    silentFetch,
    resume,
    pause,
    terminate,
    isTerminal,
  };
}
