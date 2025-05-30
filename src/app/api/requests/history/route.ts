import { NextRequest, NextResponse } from "next/server";
import History from "@/models/History";
import { z } from "zod";
import { sanitizeObject } from "@/lib/sanitize";
import { securityMiddleware } from "@/lib/securityMiddleware";
import { rateLimitMiddleware } from "@/lib/rateLimitMiddleware";
import { dbMiddleware } from "@/lib/dbMiddleware";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import { MAX_HISTORY_ITEMS } from "@/lib/constants";


const requestHistorySchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  status: z.number(),
  response: z.any(),
  duration: z.number(),
});

async function handler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (req.method === "GET") {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const skip = (page - 1) * limit;

      const [results, totalCount] = await Promise.all([
        History.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              method: 1,
              url: 1,
              status: 1,
              response: 1,
              duration: 1,
              createdAt: 1,
            },
          },
        ]),
        History.countDocuments({ userId: new mongoose.Types.ObjectId(session.user.id) }),
      ]);
      return NextResponse.json({
        data: results,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch {
      return NextResponse.json({ error: "Failed to fetch request history" }, { status: 500 });
    }
  }


  if (req.method === "POST") {
    try {
      const body = await req.json();
      const sanitizedBody = sanitizeObject(body);
      const data = requestHistorySchema.parse(sanitizedBody);
      const count = await History.countDocuments({ userId: session.user.id });

      if (count >= MAX_HISTORY_ITEMS) {
        return NextResponse.json({ message: "Max history limit reached, new item not stored" }, { status: 200 });
      }
      const requestHistory = new History({
        userId: session.user.id,
        ...data,
        createdAt: new Date(),
      });
      await requestHistory.save();
      return NextResponse.json(requestHistory, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to save request history" }, { status: 400 });
    }
  }
  if (req.method === "DELETE") {
    try {
      const url = new URL(req.url);
      const deleteAll = url.searchParams.get("all") === "true";

      if (deleteAll) {
        const result = await History.deleteMany({ userId: session.user.id });
        return NextResponse.json({ message: `Deleted ${result.deletedCount} history items` });
      } else {
        const { id } = await req.json();
        if (!id) {
          return NextResponse.json({ error: "Missing id for deletion" }, { status: 400 });
        }
        const deleted = await History.findOneAndDelete({ _id: id, userId: session.user.id });
        if (!deleted) {
          return NextResponse.json({ error: "History item not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "History item deleted successfully" });
      }
    } catch (error) {
      return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
    }
  }


  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const GET = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));
export const POST = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));
export const DELETE = securityMiddleware(rateLimitMiddleware(dbMiddleware(handler)));