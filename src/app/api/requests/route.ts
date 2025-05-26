import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Request from "@/models/Request";
import { saveRequestSchema } from "@/validators/request.schema";
import { sanitizeObject } from "@/lib/sanitize";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { securityMiddleware } from "@/lib/securityMiddleware";
import Collection from "@/models/Collection";

async function handler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const sanitizedBody = sanitizeObject(body);
      const data = saveRequestSchema.parse(sanitizedBody);
      console.log("requestdata-collection", data)
      const request = new Request({ ...data, userId: session.user.id });
      const collection = Collection.findByIdAndUpdate(data.collectionId, { $addToSet: { requests: request._id } }, { new: true })
      if(!collection){
        return NextResponse.json({ error: "Collection not found" }, { status: 404 })
      }
      await request.save();
      return NextResponse.json(request, { status: 201 });
    } catch (error: any) {
      console.error("Error creating request:", error);
      return NextResponse.json({ error: error.message || "Failed to create request" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));