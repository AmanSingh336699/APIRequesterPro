import { NextRequest, NextResponse } from "next/server";

type Middleware = (
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) => (req: NextRequest, context: any) => Promise<NextResponse>;

export function composeMiddlewares(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  ...middlewares: Middleware[]
) {
  return middlewares.reduceRight((next, middleware) => middleware(next), handler);
}
