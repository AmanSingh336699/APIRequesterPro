import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Request from "@/models/Request";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { securityMiddleware } from "@/lib/securityMiddleware";

type HandlerContext = {
  params: { id: string };
};

async function getHandler(req: NextRequest, context: HandlerContext) {
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

async function postHandler(req: NextRequest, context: HandlerContext) {
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


export function composeMiddlewares<T>(
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


const composedGetHandler = composeMiddlewares(
  getHandler,
  dbMiddleware,
  rateLimitMiddleware,
  securityMiddleware
);

const composedPostHandler = composeMiddlewares(
  postHandler,
  dbMiddleware,
  rateLimitMiddleware,
  securityMiddleware
);

export async function GET(req: NextRequest, context: HandlerContext) {
  return composedGetHandler(req, context);
}

export async function POST(req: NextRequest, context: HandlerContext) {
  return composedPostHandler(req, context);
}
