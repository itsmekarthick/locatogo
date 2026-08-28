"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { parseImportCsv } from "@/lib/import/csv";
import { categoryInputSchema, customFieldInputSchema, domainInputSchema, listingInputSchema, socialLinkInputSchema } from "@/lib/validation/directory";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function id(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!/^[0-9a-f-]{36}$/i.test(value)) throw new Error("Invalid resource.");
  return value;
}

export async function createDomain(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const parsed = domainInputSchema.safeParse({ name: text(formData, "name"), slug: text(formData, "slug"), description: text(formData, "description") });
  if (!parsed.success) throw new Error("Invalid directory details.");
  const { data: domain, error } = await supabase.from("domains").insert({ tenant_id: tenant.id, name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description || null }).select("id").single();
  if (error || !domain) throw new Error("The directory could not be created.");
  const { error: settingsError } = await supabase.from("directory_settings").insert({ domain_id: domain.id });
  if (settingsError) throw new Error("Directory settings could not be initialized.");
  revalidatePath("/admin/domains");
  redirect("/admin/domains");
}

export async function updateDomain(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const domainId = id(formData, "domainId");
  const parsed = domainInputSchema.safeParse({ name: text(formData, "name"), slug: text(formData, "slug"), description: text(formData, "description") });
  if (!parsed.success) throw new Error("Invalid directory details.");
  const { error } = await supabase.from("domains").update({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description || null }).eq("id", domainId).eq("tenant_id", tenant.id);
  if (error) throw new Error("The directory could not be updated.");
  revalidatePath("/admin/domains");
  redirect("/admin/domains");
}

export async function archiveDomain(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const domainId = id(formData, "domainId");
  const { error } = await supabase.from("domains").update({ status: "archived" }).eq("id", domainId).eq("tenant_id", tenant.id);
  if (error) throw new Error("The directory could not be archived.");
  revalidatePath("/admin/domains");
}

