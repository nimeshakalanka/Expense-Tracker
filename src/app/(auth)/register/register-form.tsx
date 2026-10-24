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
import { ApiClientError, apiFetch, applyFieldErrors } from "@/lib/api-client";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      await apiFetch("/api/auth/register", { method: "POST", json: values });
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "CONFLICT") {
        form.setError("email", { message: err.message });
      } else if (!applyFieldErrors(err, form.setError)) {
        setFormError(err instanceof Error ? err.message : "Could not create your account.");
      }
      return;
    }
    const res = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (res?.error) {
      router.push("/login");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
      {formError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      )}
      <FormField id="name" label="Full name" error={errors.name?.message}>
        {(p) => <Input {...p} autoComplete="name" {...form.register("name")} />}
      </FormField>
      <FormField id="email" label="Email" error={errors.email?.message}>
        {(p) => <Input {...p} type="email" autoComplete="email" inputMode="email" {...form.register("email")} />}
      </FormField>
      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
        hint="At least 8 characters, with a letter and a number."
      >
        {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register("password")} />}
      </FormField>
      <FormField id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register("confirmPassword")} />}
      </FormField>
      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2 h-10">
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        Create account
      </Button>
    </form>
  );
}
