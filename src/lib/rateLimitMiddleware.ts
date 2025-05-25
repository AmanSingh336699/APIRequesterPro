import { NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { RATE_LIMIT_CONFIG } from "@/lib/constants";

const rateLimiter = new RateLimiterMemory(RATE_LIMIT_CONFIG);

export function rateLimitMiddleware<T>(handler: (req: NextRequest, context: T) => Promise<NextResponse>) {
  return async (req: NextRequest, context: T) => {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    try {
      await rateLimiter.consume(ip);
      return await handler(req, context);
    } catch (error) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }
  };
}