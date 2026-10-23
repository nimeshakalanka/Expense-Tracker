import { idSchema } from "@/lib/validators/common";
import { categoryDeleteSchema, categoryUpdateSchema } from "@/lib/validators/categories";
import { requireUser } from "@/server/auth-helpers";
import { handle, notFound, ok, readJson, searchParamsObject } from "@/server/http";
import { deleteCategory, updateCategory } from "@/server/services/categories";

type Ctx = RouteContext<"/api/categories/[id]">;

async function parseId(ctx: Ctx) {
  const parsed = idSchema.safeParse((await ctx.params).id);
  if (!parsed.success) throw notFound("Category");
  return parsed.data;
}

export async function PATCH(req: Request, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const id = await parseId(ctx);
    const input = categoryUpdateSchema.parse(await readJson(req));
    return ok(await updateCategory(user.id, id, input));
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return handle(async () => {
    const user = await requireUser();
    const id = await parseId(ctx);
    const { reassignTo } = categoryDeleteSchema.parse(searchParamsObject(req.url));
    return ok(await deleteCategory(user.id, id, reassignTo));
  });
}
