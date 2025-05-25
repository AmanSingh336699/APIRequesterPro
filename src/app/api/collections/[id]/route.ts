import { NextRequest, NextResponse } from "next/server";
import Collection from "@/models/Collection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const resolvedParams = await context.params;
    const collectionId = resolvedParams.id;

    if (req.method === "DELETE") {
        try {
            const collection = await Collection.findOneAndDelete({
                _id: collectionId,
                userId: session.user.id
            })
            if(!collection){
                return NextResponse.json({ error: "Collection not found" }, { status: 404 })
            }
            return NextResponse.json({message: "Collection deleted successfully"});
        } catch (error: any) {
            return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const DELETE = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));
