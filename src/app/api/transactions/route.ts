import { transactionCreateSchema, transactionListSchema } from "@/lib/validators/transactions";
import { requireUser } from "@/server/auth-helpers";
import { handle, ok, readJson, searchParamsObject } from "@/server/http";
import { createTransaction, listTransactions } from "@/server/services/transactions";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const query = transactionListSchema.parse(searchParamsObject(req.url));
    const { items, ...meta } = await listTransactions(user.id, query);
    return ok(items, { meta });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = transactionCreateSchema.parse(await readJson(req));
    return ok(await createTransaction(user.id, input), { status: 201 });
  });
}
