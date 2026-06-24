import { NextResponse } from "next/server";
import { z } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "HttpError"; }
}

export const created = <T>(data: T) => NextResponse.json(data, { status: 201 });

export async function parseBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  const text = await req.text();
  if (text.length > 100_000) throw new HttpError(413, "Request body too large");
  let value: unknown;
  try { value = text ? JSON.parse(text) : {}; } catch { throw new HttpError(400, "Malformed JSON body"); }
  const result = schema.safeParse(value);
  if (!result.success) throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid request");
  return result.data;
}

export async function route<T>(handler: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await handler();
    return result instanceof NextResponse ? result : NextResponse.json(result);
  } catch (error) {
    if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
