import { Navigate } from 'react-router-dom';

interface POSRouteProps {
  children: React.ReactNode;
}

function getPOSUser() {
  try {
    const token = localStorage.getItem('pos_token');
    const user  = localStorage.getItem('pos_user');
    if (!token || !user) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      return null;
    }
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function POSRoute({ children }: POSRouteProps) {
  const user = getPOSUser();
  if (!user || !['cashier', 'admin'].includes(user.role)) {
    return <Navigate to="/pos/login" replace />;
  }
  return <>{children}</>;
}
