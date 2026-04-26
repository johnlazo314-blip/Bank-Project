import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import apiClient from '../api/apiClient';

interface DbUser {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: 'user' | 'admin';
}

interface UserContextValue {
  dbUser: DbUser | null;
  isAdmin: boolean;
  loadingUser: boolean;
}

const UserContext = createContext<UserContextValue>({
  dbUser: null,
  isAdmin: false,
  loadingUser: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { state } = useAuthContext();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated) {
      setLoadingUser(true);
      apiClient.get<DbUser>('/api/users/me')
        .then((res) => setDbUser(res.data))
        .catch(() => setDbUser(null))
        .finally(() => setLoadingUser(false));
    } else {
      setDbUser(null);
    }
  }, [state.isAuthenticated]);

  return (
    <UserContext.Provider value={{ dbUser, isAdmin: dbUser?.Role === 'admin', loadingUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
