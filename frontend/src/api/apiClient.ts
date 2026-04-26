import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

let interceptorId: number | null = null;

export function setAuthInterceptor(getToken: () => Promise<string>) {
  interceptorId = apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

export function clearAuthInterceptor() {
  if (interceptorId !== null) {
    apiClient.interceptors.request.eject(interceptorId);
    interceptorId = null;
  }
}

export default apiClient;
