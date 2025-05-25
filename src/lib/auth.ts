import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "./db";
import User from "../models/User";
import bcrypt from "bcrypt";
import { loginSchema } from "../validators/auth.schema";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);
          await connectToDatabase();
          const user = await User.findOne({ email }).select('+password').lean() as { _id: any; email: string; name: string; password: string } | null;
          if (!user || !(await bcrypt.compare(password, user.password))) return null;
          return { id: user._id.toString(), email: user.email, name: user.name };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
