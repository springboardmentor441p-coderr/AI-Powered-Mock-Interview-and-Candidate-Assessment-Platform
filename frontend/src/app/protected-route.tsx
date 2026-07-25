import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/types/api";
import { useMe } from "@/features/auth/hooks";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const location = useLocation();
  const { accessToken, user, hasHydrated } = useAuthStore();
  const { isLoading } = useMe(Boolean(accessToken) && !user);

  if (!hasHydrated) {
    return <FullScreenLoader />;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user && isLoading) {
    return <FullScreenLoader />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { accessToken, hasHydrated } = useAuthStore();
  if (!hasHydrated) return <FullScreenLoader />;
  if (accessToken) return <Navigate to="/app" replace />;
  return <Outlet />;
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="h-6 w-6 text-primary" />
    </div>
  );
}
