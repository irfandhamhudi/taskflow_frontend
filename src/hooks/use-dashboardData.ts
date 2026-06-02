import { useState, useEffect } from "react";
import { dashboardService } from "../services/dashboardAPi";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import type { DashboardData } from "../types/dashboard";

type DashboardState = {
  loading: boolean;
  error: string | null;
  userName: string;
  dashboardData: DashboardData | null;
};

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    userName: "there",
    dashboardData: null,
  });

  const { activeWorkspace } = useWorkspaceStore();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!activeWorkspace) return;
      try {
        const [name, dashData] = await Promise.all([
          dashboardService.getCurrentUserName(),
          dashboardService.getDashboardData(activeWorkspace._id),
        ]);

        if (!mounted) return;

        setState({
          loading: false,
          error: null,
          userName: name,
          dashboardData: dashData,
        });
      } catch (err: unknown) {
        if (!mounted) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: (err as Error).message || "Failed to load dashboard",
        }));
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [activeWorkspace]);

  return {
    ...state,
  };
}