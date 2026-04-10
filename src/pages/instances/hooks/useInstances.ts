import { useState, useCallback } from "react";
import { useApiCall } from "../../../hooks/useApiCall";
import { instanceService } from "../../../api/services/instance";
import type { InstanceListItem } from "../../../api/schemas/instance";
import type { PaginationParams, Pagination } from "../../../api/schemas/common";

interface FetchResult {
  instances: InstanceListItem[];
  pagination?: Pagination;
}

export function useInstances() {
  const { loading, error, call } = useApiCall();
  const [instances, setInstances] = useState<InstanceListItem[]>([]);

  const fetch = useCallback(
    async (params?: PaginationParams): Promise<FetchResult | null> => {
      const res = await call(() => instanceService.getInstances(params));
      const instances_ = res?.instances ?? [];
      setInstances(instances_);
      return res as FetchResult | null;
    },
    [call],
  );

  const silentFetch = useCallback(
    async (params?: PaginationParams) => {
      const res = await call(() => instanceService.getInstances(params), {
        silent: true,
      });
      const instances_ = res?.instances ?? [];
      setInstances(instances_);
      return res as FetchResult | null;
    },
    [call],
  );

  return { instances, loading, error, fetch, silentFetch };
}
