import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PasswordForm } from "@/components/settings/password-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { getPageUser } from "@/server/auth-helpers";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getPageUser();
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, preferences and password." />
      <div className="grid max-w-2xl grid-cols-1 gap-6">
        <ProfileForm name={user.name} email={user.email} memberSince={user.createdAt.toISOString()} />
        <PreferencesForm currency={user.currency} />
        <PasswordForm />
      </div>
    </>
  );
}