async function getDefaultDomainId(
  supabase: Awaited<ReturnType<typeof requireTenantContext>>["supabase"],
  tenantId: string,
  explicitDomainId?: string
): Promise<string> {
  if (explicitDomainId && /^[0-9a-f-]{36}$/i.test(explicitDomainId)) {
    return explicitDomainId;
  }
  const { data: domain } = await supabase
    .from("domains")
    .select("id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (domain?.id) return domain.id;

  const { data: newDomain } = await supabase
    .from("domains")
    .insert({ tenant_id: tenantId, name: "Default Atlas", slug: "default" })
    .select("id")
    .single();

  return newDomain?.id ?? "";
}

export async function createCategory(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const domainId = await getDefaultDomainId(supabase, tenant.id, text(formData, "domainId"));
  const parsed = categoryInputSchema.safeParse({ domainId, name: text(formData, "name"), slug: text(formData, "slug"), description: text(formData, "description") });
  if (!parsed.success) throw new Error("Invalid category details.");
  const { error } = await supabase.from("categories").insert({ tenant_id: tenant.id, domain_id: domainId, name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description || null });
  if (error) throw new Error("The category could not be created.");
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const categoryId = id(formData, "categoryId");
  const domainId = await getDefaultDomainId(supabase, tenant.id, text(formData, "domainId"));
  const parsed = categoryInputSchema.safeParse({ domainId, name: text(formData, "name"), slug: text(formData, "slug"), description: text(formData, "description") });
  if (!parsed.success) throw new Error("Invalid category details.");
  const { error } = await supabase.from("categories").update({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description || null }).eq("id", categoryId).eq("tenant_id", tenant.id);
  if (error) throw new Error("The category could not be updated.");
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function archiveCategory(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const categoryId = id(formData, "categoryId");
  const { error } = await supabase.from("categories").update({ is_active: false }).eq("id", categoryId).eq("tenant_id", tenant.id);
  if (error) throw new Error("The category could not be archived.");
  revalidatePath("/admin/categories");
}

export async function createListing(formData: FormData): Promise<void> {
  const { supabase, tenant, user } = await requireTenantContext();
  const latVal = text(formData, "latitude");
  const lngVal = text(formData, "longitude");
  const domainId = await getDefaultDomainId(supabase, tenant.id, text(formData, "domainId"));

  const parsed = listingInputSchema.safeParse({
    domainId,
    categoryId: text(formData, "categoryId"),
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    shortDescription: text(formData, "shortDescription"),
    description: text(formData, "description"),
    addressLine1: text(formData, "addressLine1"),
    locality: text(formData, "locality"),
    city: text(formData, "city"),
    administrativeArea: text(formData, "administrativeArea"),
    countryCode: text(formData, "countryCode") || undefined,
    postalCode: text(formData, "postalCode"),
    latitude: latVal ? Number(latVal) : undefined,
    longitude: lngVal ? Number(lngVal) : undefined,
    website: text(formData, "website"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    status: (text(formData, "status") as "draft" | "published") || "published",
    isFeatured: formData.get("isFeatured") === "on",
  });

  if (!parsed.success) {
    console.error("Listing validation error:", parsed.error);
    throw new Error("Invalid listing details.");
  }

  const { error } = await supabase.from("listings").insert({
    tenant_id: tenant.id,
    domain_id: domainId,
    category_id: parsed.data.categoryId,
    owner_user_id: user.id,
    title: parsed.data.title,
    slug: parsed.data.slug,
    short_description: parsed.data.shortDescription || null,
    description: parsed.data.description || null,
    address_line_1: parsed.data.addressLine1,
    locality: parsed.data.locality || null,
    city: parsed.data.city || null,
    administrative_area: parsed.data.administrativeArea || null,
    country_code: parsed.data.countryCode || null,
    postal_code: parsed.data.postalCode || null,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
    website: parsed.data.website || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    status: parsed.data.status || "published",
    verification_status: "verified",
    is_featured: parsed.data.isFeatured || false,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    throw new Error("The listing could not be created.");
  }

  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}

export async function archiveListing(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const listingId = id(formData, "listingId");
  const { error } = await supabase.from("listings").update({ status: "archived" }).eq("id", listingId).eq("tenant_id", tenant.id);
  if (error) throw new Error("The listing could not be archived.");
  revalidatePath("/admin/listings");
}

export async function updateListing(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const listingId = id(formData, "listingId");
  const latVal = text(formData, "latitude");
  const lngVal = text(formData, "longitude");
  const domainId = await getDefaultDomainId(supabase, tenant.id, text(formData, "domainId"));

  const parsed = listingInputSchema.safeParse({
    domainId,
    categoryId: text(formData, "categoryId"),
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    shortDescription: text(formData, "shortDescription"),
    description: text(formData, "description"),
    addressLine1: text(formData, "addressLine1"),
    locality: text(formData, "locality"),
    city: text(formData, "city"),
    administrativeArea: text(formData, "administrativeArea"),
    countryCode: text(formData, "countryCode") || undefined,
    postalCode: text(formData, "postalCode"),
    latitude: latVal ? Number(latVal) : undefined,
    longitude: lngVal ? Number(lngVal) : undefined,
    website: text(formData, "website"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    status: (text(formData, "status") as "draft" | "published" | "pending_review") || undefined,
    verificationStatus: (text(formData, "verificationStatus") as "unverified" | "pending" | "verified" | "rejected") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
  });

  if (!parsed.success) {
    console.error("Listing update validation error:", parsed.error);
    throw new Error("Invalid listing details.");
  }

  const { error } = await supabase
    .from("listings")
    .update({
      domain_id: domainId,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      slug: parsed.data.slug,
      short_description: parsed.data.shortDescription || null,
      description: parsed.data.description || null,
      address_line_1: parsed.data.addressLine1,
      locality: parsed.data.locality || null,
      city: parsed.data.city || null,
      administrative_area: parsed.data.administrativeArea || null,
      country_code: parsed.data.countryCode || null,
      postal_code: parsed.data.postalCode || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      website: parsed.data.website || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      status: parsed.data.status || undefined,
      verification_status: parsed.data.verificationStatus || undefined,
      is_featured: parsed.data.isFeatured ?? false,
    })
    .eq("id", listingId)
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("Supabase update error:", error);
    throw new Error("The listing could not be updated.");
  }

  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}

export async function publishListing(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const listingId = id(formData, "listingId");
  const { error } = await supabase.from("listings").update({ status: "published", published_at: new Date().toISOString() }).eq("id", listingId).eq("tenant_id", tenant.id).in("status", ["draft", "approved"]);
  if (error) throw new Error("The listing could not be published.");
  revalidatePath("/admin/listings");
}

export async function createCustomField(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const parsed = customFieldInputSchema.safeParse({ domainId: text(formData, "domainId"), name: text(formData, "name"), key: text(formData, "key"), fieldType: text(formData, "fieldType"), isRequired: formData.get("isRequired") === "on", isPublic: formData.get("isPublic") !== "off", isFilterable: formData.get("isFilterable") === "on" });
  if (!parsed.success) throw new Error("Invalid custom field details.");
  const { error } = await supabase.from("custom_fields").insert({ tenant_id: tenant.id, domain_id: parsed.data.domainId, name: parsed.data.name, key: parsed.data.key, field_type: parsed.data.fieldType, is_required: parsed.data.isRequired, is_public: parsed.data.isPublic, is_filterable: parsed.data.isFilterable });
  if (error) throw new Error("The custom field could not be created.");
  revalidatePath("/admin/custom-fields");
  redirect("/admin/custom-fields");
}

export async function saveSocialLink(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const parsed = socialLinkInputSchema.safeParse({ listingId: text(formData, "listingId"), platform: text(formData, "platform"), url: text(formData, "url") });
  if (!parsed.success) throw new Error("Invalid social link.");
  const { error } = await supabase.from("listing_social_links").upsert({ tenant_id: tenant.id, listing_id: parsed.data.listingId, platform: parsed.data.platform, url: parsed.data.url }, { onConflict: "listing_id,platform" });
  if (error) throw new Error("The social link could not be saved.");
  revalidatePath("/admin/listings");
}

export async function saveHours(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const listingId = id(formData, "listingId");
  const day = Number(text(formData, "dayOfWeek"));
  if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error("Invalid day.");
  const isClosed = formData.get("isClosed") === "on";
  const is24Hours = formData.get("is24Hours") === "on";
  const { error } = await supabase.from("listing_hours").upsert({ tenant_id: tenant.id, listing_id: listingId, day_of_week: day, is_closed: isClosed, is_24_hours: is24Hours, open_time: isClosed || is24Hours ? null : text(formData, "openTime"), close_time: isClosed || is24Hours ? null : text(formData, "closeTime") }, { onConflict: "listing_id,day_of_week" });
  if (error) throw new Error("Opening hours could not be saved.");
  revalidatePath("/admin/listings");
}

export async function findDuplicateListings(title: string, phone?: string) {
  const { supabase, tenant } = await requireTenantContext();
  const query = supabase.from("listings").select("id, title, phone, city, status").eq("tenant_id", tenant.id).ilike("title", `%${title.trim()}%`).limit(10);
  const { data, error } = await query;
  if (error) throw new Error("Duplicate detection failed.");
  return (data ?? []).filter((listing) => !phone || listing.phone === phone);
}

export async function uploadListingMedia(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const listingId = id(formData, "listingId");
  const fileValue = formData.get("file");
  const mediaType = text(formData, "mediaType");
  const allowedTypes = ["logo", "cover", "gallery", "document", "video_thumbnail"];
  const allowedMime = /^(image\/(jpeg|png|webp|gif)|application\/pdf|video\/mp4)$/;
  if (!(fileValue instanceof File) || fileValue.size < 1 || fileValue.size > 10 * 1024 * 1024 || !allowedTypes.includes(mediaType) || !allowedMime.test(fileValue.type)) throw new Error("Invalid media file.");
  const safeExtension = fileValue.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const storagePath = `${tenant.id}/${listingId}/${crypto.randomUUID()}.${safeExtension}`;
  const { error: uploadError } = await supabase.storage.from("listing-media").upload(storagePath, fileValue, { contentType: fileValue.type, upsert: false });
  if (uploadError) throw new Error("The media file could not be uploaded.");
  const { error: metadataError } = await supabase.from("listing_media").insert({ tenant_id: tenant.id, listing_id: listingId, media_type: mediaType, storage_path: storagePath, mime_type: fileValue.type || "application/octet-stream", file_size: fileValue.size, alt_text: text(formData, "altText") || null });
  if (metadataError) {
    await supabase.storage.from("listing-media").remove([storagePath]);
    throw new Error("The media record could not be saved.");
  }
  revalidatePath("/admin/listings");
}

async function writeAudit(supabase: Awaited<ReturnType<typeof requireTenantContext>>["supabase"], tenantId: string, userId: string, action: string, entityType: string, entityId: string, metadata: Record<string, string>) {
  await supabase.from("listing_audit_logs").insert({ tenant_id: tenantId, actor_user_id: userId, action, entity_type: entityType, entity_id: entityId, metadata });
}

export async function reviewSubmission(formData: FormData): Promise<void> {
  const { supabase, tenant, user } = await requireTenantContext();
  const submissionId = id(formData, "submissionId");
  const status = text(formData, "status");
  if (!(["approved", "rejected", "changes_requested"] as const).includes(status as "approved" | "rejected" | "changes_requested")) throw new Error("Invalid moderation status.");
  const { error } = await supabase.from("listing_submissions").update({ status, review_note: text(formData, "reviewNote") || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", submissionId).eq("tenant_id", tenant.id);
  if (error) throw new Error("Submission review could not be saved.");
  await writeAudit(supabase, tenant.id, user.id, `submission.${status}`, "listing_submission", submissionId, {});
  revalidatePath("/admin/moderation");
}

export async function reviewClaim(formData: FormData): Promise<void> {
  const { supabase, tenant, user } = await requireTenantContext();
  const claimId = id(formData, "claimId");
  const status = text(formData, "status");
  if (status !== "approved" && status !== "rejected") throw new Error("Invalid claim status.");
  const { data: claim, error } = await supabase.from("listing_claims").update({ status, review_note: text(formData, "reviewNote") || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", claimId).eq("tenant_id", tenant.id).select("listing_id, user_id").single();
  if (error || !claim) throw new Error("Claim review could not be saved.");
  if (status === "approved") await supabase.from("listings").update({ owner_user_id: claim.user_id }).eq("id", claim.listing_id).eq("tenant_id", tenant.id);
  await writeAudit(supabase, tenant.id, user.id, `claim.${status}`, "listing_claim", claimId, {});
  revalidatePath("/admin/claims");
}

export async function setListingVerification(formData: FormData): Promise<void> {
  const { supabase, tenant, user } = await requireTenantContext();
  const listingId = id(formData, "listingId");
  const status = text(formData, "verificationStatus");
  if (!["unverified", "pending", "verified", "rejected"].includes(status)) throw new Error("Invalid verification status.");
  const { error } = await supabase.from("listings").update({ verification_status: status }).eq("id", listingId).eq("tenant_id", tenant.id);
  if (error) throw new Error("Verification could not be updated.");
  await writeAudit(supabase, tenant.id, user.id, "listing.verification_changed", "listing", listingId, { status });
  revalidatePath("/admin/listings");
}

export async function processCsvImport(formData: FormData): Promise<void> {
  const { supabase, tenant, user } = await requireTenantContext();
  const domainId = id(formData, "domainId");
  const fileValue = formData.get("file");
  if (!(fileValue instanceof File) || fileValue.size < 1 || fileValue.size > 25 * 1024 * 1024 || fileValue.type !== "text/csv") throw new Error("Upload a CSV file smaller than 25 MB.");
  const rows = parseImportCsv(await fileValue.text());
  if (!rows.length || rows.length > 10000) throw new Error("CSV must contain between 1 and 10,000 rows.");
  const [{ data: categories }, { data: existing }] = await Promise.all([supabase.from("categories").select("id, name").eq("tenant_id", tenant.id).eq("domain_id", domainId), supabase.from("listings").select("title, phone").eq("tenant_id", tenant.id).eq("domain_id", domainId)]);
  const categoryMap = new Map((categories ?? []).map((category) => [category.name.toLowerCase(), category.id]));
  const existingKeys = new Set((existing ?? []).map((listing) => `${listing.title.toLowerCase()}|${listing.phone ?? ""}`));
  const errors: Array<{ row: number; error: string }> = [];
  let success = 0;
  let duplicates = 0;
  for (const [index, row] of rows.entries()) {
    const title = row.Name?.trim();
    const categoryId = categoryMap.get((row.Category ?? "").trim().toLowerCase());
    const key = `${(title ?? "").toLowerCase()}|${row.Phone?.trim() ?? ""}`;
    if (!title || !row.Address || !categoryId) { errors.push({ row: index + 2, error: !title ? "Name is required" : !row.Address ? "Address is required" : "Unknown category" }); continue; }
    if (existingKeys.has(key)) { duplicates += 1; continue; }
    const { error } = await supabase.from("listings").insert({ tenant_id: tenant.id, domain_id: domainId, category_id: categoryId, owner_user_id: user.id, title, slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${index + 1}`, address_line_1: row.Address, city: row.City || null, administrative_area: row.State || null, country_code: row.CountryCode || null, postal_code: row["Postal code"] || null, website: row.Website || null, phone: row.Phone || null, email: row.Email || null, description: row.Description || null });
    if (error) errors.push({ row: index + 2, error: "Could not import row" }); else { success += 1; existingKeys.add(key); }
  }
  const { data: job, error: jobError } = await supabase.from("import_jobs").insert({ tenant_id: tenant.id, domain_id: domainId, created_by: user.id, status: errors.length ? "completed_with_errors" : "completed", total_rows: rows.length, processed_rows: rows.length, success_count: success, failure_count: errors.length, duplicate_count: duplicates, errors_json: errors, completed_at: new Date().toISOString() }).select("id").single();
  if (jobError || !job) throw new Error("Import results could not be saved.");
  revalidatePath("/admin/listings");
  redirect(`/admin/import?job=${job.id}`);
}
