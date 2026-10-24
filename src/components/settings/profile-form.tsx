"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, applyFieldErrors } from "@/lib/api-client";
import { formatDay } from "@/lib/dates";
import { nameSchema } from "@/lib/validators/auth";

const schema = z.object({ name: nameSchema });
type Values = z.input<typeof schema>;

export function ProfileForm({ name, email, memberSince }: { name: string; email: string; memberSince: string }) {
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name } });
  const { errors, isSubmitting, isDirty } = form.formState;

  async function onSubmit(values: Values) {
    try {
      await apiFetch("/api/profile", { method: "PATCH", json: values });
      form.reset(values);
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      if (!applyFieldErrors(err, form.setError)) toast.error(err instanceof Error ? err.message : "Could not update profile");
    }
  }

  return (
    <Card className="sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>Member since {formatDay(memberSince)}</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid gap-4">
          <FormField id="profile-name" label="Full name" error={errors.name?.message}>
            {(p) => <Input {...p} autoComplete="name" {...form.register("name")} />}
          </FormField>
          <FormField id="profile-email" label="Email" hint="Email can't be changed.">
            {(p) => <Input {...p} type="email" value={email} readOnly disabled />}
          </FormField>
        </CardContent>
        <CardFooter className="mt-4 justify-end border-t py-4">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Save profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
