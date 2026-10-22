import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { loginSchema } from "@/lib/validators/auth";
import {
  LOGIN_EMAIL_RULE,
  LOGIN_IP_RULE,
  clientIp,
  isLimited,
  recordAttempt,
  resetLimit,
} from "@/server/rate-limit";
import { verifyCredentials } from "@/server/services/users";

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const emailKey = `login:${email}`;
        const ipKey = `login-ip:${clientIp(request.headers)}`;
        if ((await isLimited(emailKey)) || (await isLimited(ipKey))) throw new RateLimitedError();

        const user = await verifyCredentials(email, password);
        if (!user) {
          const [emailLocked, ipLocked] = await Promise.all([
            recordAttempt(emailKey, LOGIN_EMAIL_RULE),
            recordAttempt(ipKey, LOGIN_IP_RULE),
          ]);
          if (emailLocked || ipLocked) throw new RateLimitedError();
          return null;
        }

        await resetLimit(emailKey);
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
