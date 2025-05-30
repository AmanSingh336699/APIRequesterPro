import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Request from "@/models/Request";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { securityMiddleware } from "@/lib/securityMiddleware";

// Define the Params interface for the dynamic route
interface Params {
  params: { id: string };
}

// Base GET handler
async function getHandler(req: NextRequest, context: Params) {
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

// Base POST handler (optional, included for completeness)
async function postHandler(req: NextRequest, context: Params) {
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

// Middleware composition function
function composeMiddlewares<T extends { params: Record<string, string | string[]> }>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>,
  ...middlewares: Array<
    (
      handler: (req: NextRequest, context: T) => Promise<NextResponse>
    ) => (req: NextRequest, context: T) => Promise<NextResponse>
  >
): (req: NextRequest, context: T) => Promise<NextResponse> {
  return middlewares.reduce(
    (acc, middleware) => middleware(acc),
    handler
  );
}

// Compose the handlers with explicit Params type
const composedGetHandler = composeMiddlewares<Params>(
  getHandler,
  dbMiddleware,
  rateLimitMiddleware,
  securityMiddleware
);

const composedPostHandler = composeMiddlewares<Params>(
  postHandler,
  dbMiddleware,
  rateLimitMiddleware,
  securityMiddleware
);

// Export the route handlers
export const GET = composedGetHandler;
export const POST = composedPostHandler;