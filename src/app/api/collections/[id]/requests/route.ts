import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Request from "@/models/Request";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { securityMiddleware } from "@/lib/securityMiddleware";

interface RouteContext {
  params: {
    id: string;
  };
}

async function getHandler(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await context.params;
    const collectionId = resolvedParams.id;

    const requests = await Request.find({
      collectionId: collectionId,
      userId: session.user.id,
    }).lean();
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

async function postHandler(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const resolvedParams = context.params;
    const collectionId = resolvedParams.id;
    const newRequest = await Request.create({
      ...body,
      collectionId: collectionId,
      userId: session.user.id,
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    console.error("Error creating request:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

export const GET = securityMiddleware(rateLimitMiddleware(dbMiddleware(getHandler)));
export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(postHandler)));