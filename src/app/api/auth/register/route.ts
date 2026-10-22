import { registerSchema } from "@/lib/validators/auth";
import { AppError, handle, ok, readJson } from "@/server/http";
import { REGISTER_IP_RULE, clientIp, isLimited, recordAttempt } from "@/server/rate-limit";
import { createUser } from "@/server/services/users";

export async function POST(req: Request) {
  return handle(async () => {
    const ipKey = `register:${clientIp(req.headers)}`;
    if (await isLimited(ipKey)) {
      throw new AppError("RATE_LIMITED", "Too many sign-up attempts. Please try again later.");
    }
    const input = registerSchema.parse(await readJson(req));
    await recordAttempt(ipKey, REGISTER_IP_RULE);
    const user = await createUser(input);
    return ok({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  });
}
