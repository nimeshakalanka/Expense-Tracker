import { budgetDeleteSchema, budgetUpsertSchema } from "@/lib/validators/categories";
import { requireUser } from "@/server/auth-helpers";
import { handle, noContent, ok, readJson, searchParamsObject } from "@/server/http";
import { deleteBudget, upsertBudget } from "@/server/services/categories";

export async function PUT(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = budgetUpsertSchema.parse(await readJson(req));
    return ok(await upsertBudget(user.id, input));
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { categoryId } = budgetDeleteSchema.parse(searchParamsObject(req.url));
    await deleteBudget(user.id, categoryId);
    return noContent();
  });
}
