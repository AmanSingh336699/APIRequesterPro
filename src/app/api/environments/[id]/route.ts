import { NextRequest, NextResponse } from "next/server";
import Environment from "@/models/Environment";
import { securityMiddleware } from "@/lib/securityMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { z } from "zod";
import { sanitizeObject } from "@/lib/sanitize";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const updateEnvironmentSchema = z.object({
    name: z.string().min(1, "Environment name is required").trim(),
    variables: z.array(
        z.object({
            key: z.string().min(1, "Variable key is required").trim(),
            value: z.string().trim(),
        })
    ).optional(),
});

interface RouteContext {
  params: {
    id: string;
  };
}

async function handler(req: NextRequest, context: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await context.params;
    const envId = resolvedParams.id;
    if (req.method === "PUT") {
        try {
            const body = await req.json();
            const sanitizedBody = sanitizeObject(body);
            const { name, variables } = updateEnvironmentSchema.parse(sanitizedBody);
            const environment = await Environment.findOneAndUpdate(
                { _id: envId, userId: session.user.id },
                { name, variables: variables || [] },
                { new: true }
            );
            if (!environment) {
                return NextResponse.json({ error: "Environment not found" }, { status: 404 });
            }
            return NextResponse.json(environment);
        } catch (error: any) {
            console.error("Error updating environment:", error);
            if (error instanceof z.ZodError) {
                return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
            }
            return NextResponse.json(
                { error: error.message || "Failed to update environment" },
                { status: 400 }
            );
        }
    }

    if (req.method === "DELETE") {
        try {
            const environment = await Environment.findOneAndDelete({
                _id: envId,
                userId: session.user.id,
            });
            if (!environment) {
                return NextResponse.json({ error: "Environment not found" }, { status: 404 });
            }
            return NextResponse.json({ message: "Environment deleted successfully" });
        } catch (error: any) {
            console.error("Error deleting environment:", error);
            return NextResponse.json({ error: "Failed to delete environment" }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const PUT = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));
export const DELETE = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));