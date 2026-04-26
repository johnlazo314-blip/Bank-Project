import { useEffect } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { setAuthInterceptor, clearAuthInterceptor } from '../api/apiClient';

export function useAuthInterceptor() {
  const { state, getAccessToken } = useAuthContext();

  useEffect(() => {
    if (state.isAuthenticated) {
      setAuthInterceptor(getAccessToken);
    }
    return () => {
      clearAuthInterceptor();
    };
  }, [state.isAuthenticated, getAccessToken]);
}
