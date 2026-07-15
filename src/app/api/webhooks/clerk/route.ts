// Clerk webhooks no longer used — auth is handled by NextAuth + credentials
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ message: "Clerk webhooks disabled" }, { status: 410 });
}
