import { useState, useEffect } from "react";
import { meetingService } from "../services/meetingService";

import { useWorkspaceStore } from "../store/useWorkspaceStore";

export function useMeetings() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeWorkspace } = useWorkspaceStore();

  const fetchMeetings = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const data = await meetingService.getMeetings(activeWorkspace._id);
      setMeetings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [activeWorkspace]);

  return { meetings, loading, error, refreshMeetings: fetchMeetings };
}
