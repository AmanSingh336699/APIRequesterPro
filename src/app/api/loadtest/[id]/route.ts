import LoadTestResult from "@/models/LoadTestResult";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { securityMiddleware } from "@/lib/securityMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { dbMiddleware } from "@/lib/dbMiddleware";

interface RouteContext {
    params: {
        id: string;
    };
}

async function handler(req: NextRequest, context: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const resolvedParams = await context.params;
    const loadId = resolvedParams.id;
    if (req.method === "GET") {
        const result = await LoadTestResult.findOne({ _id: loadId, userId: session.user.id }).lean();
        if (!result) {
            return NextResponse.json({ error: "Load test result not found" }, { status: 404 });
        }
        return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const GET = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)))