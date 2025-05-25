import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { registerSchema } from "@/validators/auth.schema";
import { RateLimiterMemory } from "rate-limiter-flexible";
import sanitizeHtml from "sanitize-html";

const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  try {
    await rateLimiter.consume(ip);
    const body = await req.json();
    const { name, email, password } = registerSchema.parse({
      name: sanitizeHtml(body.name),
      email: sanitizeHtml(body.email),
      password: body.password,
    });
    await connectToDatabase();
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser){
      console.log("already user")
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 400 });
  }
}