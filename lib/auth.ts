import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const adminUser = process.env.ADMIN_USER;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUser || !adminPassword) {
          console.error("ADMIN_USER o ADMIN_PASSWORD no configurados");
          return null;
        }

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPassword
        ) {
          return { id: "1", name: adminUser, email: `${adminUser}@byehenry.com` };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirigir al dashboard luego del login
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return `${baseUrl}/eerr`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
