export const getAuthToken = () =>
  localStorage.getItem('access_token') ?? localStorage.getItem('token') ?? localStorage.getItem('jwt');

export type AppRole = 'admin' | 'user';

type StoredUser = {
  Role?: string;
};

export const getCurrentUserRole = (): AppRole | null => {
  const raw = localStorage.getItem('current_user');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredUser;
    const role = String(parsed.Role ?? '').toLowerCase();
    if (role === 'admin') return 'admin';
    if (role === 'user') return 'user';
    return null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(getAuthToken());

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('jwt');
  localStorage.removeItem('current_user');
};
