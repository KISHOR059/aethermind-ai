import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/auth.context";
import { loginSchema, type LoginFormValues } from "../validation/auth.validation";
import AuthCard from "./AuthCard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { notify } from "@/shared/lib/notifications";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      notify.success("Welcome back");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notify.error("Unable to sign in", error instanceof Error ? error.message : "Please check your credentials.");
    }
  };

  return <AuthCard title="Welcome back" description="Sign in to continue to your workspace." footer={<>Don&apos;t have an account? <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/register">Create one</Link></>}>
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="login-email">Email</label><Input id="login-email" autoComplete="email" type="email" {...register("email")} />{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}</div>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="login-password">Password</label><Input id="login-password" autoComplete="current-password" type="password" {...register("password")} />{errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}</div>
      <Button className="w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}</Button>
    </form>
  </AuthCard>;
}

export default LoginForm;
