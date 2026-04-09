import { useState, useCallback } from "react";

// Хук для загрузки данных с отображением ошибки и кнопкой «Повторить»
export function useLoadWithRetry<T>(
  loader: () => Promise<T>,
  onSuccess: (data: T) => void,
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    loader()
      .then(data => { onSuccess(data); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, error, reload: load };
}
