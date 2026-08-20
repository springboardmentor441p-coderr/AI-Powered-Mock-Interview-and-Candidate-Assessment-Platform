import {useAuth} from '../context/AuthContext';
export default function ProtectedRoute({children}){const {auth}=useAuth(); return auth ? children : null;}
