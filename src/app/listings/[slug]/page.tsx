import { redirect } from "next/navigation";

export default async function ListingsSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/listing/${slug}`);
}

