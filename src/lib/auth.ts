import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "AccessID",
      credentials: {
        accessId: { label: "Access ID", type: "text" },
        password: { label: "Password", type: "password" },
        email: { label: "Email (Admin only)", type: "email" },
      },
      async authorize(credentials) {
        const accessId = credentials?.accessId as string;
        const password = credentials?.password as string;
        const email = credentials?.email as string | undefined;

        if (!accessId || !password) return null;

        const user = await prisma.user.findUnique({
          where: { accessId },
          include: {
            school: true,
            teacherProfile: true,
            studentProfile: true,
          },
        });

        if (!user || !user.isActive) return null;

        // Admin requires email verification
        if (user.role === "ADMIN") {
          if (!email || user.email !== email) return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        const mustChangePassword = await bcrypt.compare(accessId, user.passwordHash);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          accessId: user.accessId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          schoolCode: user.school.code,
          avatar: user.avatar,
          teacherId: user.teacherProfile?.id,
          studentId: user.studentProfile?.id,
          classId: user.studentProfile?.classId,
          mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const sessionUser = user as unknown as SessionUser;
        token.id = sessionUser.id;
        token.accessId = sessionUser.accessId;
        token.firstName = sessionUser.firstName;
        token.lastName = sessionUser.lastName;
        token.role = sessionUser.role;
        token.schoolId = sessionUser.schoolId;
        token.schoolCode = sessionUser.schoolCode;
        token.avatar = sessionUser.avatar;
        token.teacherId = sessionUser.teacherId;
        token.studentId = sessionUser.studentId;
        token.classId = sessionUser.classId;
        token.mustChangePassword = sessionUser.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as SessionUser).id = token.id as string;
        (session.user as unknown as SessionUser).accessId = token.accessId as string;
        (session.user as unknown as SessionUser).firstName = token.firstName as string;
        (session.user as unknown as SessionUser).lastName = token.lastName as string;
        (session.user as unknown as SessionUser).role = token.role as SessionUser["role"];
        (session.user as unknown as SessionUser).schoolId = token.schoolId as string;
        (session.user as unknown as SessionUser).schoolCode = token.schoolCode as SessionUser["schoolCode"];
        (session.user as unknown as SessionUser).avatar = token.avatar as string;
        (session.user as unknown as SessionUser).teacherId = token.teacherId as string;
        (session.user as unknown as SessionUser).studentId = token.studentId as string;
        (session.user as unknown as SessionUser).classId = token.classId as string;
        (session.user as unknown as SessionUser).mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      const isOnChangePassword = request.nextUrl.pathname.startsWith("/change-password");
      const mustChangePassword = Boolean(
        (session?.user as SessionUser | undefined)?.mustChangePassword
      );

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(
            new URL(mustChangePassword ? "/change-password" : "/", request.nextUrl)
          );
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (mustChangePassword && !isOnChangePassword) {
        return Response.redirect(new URL("/change-password", request.nextUrl));
      }

      if (isOnChangePassword && !mustChangePassword) {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      return isLoggedIn;
    },
  },
});
