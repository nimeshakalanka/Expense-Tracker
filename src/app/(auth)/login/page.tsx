import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

function safeCallback(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return "/dashboard";
  try {
    const url = new URL(v, "http://placeholder");
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/login")) return "/dashboard";
    return path;
  } catch {
    return "/dashboard";
  }
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { callbackUrl } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Sign in to your account to continue.</p>
      <LoginForm callbackUrl={safeCallback(callbackUrl)} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Ledgerly?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        Demo: <span className="font-mono">demo@example.com</span> / <span className="font-mono">Demo1234</span>
      </p>
    </>
  );
}
