import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import connectMongo from "./mongodb";
import User from "./models/User";

// Password hashing utilities (keep these for registration)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Login schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authOptions: NextAuthOptions = {
  debug: true,
  // Giriş seçeneği olarak sadece email ve password kullanıyoruz
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // login function
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Validate input
          const validatedData = loginSchema.parse({
            email: String(credentials.email).toLowerCase(),
            password: String(credentials.password),
          });

          await connectMongo();

          // Find user
          const user = await User.findOne({ email: validatedData.email });
          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await verifyPassword(
            validatedData.password,
            user.password
          );
          if (!isPasswordValid) {
            return null;
          }

          // Return user object
          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
            isEmailVerified: user.isEmailVerified,
          } as any;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  // kullanıcı oturumunu jwt üzerinden yöneticeğimiz söylüyoruz
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // callback fonksiyonlarını konfigüre ediyoruz
  callbacks: {
    // jwt tokeni oluşuturulurken çalışır
    // token içinde saklanıcak verileri belirtiyoruz
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.isAdmin = (user as any).isAdmin;
        token.isEmailVerified = (user as any).isEmailVerified;
      }
      return token;
    },
    // useSesion / getSession ile kullanıcının oturum bilgilerini alırken çalışır
    // session içinde saklanıcak verileri belirtiyoruz
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
        (session.user as any).isEmailVerified = token.isEmailVerified as boolean;
      }
      return session;
    },
  },

  // sayfa yönlendirmelerini belirtiyoruz
  pages: {
    signIn: "/auth/login", // kaydolunca yönlendirilecek sayfa
    error: "/auth/error", // hata oluştuğunda yönlendirilecek sayfa
  },

  // secret keyi belirtiyoruz
  secret: process.env.NEXTAUTH_SECRET || "dev-secret",
};

// Export registration function
export async function registerUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  await connectMongo();

  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const user = new User({
    email: userData.email.toLowerCase(),
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
  });

  await user.save();

  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin,
    isEmailVerified: user.isEmailVerified,
  };
}
