"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      setFormError(
        res.code === "rate_limited"
          ? "Too many failed attempts. Please wait 15 minutes and try again."
          : "Invalid email or password.",
      );
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      )}
      <FormField id="email" label="Email" error={errors.email?.message}>
        {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" {...form.register("email")} />}
      </FormField>
      <FormField id="password" label="Password" error={errors.password?.message}>
        {(p) => <PasswordInput {...p} autoComplete="current-password" {...form.register("password")} />}
      </FormField>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 h-10">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        Sign in
      </Button>
    </form>
  );
}
