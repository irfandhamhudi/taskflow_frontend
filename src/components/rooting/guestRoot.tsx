import { Skeleton } from '@/components/ui/skeleton';
import { type JSX } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface GuestRouteProps {
  children: JSX.Element;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
