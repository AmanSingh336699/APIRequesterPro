import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Request from "@/models/Request";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { securityMiddleware } from "@/lib/securityMiddleware";
import { composeMiddlewares } from "@/lib/composeMiddlewares";

async function getHandler(req: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collectionId = context.params.id;

    const requests = await Request.find({
      collectionId,
      userId: session.user.id,
    }).lean();

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

async function postHandler(req: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const collectionId = context.params.id;

    const newRequest = await Request.create({
      ...body,
      collectionId,
      userId: session.user.id,
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    const message =
      error instanceof Error ? error.message : "Failed to create request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  return composeMiddlewares(
    getHandler,
    dbMiddleware,
    rateLimitMiddleware,
    securityMiddleware
  )(req, context);
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  return composeMiddlewares(
    postHandler,
    dbMiddleware,
    rateLimitMiddleware,
    securityMiddleware
  )(req, context);
}
