import { Skeleton } from '../../../components/ui/skeleton';
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";


export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status] = useState("Authenticating with GitHub...");
  const processedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      toast.error("No authorization code found");
      navigate("/login");
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    const authenticate = async () => {
      try {
        const res = await api.post("/auth/github-login", { code });
        if (res.data.success) {
          toast.success("GitHub login successful!");
          login(res.data.data, res.data.token);
          navigate("/dashboard");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "GitHub authentication failed");
        navigate("/login");
      }
    };

    authenticate();
  }, [searchParams, navigate, login]);

  return (
    <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-[250px]" />
      </div>
      <p className="text-lg font-medium text-muted-foreground">{status}</p>
    </div>
  );
}
