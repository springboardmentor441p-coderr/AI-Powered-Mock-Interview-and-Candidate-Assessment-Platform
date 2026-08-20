import {createContext, useContext, useEffect, useState} from 'react';
import {api} from '../api/client';

const AuthContext = createContext();
const STORAGE_KEY = 'smarthire_token';

export function AuthProvider({children}) {
  const [auth, setAuthState] = useState(null);
  const [restoring, setRestoring] = useState(true);

  function setAuth(value) {
    setAuthState(value);
    if (value && value.access_token) localStorage.setItem(STORAGE_KEY, value.access_token);
    else localStorage.removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) { setRestoring(false); return; }
    api('/users/me', {}, token)
      .then(user => setAuthState({access_token: token, user}))
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setRestoring(false));
  }, []);

  return <AuthContext.Provider value={{auth, setAuth, restoring}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
