import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function getHistoryIndex(): number {
  if (typeof window === 'undefined') return 0;
  const state = window.history.state as { idx?: number } | null;
  return typeof state?.idx === 'number' ? state.idx : 0;
}

export function useBackNavigation(defaultPath: string) {
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = useMemo(() => getHistoryIndex() > 0, [location.key]);

  const goBack = useCallback(() => {
    if (getHistoryIndex() > 0) {
      navigate(-1);
      return;
    }
    navigate(defaultPath);
  }, [defaultPath, navigate]);

  return { goBack, canGoBack };
}
