import { profileSchema } from "@/lib/validators/auth";
import { requireUser } from "@/server/auth-helpers";
import { handle, ok, readJson } from "@/server/http";
import { updateProfile } from "@/server/services/users";

export async function GET() {
  return handle(async () => ok(await requireUser()));
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = profileSchema.parse(await readJson(req));
    return ok(await updateProfile(user.id, input));
  });
}
