import { NextRequest, NextResponse } from "next/server";

export function securityMiddleware<T>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: T) => {
    const response = await handler(req, context);

    response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
  };
}
