import { toISODate, todayUTC } from "@/lib/dates";
import { transactionFilterSchema } from "@/lib/validators/transactions";
import { requireUser } from "@/server/auth-helpers";
import { handle, searchParamsObject } from "@/server/http";
import { exportTransactionsCsv } from "@/server/services/transactions";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const filter = transactionFilterSchema.parse(searchParamsObject(req.url));
    const csv = await exportTransactionsCsv(user.id, filter);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${toISODate(todayUTC())}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
