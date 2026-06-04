import { useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "../utils/api";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import {
  Field,
  FieldDescription,
  // FieldGroup,
  FieldLabel,
} from "../components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/input-otp";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type OTPFormData = z.infer<typeof otpSchema>;

export default function OTPForm() {
  const [isLoading, setIsLoading] = useState(false);
  const hasSubmitted = useRef(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get("email") || "";
  const { login } = useAuth();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onChange", // real-time validation
  });

  const otpValue = watch("otp");

  const onSubmit = useCallback(
    async (data: OTPFormData) => {
      if (hasSubmitted.current) return;
      hasSubmitted.current = true;

      if (!email) {
        toast.error("Email not found. Please register again.");
        navigate("/register", { replace: true });
        return;
      }

      setIsLoading(true);

      try {
        const response = await api.post("/auth/verify-otp", {
          email,
          otp: data.otp,
        });

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Verification failed");
        }

        toast.success(response.data?.message || "OTP verified successfully!");

        // Update auth state with verified user data and token
        if (response.data?.data) {
          login(response.data.data, response.data.token);
        }

        // Backend already sets auth cookie → go straight to dashboard
        navigate("/dashboard", { replace: true });

      } catch (error: any) {
        hasSubmitted.current = false;

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Invalid or expired OTP";

        toast.error(errorMessage);
        setValue("otp", "", { shouldValidate: true }); // clear input
      } finally {
        setIsLoading(false);
      }
    },
    [email, navigate, setValue]
  );

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email not found");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/auth/resend-otp", { email });

      if (response.data?.success) {
        toast.success("New OTP has been sent to your email");
      } else {
        throw new Error(response.data?.message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to resend OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Enter Verification Code
          </h1>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to
            <br />
            <strong className="text-foreground">{email || "your email"}</strong>
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="otp" className="sr-only">
            Verification code
          </FieldLabel>

          <InputOTP
            maxLength={6}
            value={otpValue}
            onChange={(value) => setValue("otp", value, { shouldValidate: true })}
            containerClassName="justify-center"
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {errors.otp && (
            <p className="text-sm text-destructive text-center mt-2">
              {errors.otp.message}
            </p>
          )}

          <FieldDescription className="text-center mt-4 text-sm">
            Enter the 6-digit code sent to your email
          </FieldDescription>
        </Field>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || otpValue.length !== 6 || !isValid}
          size="lg"
        >
          {isLoading
            ? "Verifying..."
            : otpValue.length === 6
            ? "Verify Code"
            : "Enter 6-digit code"}
        </Button>

        <div className="text-center text-sm">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isLoading}
            className={cn(
              "text-primary hover:underline font-medium",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            Resend code
          </button>
        </div>
      </form>
    </div>
  );
}
