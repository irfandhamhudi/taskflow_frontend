import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "../../pages/Landing/index";
import { useAuth } from "../../context/AuthContext";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";

export function RootRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { workspaces, hasFetchedWorkspaces, fetchWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    if (user && !hasFetchedWorkspaces) {
      fetchWorkspaces();
    }
  }, [user, hasFetchedWorkspaces, fetchWorkspaces]);

  if (authLoading || (user && !hasFetchedWorkspaces)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (user) {
    if (hasFetchedWorkspaces && workspaces.length === 0) {
      return <Navigate to="/setup-workspace" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}
