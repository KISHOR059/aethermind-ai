import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/auth.context";
import { loginSchema, type LoginFormValues } from "../validation/auth.validation";
import { AetherMindLogo } from "@/shared/components/AetherMindLogo";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";
import { notify } from "@/shared/lib/notifications";

/* ─────────────────────────────────────────────────────────────
   LoginForm — premium minimal login, light + dark mode aware.
   All authentication logic is UNCHANGED from original.
   ───────────────────────────────────────────────────────────── */

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError]       = useState<string | null>(null);
  const [rememberMe, setRememberMe]     = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  // Sanitise raw API/network errors before showing them to users
  const getCleanErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const msg = error.message;
      if (
        msg.includes("AxiosError")    ||
        msg.includes("500")            ||
        msg.includes("Network Error")  ||
        msg.includes("MongoServer")    ||
        msg.includes("JWT")
      ) {
        return "Unable to connect. Please try again in a moment.";
      }
      return msg;
    }
    return "The email or password you entered is incorrect.";
  };

  // Submit handler — logic identical to original
  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      await login(values);
      sessionStorage.setItem("aethermind_just_logged_in", "true");
      notify.success("Welcome back");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const msg = getCleanErrorMessage(error);
      setAuthError(msg);
      notify.error("Unable to sign in", msg);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-3.5 py-6 sm:px-6 sm:py-10">
      {/* Very subtle purple ambient glow — adapts via opacity */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -bottom-32 -left-24 h-[400px] w-[400px] rounded-full bg-violet-500/[0.06] blur-[96px] dark:bg-violet-500/[0.10]" />
        <div className="absolute -right-24 -top-20 h-[300px] w-[300px] rounded-full bg-violet-500/[0.04] blur-[80px] dark:bg-violet-500/[0.07]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
        className="w-full max-w-[420px]"
      >
        {/* ── Brand block ── */}
        <div className="mb-6 sm:mb-7 flex flex-col items-center gap-2 text-center">
          <AetherMindLogo size="lg" linkToHome={false} />
          <p className="mt-1 text-[11px] font-medium tracking-[0.25em] text-muted-foreground/70 uppercase select-none">
            Your intelligent productivity assistant
          </p>
        </div>

        {/* ── Card ── */}
        <div className={cn(
          "rounded-2xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm",
          "dark:border-border/40 dark:shadow-none",
        )}>
          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to continue to AetherMind
            </p>
          </div>

          {/* ── Form ── */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Auth error */}
            {authError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/[0.08] p-3.5 text-xs animate-in fade-in-50 duration-150 dark:border-destructive/30 dark:bg-destructive/[0.12]"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="font-semibold leading-none text-destructive">Unable to sign in</p>
                  <p className="text-destructive/80">{authError}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  className={cn(
                    "h-11 pl-10 text-sm",
                    "focus-visible:ring-violet-500/30 focus-visible:border-violet-500/60",
                    errors.email && "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20",
                  )}
                  {...register("email", {
                    onChange: () => { if (authError) setAuthError(null); },
                  })}
                />
              </div>
              {errors.email && (
                <p
                  id="login-email-error"
                  className="text-xs text-destructive animate-in fade-in-50 duration-150"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60"
                  aria-hidden="true"
                />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className={cn(
                    "h-11 pl-10 pr-10 text-sm",
                    "focus-visible:ring-violet-500/30 focus-visible:border-violet-500/60",
                    errors.password && "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20",
                  )}
                  {...register("password", {
                    onChange: () => { if (authError) setAuthError(null); },
                  })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword
                    ? <EyeOff className="size-4" aria-hidden="true" />
                    : <Eye    className="size-4" aria-hidden="true" />
                  }
                </button>
              </div>
              {errors.password && (
                <p
                  id="login-password-error"
                  className="text-xs text-destructive animate-in fade-in-50 duration-150"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-remember-me"
                className="flex cursor-pointer select-none items-center gap-2"
              >
                <input
                  id="login-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-[15px] cursor-pointer rounded accent-black dark:accent-white"
                />
                <span className="text-xs text-muted-foreground">Remember me</span>
              </label>
              {/* No /forgot-password route exists — non-navigable */}
              <span
                className="text-xs text-muted-foreground/60 cursor-default"
                title="Password recovery is not yet available"
              >
                Forgot password?
              </span>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "group h-11 w-full rounded-xl font-semibold text-[15px] tracking-wide",
                "bg-foreground text-background",
                "hover:bg-foreground/90",
                "dark:bg-foreground dark:text-background dark:hover:bg-foreground/90",
                "border border-transparent hover:border-violet-500/40",
                "transition-all duration-200 active:scale-[0.985]",
                "focus-visible:ring-violet-500/30",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight
                    className="ml-1.5 size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>
          </form>

          {/* OR divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[11px] text-muted-foreground/50">OR</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Sign up */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-foreground transition-colors hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Security footer */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-muted-foreground/50">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          <p className="text-[11px]">
            Secure login&nbsp;&bull;&nbsp;Your data is protected
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default LoginForm;
