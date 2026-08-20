"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { authUsers } from "@/db/schema";
import { createSession } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db
    .select({ id: authUsers.id, encryptedPassword: authUsers.encryptedPassword })
    .from(authUsers)
    .where(eq(authUsers.email, email))
    .limit(1);

  if (!user || !(await compare(password, user.encryptedPassword))) {
    redirect(`/login?erro=${encodeURIComponent("E-mail ou senha inválidos.")}`);
  }

  await createSession({ id: user.id });
  redirect("/");
}
