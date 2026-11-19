import { NextResponse } from "next/server";

// Replace this integration point with your EXISTING verified
// admin session function. It must validate the session on the server.
export async function requireProductManager() {
  // TODO: Call your existing session verifier here.
  // Return the verified admin/editor user when authorized.
  // Return null when the session is missing or invalid.

  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "You must sign in to manage products." },
    { status: 401 },
  );
}
