import { changePasswordSchema } from "@/lib/validators/auth";
import { requireUser } from "@/server/auth-helpers";
import { handle, noContent, readJson } from "@/server/http";
import { changePassword } from "@/server/services/users";

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = changePasswordSchema.parse(await readJson(req));
    await changePassword(user.id, input);
    return noContent();
  });
}
