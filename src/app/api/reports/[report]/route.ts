import { z } from "zod";
import { dateRangeSchema, txTypeSchema } from "@/lib/validators/common";
import { requireUser } from "@/server/auth-helpers";
import { handle, notFound, ok, searchParamsObject } from "@/server/http";
import { getByCategory, getByMonth, getSummary, getTopExpenses, getTrend } from "@/server/services/reports";

type Ctx = RouteContext<"/api/reports/[report]">;

const typeSchema = z.object({ type: txTypeSchema.default("EXPENSE") });

export async function GET(req: Request, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const params = searchParamsObject(req.url);
    const range = dateRangeSchema.parse({ from: params.from, to: params.to });

    switch ((await ctx.params).report) {
      case "summary":
        return ok(await getSummary(user.id, range));
      case "by-category":
        return ok(await getByCategory(user.id, range, typeSchema.parse(params).type));
      case "by-month":
        return ok(await getByMonth(user.id, range));
      case "trend":
        return ok(await getTrend(user.id, range));
      case "top-expenses":
        return ok(await getTopExpenses(user.id, range));
      default:
        throw notFound("Report");
    }
  });
}
