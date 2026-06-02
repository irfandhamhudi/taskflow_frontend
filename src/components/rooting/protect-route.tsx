import { Skeleton } from '@/components/ui/skeleton';
import { type JSX, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";
 

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { workspaces, hasFetchedWorkspaces, fetchWorkspaces } = useWorkspaceStore();
  const location = useLocation();

  useEffect(() => {
    if (user && !hasFetchedWorkspaces) {
      fetchWorkspaces();
    }
  }, [user, hasFetchedWorkspaces, fetchWorkspaces]);

  // Sedang loading autentikasi atau data workspace awal
  if (authLoading || (user && !hasFetchedWorkspaces)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <p className="text-xs text-muted-foreground animate-pulse text-center">
          Preparing your workspace...
        </p>
      </div>
    );
  }

  // Jika belum login, redirect ke login dengan menyimpan lokasi asal
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika sudah login tapi tidak punya workspace sama sekali
  // Dan tidak sedang di halaman setup-workspace
  if (hasFetchedWorkspaces && workspaces.length === 0 && location.pathname !== '/setup-workspace') {
    return <Navigate to="/setup-workspace" replace />;
  }

  // Jika sudah punya workspace tapi mencoba akses halaman setup manual
  if (hasFetchedWorkspaces && workspaces.length > 0 && location.pathname === '/setup-workspace') {
    return <Navigate to="/dashboard" replace />;
  }

  // Sudah login & kondisi workspace terpenuhi → render children
  return children;
}
