import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { BlogPost } from "@/types/blog";
export { BLOG_CATEGORIES } from "@/types/blog";
import type { BlogPost } from "@/types/blog";

/**
 * Fetch all published blogs with optional category or keyword search
 */
export async function getPublishedBlogs({
  limit = 20,
  category,
  search,
}: {
  limit?: number;
  category?: string;
  search?: string;
} = {}): Promise<BlogPost[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category && category !== "All Stories") {
    query = query.eq("category", category);
  }

  if (search && search.trim().length > 0) {
    query = query.or(`title.ilike.%${search.trim()}%,excerpt.ilike.%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching published blogs:", error);
    return [];
  }
  return (data as BlogPost[]) ?? [];
}

/**
 * Fetch top featured blog for spotlight showcase
 */
export async function getFeaturedBlog(): Promise<BlogPost | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data as BlogPost;

  // Fallback to latest published blog if no explicit featured
  const { data: latest } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (latest as BlogPost) ?? null;
}

/**
 * Fetch a single blog post by its URL slug
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPost;
}

/**
 * Fetch related blogs for recommendation footer
 */
export async function getRelatedBlogs(
  currentSlug: string,
  category: string,
  limit: number = 3
): Promise<BlogPost[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .neq("slug", currentSlug)
    .eq("category", category)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (data && data.length > 0) return data as BlogPost[];

  // Fallback to any other published blogs
  const { data: fallback } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .neq("slug", currentSlug)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (fallback as BlogPost[]) ?? [];
}
