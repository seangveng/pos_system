import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully!",
      database: "pos_database",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed. Check your server terminal.",
      },
      { status: 500 },
    );
  }
}
