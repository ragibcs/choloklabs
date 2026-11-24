import { NextResponse } from "next/server";
import { getPublishedBlogPosts } from "@/lib/blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getPublishedBlogPosts(50);
  return NextResponse.json({ posts });
}
