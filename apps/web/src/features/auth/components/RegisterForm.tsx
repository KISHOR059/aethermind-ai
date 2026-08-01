import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/auth.context";
import { registerSchema, type RegisterFormValues } from "../validation/auth.validation";
import AuthCard from "./AuthCard";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { notify } from "@/shared/lib/notifications";

function RegisterForm() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser({ firstName: values.firstName, lastName: values.lastName, email: values.email, password: values.password });
      notify.success("Account created", "You are now signed in.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notify.error("Unable to create account", error instanceof Error ? error.message : "Please review the form.");
    }
  };

  return <AuthCard title="Create your account" description="Start organizing your work with AetherMind." footer={<>Already have an account? <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/login">Sign in</Link></>}>
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="register-first-name">First name</label><Input id="register-first-name" autoComplete="given-name" {...register("firstName")} />{errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}</div><div className="space-y-2"><label className="text-sm font-medium" htmlFor="register-last-name">Last name</label><Input id="register-last-name" autoComplete="family-name" {...register("lastName")} />{errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}</div></div>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="register-email">Email</label><Input id="register-email" autoComplete="email" type="email" {...register("email")} />{errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}</div>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="register-password">Password</label><Input id="register-password" autoComplete="new-password" type="password" {...register("password")} />{errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}</div>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="register-confirm-password">Confirm password</label><Input id="register-confirm-password" autoComplete="new-password" type="password" {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}</div>
      <Button className="w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating account…" : "Create account"}</Button>
    </form>
  </AuthCard>;
}

export default RegisterForm;
