import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export function dbMiddleware<T>(handler: (req: NextRequest, context: T) => Promise<NextResponse>) {
  return async (req: NextRequest, context: T) => {
    try {
      await connectToDatabase();
      return await handler(req, context);
    } catch (error: any) {
      console.error("Database connection error:", error);
      return NextResponse.json({ error: "Failed to connect to database" }, { status: 500 });
    }
  };
}