import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { metadataBase } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = metadataBase.toString().replace(/\/$/, "");

  const staticRoutes = [
    "",
    "/courses",
    "/pricing",
    "/mastery",
    "/paths",
    "/about",
    "/blog",
    "/contact",
    "/news",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const supabase = await createClient(true);
    const { data: courses } = await supabase
      .from("courses")
      .select("id, updated_at, published")
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(1000);

    const courseEntries: MetadataRoute.Sitemap = (courses || []).map((c: any) => ({
      url: `${baseUrl}/courses/${c.id}`,
      lastModified: c.updated_at || new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    return [...staticEntries, ...courseEntries];
  } catch {
    return staticEntries;
  }
}
