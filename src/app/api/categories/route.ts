import { categoryCreateSchema, categoryListSchema } from "@/lib/validators/categories";
import { requireUser } from "@/server/auth-helpers";
import { handle, ok, readJson, searchParamsObject } from "@/server/http";
import { createCategory, listCategories } from "@/server/services/categories";

export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { type } = categoryListSchema.parse(searchParamsObject(req.url));
    return ok(await listCategories(user.id, type));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const input = categoryCreateSchema.parse(await readJson(req));
    return ok(await createCategory(user.id, input), { status: 201 });
  });
}
