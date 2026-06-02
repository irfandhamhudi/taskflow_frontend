import { Skeleton } from '@/components/ui/skeleton';
// src/pages/JoinPage.tsx (atau nama file Anda)

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {  CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';
import axios from 'axios';

export default function JoinLinkPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const joinAttempted = useRef(false);

  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Process your invitation...');

  useEffect(() => {
    if (!projectId) {
      setStatus('error');
      setMessage('Project ID not found.');
      return;
    }

    if (joinAttempted.current) return;
    joinAttempted.current = true;

    const joinProject = async () => {
      try {
        const email = searchParams.get('email');
        let response;

        if (email) {
          // Email-based invitation (POST)
          response = await api.post(`/projects/${projectId}/join`, { token, email });
        } else {
          // General share link (GET)
          response = await api.get(`/projects/join-link/${projectId}`, {
            params: { token },
          });
        }

        if (response.data.success) {
          toast.success(response.data.message || 'Successfully joined the project!');
          setStatus('success');
          
          setTimeout(() => {
            navigate(`/projects/${projectId}`, { replace: true });
          }, 800);
        } else {
          throw new Error(response.data.message || 'Response was not successful');
        }
      } catch (err: unknown) {
        console.error('Join project error:', err);

        let errorMsg = 'Failed to join project.';

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            errorMsg = 'Your session has expired. Please log in again.';
            toast.error(errorMsg);

            // Redirect ke login dengan menyimpan URL asal
            setTimeout(() => {
              const currentUrl = window.location.pathname + window.location.search;
              navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
            }, 1500);
          } else if (err.response?.data?.message) {
            errorMsg = err.response.data.message;
          } else {
            errorMsg = 'The link may be expired or invalid.';
          }
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }

        setMessage(errorMsg);
        setStatus('error');

        // Jika error visibilitas private, tendang ke dashboard sesuai request
        if (errorMsg.toLowerCase().includes('private')) {
          toast.error("This project is private and cannot be joined via link.");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        }
      }
    };

    joinProject();
  }, [projectId, token, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-4 w-[200px] mx-auto" />
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <p className="text-lg font-medium">Redirecting to project...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <p className="text-lg font-medium text-destructive">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact the project owner to get a new invitation link.
            </p>
          </>
        )}
      </div>
    </div>
  );
}