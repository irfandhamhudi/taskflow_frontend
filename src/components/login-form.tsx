import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom"; // tambahkan Link di sini
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "../components/ui/field";
import { Input } from "../components/ui/input";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { login } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", data);
      if (res.data.success) {
        toast.success(res.data.message || "Login successful!");
        login(res.data.data, res.data.token); // Update context state immediately
        navigate("/dashboard");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const res = await api.post("/auth/google-login", {
          access_token: tokenResponse.access_token,
        });
        if (res.data.success) {
          toast.success("Google login successful!");
          login(res.data.data, res.data.token);
          navigate("/dashboard");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Google login failed");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error("Google login failed"),
  });

  const loginWithGitHub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
    // Redirect to GitHub authorization page
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email below to login to your account
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">
              {errors.email.message}
            </p>
          )}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              to="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="pr-10"
              {...register("password")}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 cursor-pointer" />
              ) : (
                <Eye className="h-4 w-4 cursor-pointer" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive mt-1">
              {errors.password.message}
            </p>
          )}
        </Field>

        <Field>
          <Button className="cursor-pointer w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 shadow-none font-semibold" type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <div className="flex flex-col gap-3">
            <Button className="cursor-pointer" variant="outline" type="button" onClick={() => googleLoginHandler()} disabled={isLoading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-2 h-5 w-5"
              >
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
            
            <Button className="cursor-pointer" variant="outline" type="button" onClick={loginWithGitHub} disabled={isLoading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-2 h-5 w-5"
              >
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  fill="currentColor"
                />
              </svg>
              Login with GitHub
            </Button>
          </div>

          <FieldDescription className="text-center mt-4">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="cursor-pointer underline underline-offset-4 hover:text-foreground"
            >
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
