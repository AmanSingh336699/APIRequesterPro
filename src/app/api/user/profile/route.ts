import User from "@/models/User";
import {z} from "zod"
import bcrypt from "bcrypt"
import { connectToDatabase } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const updateProfileSchema = z.object({
    name: z.string().min(3, "Name must be at least 2 characters").optional(),
    password: z.string().min(6, "Password must be atleast 6 characters").optional()
})

export async function GET(){
    const session = await getServerSession(authOptions)
    if(!session){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        await connectToDatabase()
        const user = await User.findById(session.user.id).select("-password").lean()
        if(!user){
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        return NextResponse.json(user)
    } catch {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest){
    const session = await getServerSession(authOptions)
    if(!session){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    try {
        await connectToDatabase()
        const body = await req.json()
        const { name, password } = updateProfileSchema.parse(body)
        const updateData: any = {};
        if(name) updateData.name = name;
        if(password) updateData.password = await bcrypt.hash(password, 12);
        await User.updateOne({_id: session.user.id}, updateData)
        return NextResponse.json({ message: "Profile updated successfully" })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 400 })
    }
}