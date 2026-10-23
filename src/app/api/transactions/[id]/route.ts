import { idSchema } from "@/lib/validators/common";
import { transactionUpdateSchema } from "@/lib/validators/transactions";
import { requireUser } from "@/server/auth-helpers";
import { handle, noContent, notFound, ok, readJson } from "@/server/http";
import { deleteTransaction, getTransaction, updateTransaction } from "@/server/services/transactions";

type Ctx = RouteContext<"/api/transactions/[id]">;

async function parseId(ctx: Ctx) {
  const parsed = idSchema.safeParse((await ctx.params).id);
  if (!parsed.success) throw notFound("Transaction");
  return parsed.data;
}

export async function GET(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    return ok(await getTransaction(user.id, await parseId(ctx)));
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const id = await parseId(ctx);
    const input = transactionUpdateSchema.parse(await readJson(req));
    return ok(await updateTransaction(user.id, id, input));
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    await deleteTransaction(user.id, await parseId(ctx));
    return noContent();
  });
}
