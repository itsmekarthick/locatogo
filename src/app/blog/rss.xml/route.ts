import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function xmlEscape(str: string) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();

  const { data: blogs } = await supabase
    .from("blogs")
    .select("id, title, slug, excerpt, content, category, author_name, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (blogs ?? [])
    .map((blog) => {
      const postUrl = `${baseUrl}/blog/${blog.slug}`;
      const pubDate = new Date(blog.published_at).toUTCString();
      const cleanExcerpt = xmlEscape(blog.excerpt || blog.title);
      const cleanTitle = xmlEscape(blog.title);
      const cleanCategory = xmlEscape(blog.category || "General");
      const cleanAuthor = xmlEscape(blog.author_name || "Locatogo Editorial");

      return `    <item>
      <title>${cleanTitle}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${cleanExcerpt}</description>
      <category>${cleanCategory}</category>
      <author>${cleanAuthor}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Locatogo Journal | City Guides &amp; Tech Insights</title>
    <link>${baseUrl}/blog</link>
    <description>Curated neighborhood guides, coworking spaces, specialty coffee, and tech corridors in Bengaluru and beyond.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
    },
  });
}
