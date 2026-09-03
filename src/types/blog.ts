export interface BlogPost {
  id: string;
  tenant_id: string;
  domain_id?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  author_name: string;
  author_avatar_url?: string | null;
  category: string;
  tags: string[];
  reading_time_minutes: number;
  published_at: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export const BLOG_CATEGORIES = [
  "All Stories",
  "City Guide",
  "Tech & Workspaces",
  "Tech & Startups",
  "Food & Culture",
  "Healthcare",
] as const;
