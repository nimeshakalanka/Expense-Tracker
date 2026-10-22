import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppError } from "@/server/http";
import { getUser, type PublicUser } from "@/server/services/users";

const currentUser = cache(async (): Promise<PublicUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return getUser(id);
});

export async function requireUser(): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in");
  return user;
}

export async function getPageUser(): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
