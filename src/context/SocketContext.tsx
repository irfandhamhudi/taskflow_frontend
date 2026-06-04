import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinProject: () => {},
  leaveProject: () => {},
  joinWorkspace: () => {},
  leaveWorkspace: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Hanya buat socket sekali
    if (socketRef.current) return;

    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanApiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
    const token = localStorage.getItem('token');

    const socketIo = io(cleanApiUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: user ? { userId: user._id } : {},
    });

    socketRef.current = socketIo;

    socketIo.on('connect', () => {
      console.log('✅ Socket.IO connected:', socketIo.id);
      setIsConnected(true);
      
      if (user?._id) {
        socketIo.emit('identify', user._id);
      }
    });

    socketIo.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketIo.on('connect_error', (err) => {
      console.warn('⚠️ Socket connect error:', err.message);
    });

    socketIo.io.engine.on('upgrade', () => {
      console.log('🚀 Upgraded to WebSocket!');
    });

    // ================= GLOBAL LISTENERS =================
    socketIo.on('comment_added', (data) => {
      console.log('🌟 Global: comment_added received', data);
    });

    socketIo.on('comment_reaction_updated', (data) => {
      console.log('👍 Global: reaction updated', data);
    });

    socketIo.on('comment_edited', (data) => {
      console.log('✏️ Global: comment edited', data);
    });

    socketIo.on('comment_deleted', (data) => {
      console.log('🗑️ Global: comment deleted', data);
    });

    socketIo.on('user_deleted', (data) => {
      if (user && data.userId === user._id) {
        // Handle current user deletion
        window.location.href = '/login?reason=account_deleted';
      }
    });

    return () => {
      // Keep socket alive during app lifecycle
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Identify socket when user becomes available
  useEffect(() => {
    if (socketRef.current && isConnected && user?._id) {
      socketRef.current.emit('identify', user._id);
      console.log(`🔌 Socket identified for user: ${user._id}`);
    }
  }, [user, isConnected]);

  const joinProject = useCallback((projectId: string) => {
    if (!socketRef.current || !projectId) return;
    socketRef.current.emit('join_project', projectId);
    console.log(`✅ Joined project room: project:${projectId}`);
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    if (!socketRef.current || !projectId) return;
    socketRef.current.emit('leave_project', projectId);
    console.log(`❌ Left project room: project:${projectId}`);
  }, []);

  const joinWorkspace = useCallback((workspaceId: string) => {
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit('join_workspace', workspaceId);
    console.log(`✅ Joined workspace room: workspace:${workspaceId}`);
  }, []);

  const leaveWorkspace = useCallback((workspaceId: string) => {
    if (!socketRef.current || !workspaceId) return;
    socketRef.current.emit('leave_workspace', workspaceId);
    console.log(`❌ Left workspace room: workspace:${workspaceId}`);
  }, []);

  const value = useMemo(() => ({
    socket: socketRef.current,
    isConnected,
    joinProject,
    leaveProject,
    joinWorkspace,
    leaveWorkspace,
  }), [isConnected, joinProject, leaveProject, joinWorkspace, leaveWorkspace]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
