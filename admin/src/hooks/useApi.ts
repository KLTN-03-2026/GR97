import { useState, useCallback } from 'react';
import { api } from '../lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (config: any) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await api(config);
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Có lỗi xảy ra';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}