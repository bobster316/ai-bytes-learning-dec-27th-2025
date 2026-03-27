import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasRunwayKey: !!process.env.RUNWAYML_API_SECRET,
    keyPreview: process.env.RUNWAYML_API_SECRET
      ? `${process.env.RUNWAYML_API_SECRET.slice(0, 6)}...`
      : null,
  });
}
