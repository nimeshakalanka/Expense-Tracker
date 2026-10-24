"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, applyFieldErrors } from "@/lib/api-client";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validators/auth";

const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: empty });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ChangePasswordInput) {
    try {
      await apiFetch("/api/profile/password", { method: "POST", json: values });
      form.reset(empty);
      toast.success("Password changed");
    } catch (err) {
      if (!applyFieldErrors(err, form.setError)) toast.error(err instanceof Error ? err.message : "Could not change password");
    }
  }

  return (
    <Card className="sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>Use at least 8 characters with a letter and a number.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4">
          <FormField id="pw-current" label="Current password" error={errors.currentPassword?.message}>
            {(p) => <PasswordInput {...p} autoComplete="current-password" {...form.register("currentPassword")} />}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="pw-new" label="New password" error={errors.newPassword?.message}>
              {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register("newPassword")} />}
            </FormField>
            <FormField id="pw-confirm" label="Confirm new password" error={errors.confirmPassword?.message}>
              {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register("confirmPassword")} />}
            </FormField>
          </div>
        </CardContent>
        <CardFooter className="mt-4 justify-end border-t py-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Change password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
