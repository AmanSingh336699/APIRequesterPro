import { NextRequest, NextResponse } from "next/server";
import Collection from "@/models/Collection";
import { z } from "zod";
import { sanitizeObject } from "@/lib/sanitize";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

const createCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").trim(),
});

async function handler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if(!session){
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (req.method === "GET") {
    await connectToDatabase()
    try {
      const collections = await Collection.find({ userId: session?.user.id }).populate("requests", "name method").exec()
      console.log("col", collections)
      return NextResponse.json(collections);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
    }
  }

  if (req.method === "POST") {
    await connectToDatabase()
    try {
      const body = await req.json();
      const sanitizedBody = sanitizeObject(body);
      const { name } = createCollectionSchema.parse(sanitizedBody);
      const collection = new Collection({ name, userId: session.user.id });
      await collection.save();
      const plainCollection = collection.toObject()
      return NextResponse.json(plainCollection, { status: 201 });
    } catch (error: any) {
      console.error("Error creating collection:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
      }
      return NextResponse.json(
        { error: error.message || "Failed to create collection" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export const GET = handler;
export const POST = handler;