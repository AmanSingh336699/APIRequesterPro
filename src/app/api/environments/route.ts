import { NextRequest, NextResponse } from "next/server";
import Environment from "@/models/Environment";
import { z } from "zod";
import { sanitizeObject } from "@/lib/sanitize";
import { securityMiddleware } from "@/lib/securityMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const createEnvironmentSchema = z.object({
    name: z.string().min(1, "Environment name is required").trim(),
    variables: z.array(
        z.object({
            key: z.string().min(1, "Variable key is required").trim(),
            value: z.string().trim(),
        })
    ).optional(),
});

async function handler(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (req.method === "GET") {
        try {
            const environments = await Environment.find({ userId: session.user.id }).lean();
            return NextResponse.json(environments);
        } catch (error: any) {
            console.error("Error fetching environments:", error);
            return NextResponse.json({ error: "Failed to fetch environments" }, { status: 500 });
        }
    }

    if (req.method === "POST") {
        try {
            const body = await req.json();
            const sanitizedBody = sanitizeObject(body);
            const { name, variables } = createEnvironmentSchema.parse(sanitizedBody);
            const environment = new Environment({
                userId: session.user.id,
                name,
                variables: variables || [],
            });
            await environment.save();
            return NextResponse.json(environment, { status: 201 });
        } catch (error: any) {
            console.error("Error creating environment:", error);
            if (error instanceof z.ZodError) {
                return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
            }
            return NextResponse.json(
                { error: error.message || "Failed to create environment" },
                { status: 400 }
            );
        }
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const GET = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));
export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));