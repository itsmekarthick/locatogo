"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantContext } from "@/lib/auth/tenant-context";
import { parseImportCsv } from "@/lib/import/csv";
import { categoryInputSchema, customFieldInputSchema, domainInputSchema, listingInputSchema, socialLinkInputSchema } from "@/lib/validation/directory";
import { syncCompanyAtsJobs } from "@/lib/careers/ats-sync";
import { resolvePincodeCoordinates } from "@/lib/import/registry-transformer";

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
  const rawDomainId = text(formData, "domainId");
  const domainId = rawDomainId && rawDomainId !== "global" && rawDomainId !== "" ? rawDomainId : null;
  const parsed = categoryInputSchema.safeParse({
    domainId: domainId || undefined,
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
  });
  if (!parsed.success) throw new Error("Invalid category details.");
  const isActive = formData.get("isActive") === null ? true : formData.get("isActive") === "on" || formData.get("isActive") === "true";
  const { error } = await supabase.from("categories").insert({
    tenant_id: tenant.id,
    domain_id: domainId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    is_active: isActive,
  });
  if (error) throw new Error("The category could not be created.");
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/[domain]", "page");
  redirect("/admin/categories");
}

export async function updateCategory(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const categoryId = id(formData, "categoryId");
  const rawDomainId = text(formData, "domainId");
  const domainId = rawDomainId && rawDomainId !== "global" && rawDomainId !== "" ? rawDomainId : null;
  const parsed = categoryInputSchema.safeParse({
    domainId: domainId || undefined,
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
  });
  if (!parsed.success) throw new Error("Invalid category details.");
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";
  const { error } = await supabase.from("categories").update({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    domain_id: domainId,
    is_active: isActive,
  }).eq("id", categoryId).eq("tenant_id", tenant.id);
  if (error) throw new Error("The category could not be updated.");
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/[domain]", "page");
  redirect("/admin/categories");
}

export async function toggleCategoryStatus(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const categoryId = id(formData, "categoryId");
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId)
    .eq("tenant_id", tenant.id);
  if (error) throw new Error("Could not update category status.");
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/[domain]", "page");
}

export async function archiveCategory(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const categoryId = id(formData, "categoryId");
  const { error } = await supabase.from("categories").update({ is_active: false }).eq("id", categoryId).eq("tenant_id", tenant.id);
  if (error) throw new Error("The category could not be archived.");
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/[domain]", "page");
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

export async function findDuplicateListings(
  title: string,
  phone?: string | null,
  currentListingId?: string
) {
  const { supabase, tenant } = await requireTenantContext();
  let query = supabase
    .from("listings")
    .select("id, title, phone, city, locality, address_line_1, status, slug, short_description, website")
    .eq("tenant_id", tenant.id)
    .ilike("title", `%${title.trim()}%`)
    .limit(10);

  if (currentListingId) {
    query = query.neq("id", currentListingId);
  }

  const { data, error } = await query;
  if (error) throw new Error("Duplicate detection failed.");
  return (data ?? []).filter(
    (listing) =>
      listing.id !== currentListingId &&
      (!phone || listing.phone === phone || listing.title.toLowerCase().trim() === title.toLowerCase().trim())
  );
}

export async function bulkUpdateListingStatus(
  listingIds: string[],
  newStatus: "published" | "draft" | "archived"
): Promise<{ success: boolean; count: number }> {
  const { supabase, tenant, user } = await requireTenantContext();
  if (!listingIds || listingIds.length === 0) return { success: false, count: 0 };

  const { error } = await supabase
    .from("listings")
    .update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : undefined,
    })
    .in("id", listingIds)
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("Bulk status update failed:", error);
    throw new Error("Bulk status update failed: " + error.message);
  }

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: `bulk_status_${newStatus}`,
    entity_type: "listing",
    metadata: { listing_ids: listingIds, new_status: newStatus },
  });

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true, count: listingIds.length };
}

export async function bulkToggleFeatured(
  listingIds: string[],
  isFeatured: boolean
): Promise<{ success: boolean; count: number }> {
  const { supabase, tenant, user } = await requireTenantContext();
  if (!listingIds || listingIds.length === 0) return { success: false, count: 0 };

  const { error } = await supabase
    .from("listings")
    .update({ is_featured: isFeatured })
    .in("id", listingIds)
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("Bulk feature update failed:", error);
    throw new Error("Bulk feature update failed: " + error.message);
  }

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: isFeatured ? "bulk_feature_enabled" : "bulk_feature_disabled",
    entity_type: "listing",
    metadata: { listing_ids: listingIds, is_featured: isFeatured },
  });

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true, count: listingIds.length };
}

export async function mergeListings({
  primaryId,
  duplicateId,
  resolvedFields,
}: {
  primaryId: string;
  duplicateId: string;
  resolvedFields: {
    title?: string;
    phone?: string;
    website?: string;
    short_description?: string;
    address_line_1?: string;
  };
}): Promise<{ success: boolean }> {
  const { supabase, tenant, user } = await requireTenantContext();

  // 1. Update primary listing with preferred resolved fields
  const { error: updateError } = await supabase
    .from("listings")
    .update({
      ...resolvedFields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", primaryId)
    .eq("tenant_id", tenant.id);

  if (updateError) throw new Error("Could not update primary listing: " + updateError.message);

  // 2. Re-point reviews from duplicate to primary (skip if user already reviewed primary)
  const { data: existingPrimaryReviews } = await supabase
    .from("place_reviews")
    .select("user_id")
    .eq("listing_id", primaryId);
  const reviewedUserIds = new Set((existingPrimaryReviews || []).map((r) => r.user_id));

  const { data: duplicateReviews } = await supabase
    .from("place_reviews")
    .select("id, user_id")
    .eq("listing_id", duplicateId);

  for (const review of duplicateReviews || []) {
    if (!reviewedUserIds.has(review.user_id)) {
      await supabase.from("place_reviews").update({ listing_id: primaryId }).eq("id", review.id);
    }
  }

  // 3. Re-point media from duplicate to primary
  await supabase
    .from("listing_media")
    .update({ listing_id: primaryId })
    .eq("listing_id", duplicateId)
    .eq("tenant_id", tenant.id);

  // 4. Archive duplicate listing
  const { error: archiveError } = await supabase
    .from("listings")
    .update({
      status: "archived",
      is_featured: false,
    })
    .eq("id", duplicateId)
    .eq("tenant_id", tenant.id);

  if (archiveError) throw new Error("Could not archive duplicate listing: " + archiveError.message);

  // 5. Audit log entry
  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: "listing_merged",
    entity_type: "listing",
    entity_id: primaryId,
    metadata: {
      primary_id: primaryId,
      duplicate_id: duplicateId,
      resolved_fields: resolvedFields,
    },
  });

  revalidatePath(`/admin/listings/${primaryId}`);
  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
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
  
  // Read domainId from either domain_id or domainId
  const rawDomainId = text(formData, "domain_id") || text(formData, "domainId");
  if (!rawDomainId) throw new Error("Target Atlas domain is required.");
  const domainId = rawDomainId;

  // Read fallback category
  const fallbackCategoryId = text(formData, "category_id") || text(formData, "categoryId");

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File) || fileValue.size < 1 || fileValue.size > 25 * 1024 * 1024) {
    throw new Error("Upload a CSV file smaller than 25 MB.");
  }

  const rows = parseImportCsv(await fileValue.text());
  if (!rows.length || rows.length > 10000) throw new Error("CSV must contain between 1 and 10,000 rows.");

  const [{ data: categories }, { data: existing }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").eq("tenant_id", tenant.id).eq("domain_id", domainId),
    supabase.from("listings").select("title, slug").eq("tenant_id", tenant.id).eq("domain_id", domainId)
  ]);

  const categoryMap = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]));
  (categories ?? []).forEach((c) => categoryMap.set(c.slug.toLowerCase(), c.id));

  const existingKeys = new Set((existing ?? []).map((l) => l.title.toLowerCase()));
  const errors: Array<{ row: number; error: string }> = [];
  let success = 0;
  let duplicates = 0;
  const validRecords: any[] = [];

  for (const [index, row] of rows.entries()) {
    // 1. Flexible Title extraction
    const title = (
      row.title ||
      row.Title ||
      row.name ||
      row.Name ||
      row["Company Name"] ||
      row["company_name"] ||
      ""
    ).trim();

    if (!title) {
      errors.push({ row: index + 2, error: "Name is required" });
      continue;
    }

    // 2. Flexible Category extraction
    const rawCat = (row.category_name || row.Category || row.category || "").trim().toLowerCase();
    const resolvedCatId = (rawCat ? categoryMap.get(rawCat) : null) || fallbackCategoryId || (categories?.[0]?.id);

    if (!resolvedCatId) {
      errors.push({ row: index + 2, error: "Unknown category and no fallback category selected" });
      continue;
    }

    // 3. Flexible Address & Locality extraction
    const pin = (row.postal_code || row.postalCode || row["Postal code"] || row.Pincode || row.pincode || "").trim();
    const locality = (row.locality || row.Locality || row.area || row.Area || "").trim();
    const street = (
      row.address_line_1 ||
      row.Address ||
      row.address ||
      row["Street Address"] ||
      locality ||
      "Bengaluru"
    ).trim();

    // 4. Flexible Coordinates extraction (with centroid fallback if missing)
    let lat: number | null = parseFloat(row.latitude || row.lat || row.Latitude);
    let lon: number | null = parseFloat(row.longitude || row.lon || row.lng || row.Longitude);

    if (isNaN(lat) || isNaN(lon)) {
      const resolved = resolvePincodeCoordinates(pin);
      lat = resolved.lat;
      lon = resolved.lon;
    }

    const key = title.toLowerCase();
    if (existingKeys.has(key)) {
      duplicates += 1;
      continue;
    }
    existingKeys.add(key);

    const slug = (row.slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${index + 1}`).trim();

    // Parse tech stack array
    const rawTech = row.tech_stack || row.techStack || "";
    const techStack = typeof rawTech === "string" ? rawTech.split(";").map((t) => t.trim()).filter(Boolean) : [];

    const foundedYear = parseInt(row.founded_year || row.foundedYear || "", 10);

    validRecords.push({
      _rowNum: index + 2,
      tenant_id: tenant.id,
      domain_id: domainId,
      category_id: resolvedCatId,
      owner_user_id: user.id,
      title,
      slug,
      short_description: row.short_description || row.description || row.Description || null,
      address_line_1: street,
      locality: locality || null,
      city: row.city || row.City || "Bengaluru",
      administrative_area: row.state || row.State || "Karnataka",
      country_code: row.country || row.CountryCode || "IN",
      postal_code: pin || null,
      latitude: lat,
      longitude: lon,
      website: row.website || row.Website || null,
      careers_url: row.careers_url || row.careersUrl || null,
      company_type: row.company_type || row.companyType || null,
      funding_stage: row.funding_stage || row.fundingStage || null,
      employee_range: row.employee_range || row.employeeRange || null,
      tech_stack: techStack.length > 0 ? techStack : undefined,
      founded_year: !isNaN(foundedYear) ? foundedYear : null,
      phone: row.phone || row.Phone || null,
      email: row.email || row.Email || null,
      status: "published",
      verification_status: "verified",
      is_featured: true,
      published_at: new Date().toISOString(),
    });
  }

  // High-Speed Bulk Batch Ingestion (200 records per database query)
  const BATCH_SIZE = 200;
  for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
    const chunk = validRecords.slice(i, i + BATCH_SIZE);
    const dbPayload = chunk.map(({ _rowNum, ...r }) => r);

    const { error } = await supabase.from("listings").insert(dbPayload);

    if (error) {
      // If batch fails, fallback to individual row insert to capture specific errors
      for (const item of chunk) {
        const { _rowNum, ...singlePayload } = item;
        const { error: singleErr } = await supabase.from("listings").insert(singlePayload);
        if (singleErr) {
          if (singleErr.code === "23505" || singleErr.message?.includes("unique")) {
            duplicates += 1;
          } else {
            errors.push({ row: _rowNum, error: singleErr.message || "Insert failed" });
          }
        } else {
          success += 1;
        }
      }
    } else {
      success += dbPayload.length;
    }
  }

  const { data: job, error: jobError } = await supabase.from("import_jobs").insert({
    tenant_id: tenant.id,
    domain_id: domainId,
    created_by: user.id,
    status: errors.length ? "completed_with_errors" : "completed",
    total_rows: rows.length,
    processed_rows: rows.length,
    success_count: success,
    failure_count: errors.length,
    duplicate_count: duplicates,
    errors_json: errors,
    completed_at: new Date().toISOString()
  }).select("id").single();

  if (jobError || !job) throw new Error("Import results could not be saved.");
  revalidatePath("/admin/listings");
  revalidatePath("/");
  revalidatePath("/tech-atlas");
  redirect(`/admin/import?job=${job.id}`);
}

export async function updateTenantSettings(formData: FormData): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();
  const workspaceName = text(formData, "workspaceName").trim();

  if (!workspaceName || workspaceName.length < 2) {
    throw new Error("Workspace name must be at least 2 characters.");
  }

  const { error } = await supabase
    .from("tenants")
    .update({ name: workspaceName })
    .eq("id", tenant.id);

  if (error) throw new Error("Workspace settings could not be saved.");

  // Log the settings update
  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    action: "settings_updated",
    entity_type: "tenant",
    entity_id: tenant.id,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function inviteTeamMember(formData: FormData): Promise<void> {
  const { supabase, tenant, user, membership } = await requireTenantContext();
  if (membership.role !== "tenant_owner") {
    throw new Error("Only workspace owners can invite team members.");
  }

  const email = text(formData, "email").trim().toLowerCase();
  const role = text(formData, "role") || "tenant_staff";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid email address is required.");
  }

  const { error } = await supabase.from("team_invitations").insert({
    tenant_id: tenant.id,
    email,
    role,
    invited_by: user.id,
    status: "pending",
  });

  if (error) throw new Error("Could not create team invitation.");

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    action: "team_member_invited",
    entity_type: "team",
    entity_id: tenant.id,
  });

  revalidatePath("/admin/team");
}

export async function updateMemberRole(formData: FormData): Promise<void> {
  const { supabase, tenant, membership } = await requireTenantContext();
  if (membership.role !== "tenant_owner") {
    throw new Error("Only workspace owners can update team member roles.");
  }

  const memberId = id(formData, "memberId");
  const newRole = text(formData, "role");

  if (!["tenant_owner", "tenant_staff", "business_owner"].includes(newRole)) {
    throw new Error("Invalid role selected.");
  }

  const { error } = await supabase
    .from("tenant_users")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("tenant_id", tenant.id);

  if (error) throw new Error("Could not update member role.");

  revalidatePath("/admin/team");
}

export async function removeTeamMember(formData: FormData): Promise<void> {
  const { supabase, tenant, membership } = await requireTenantContext();
  if (membership.role !== "tenant_owner") {
    throw new Error("Only workspace owners can remove team members.");
  }

  const memberId = id(formData, "memberId");

  const { error } = await supabase
    .from("tenant_users")
    .delete()
    .eq("id", memberId)
    .eq("tenant_id", tenant.id);

  if (error) throw new Error("Could not remove member.");

  revalidatePath("/admin/team");
}

export async function revokeInvitation(formData: FormData): Promise<void> {
  const { supabase, tenant, membership } = await requireTenantContext();
  if (membership.role !== "tenant_owner") {
    throw new Error("Only workspace owners can revoke invitations.");
  }

  const invitationId = id(formData, "invitationId");

  const { error } = await supabase
    .from("team_invitations")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("tenant_id", tenant.id);

  if (error) throw new Error("Could not revoke invitation.");

  revalidatePath("/admin/team");
}

export type OnlinePlaceToInsert = {
  title: string;
  slug: string;
  latitude: number;
  longitude: number;
  addressLine1: string;
  locality?: string;
  city?: string;
  administrativeArea?: string;
  countryCode?: string;
  postalCode?: string;
  shortDescription?: string;
  website?: string;
  companyType?: string;
  fundingStage?: string;
  techStack?: string[];
  jobs?: {
    title: string;
    dept?: string;
    type: "on_site" | "hybrid" | "remote";
    salary?: string;
    apply: string;
  }[];
};

export async function bulkInsertOnlinePlaces(
  domainId: string,
  categoryId: string,
  places: OnlinePlaceToInsert[]
): Promise<{ success: number; duplicates: number; errors: number }> {
  const { supabase, tenant, user } = await requireTenantContext();

  if (!places.length) return { success: 0, duplicates: 0, errors: 0 };

  // 1. Fetch existing places in this domain to prevent any duplicate insertion
  const { data: existingListings } = await supabase
    .from("listings")
    .select("title, latitude, longitude, slug")
    .eq("tenant_id", tenant.id)
    .eq("domain_id", domainId);

  const existingTitleSet = new Set(
    (existingListings ?? []).map((l) => l.title.toLowerCase().trim())
  );
  const existingSlugSet = new Set(
    (existingListings ?? []).map((l) => l.slug.toLowerCase().trim())
  );

  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (const place of places) {
    const cleanTitle = place.title.trim();
    const titleKey = cleanTitle.toLowerCase();

    // Check by name
    if (existingTitleSet.has(titleKey)) {
      duplicateCount++;
      continue;
    }

    // Global coordinate validity check
    if (
      !place.latitude ||
      !place.longitude ||
      isNaN(place.latitude) ||
      isNaN(place.longitude) ||
      place.latitude < -90 ||
      place.latitude > 90 ||
      place.longitude < -180 ||
      place.longitude > 180
    ) {
      continue;
    }

    // Check by coordinate proximity (< 30 meters)
    const isCoordinateDuplicate = (existingListings ?? []).some(
      (ex) =>
        ex.latitude &&
        ex.longitude &&
        Math.abs(ex.latitude - place.latitude) < 0.0003 &&
        Math.abs(ex.longitude - place.longitude) < 0.0003
    );

    if (isCoordinateDuplicate) {
      duplicateCount++;
      continue;
    }

    // Generate unique slug
    let baseSlug = (place.slug || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/(^-|-$)/g, "");
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (existingSlugSet.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const { error } = await supabase.from("listings").insert({
      tenant_id: tenant.id,
      domain_id: domainId,
      category_id: categoryId,
      owner_user_id: user.id,
      title: cleanTitle,
      slug: uniqueSlug,
      short_description: place.shortDescription || `Verified landmark in ${place.locality || "Bengaluru"}.`,
      address_line_1: place.addressLine1,
      locality: place.locality || "Bengaluru",
      city: place.city || "Bengaluru",
      administrative_area: place.administrativeArea || "Karnataka",
      country_code: place.countryCode || "IN",
      postal_code: place.postalCode || null,
      latitude: place.latitude,
      longitude: place.longitude,
      status: "published",
      verification_status: "verified",
      is_featured: false,
      published_at: new Date().toISOString(),
      website: place.website || null,
      company_type: place.companyType || null,
      funding_stage: place.fundingStage || null,
      tech_stack: place.techStack || null,
    });

    if (error) {
      console.error("Failed to insert online place:", place.title, error);
      errorCount++;
    } else {
      // Find the inserted listing to get its ID for jobs
      const { data: insertedListing } = await supabase
        .from("listings")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("slug", uniqueSlug)
        .single();

      if (insertedListing && place.jobs && place.jobs.length > 0) {
        const jobsToInsert = place.jobs.map((j, index) => ({
          tenant_id: tenant.id,
          listing_id: insertedListing.id,
          title: j.title,
          department: j.dept || null,
          location_name: `${place.locality || place.city || "Bengaluru"}, India`,
          workplace_type: j.type,
          salary_range: j.salary || null,
          apply_url: j.apply,
          ats_job_id: `mock:${Date.now()}:${index}`,
          posted_at: new Date().toISOString(),
          is_active: true,
        }));
        const { error: jobError } = await supabase.from("company_jobs").insert(jobsToInsert);
        if (jobError) console.error("Failed to insert jobs for:", place.title, jobError);
      }

      successCount++;
      existingTitleSet.add(titleKey);
      existingSlugSet.add(uniqueSlug);
    }
  }

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    action: "online_places_imported",
    entity_type: "listing",
    entity_id: tenant.id,
  });

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: successCount, duplicates: duplicateCount, errors: errorCount };
}

export async function clearAllListings(): Promise<void> {
  const { supabase, tenant } = await requireTenantContext();

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("tenant_id", tenant.id);

  if (error) {
    console.error("Failed to delete listings:", error);
    throw new Error("Could not delete listings: " + error.message);
  }

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    action: "all_listings_cleared",
    entity_type: "listing",
    entity_id: tenant.id,
  });

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function syncCompanyCareers({
  listingId,
  provider,
  boardToken,
}: {
  listingId: string;
  provider: "greenhouse" | "lever" | "ashby" | "custom" | "workday" | "smartrecruiters";
  boardToken: string;
}): Promise<{ success: boolean; count: number; error?: string }> {
  const { supabase, tenant } = await requireTenantContext();

  const cleanToken = boardToken.trim().replace(/^https?:\/\/[^/]+\//, "").split("/")[0].split("?")[0];
  if (!cleanToken) {
    throw new Error("Invalid ATS Board handle or token");
  }

  // 1. Fetch live jobs via ATS API client
  const jobs = await syncCompanyAtsJobs(provider, cleanToken);
  if (!jobs || jobs.length === 0) {
    return { success: false, count: 0, error: `No active jobs found for ${provider} board: ${cleanToken}` };
  }

  // 2. Delete existing jobs for this listing
  await supabase
    .from("company_jobs")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("listing_id", listingId);

  // 3. Batch insert fresh jobs
  const jobsToInsert = jobs.map((j) => ({
    tenant_id: tenant.id,
    listing_id: listingId,
    title: j.title,
    department: j.department,
    location_name: j.locationName,
    workplace_type: j.workplaceType,
    apply_url: j.applyUrl,
    ats_job_id: j.atsJobId,
    is_active: true,
    posted_at: j.postedAt,
  }));

  const { error: insertError } = await supabase.from("company_jobs").insert(jobsToInsert);
  if (insertError) {
    console.error("Failed to insert synced jobs:", insertError);
    throw new Error("Failed to save synced jobs: " + insertError.message);
  }

  // 4. Update listing active_jobs_count, ats_provider, and careers_url
  let careersUrl = "";
  if (provider === "greenhouse") careersUrl = `https://boards.greenhouse.io/${cleanToken}`;
  else if (provider === "lever") careersUrl = `https://jobs.lever.co/${cleanToken}`;
  else if (provider === "ashby") careersUrl = `https://jobs.ashbyhq.com/${cleanToken}`;

  await supabase
    .from("listings")
    .update({
      active_jobs_count: jobs.length,
      careers_url: careersUrl || undefined,
    })
    .eq("id", listingId)
    .eq("tenant_id", tenant.id);

  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/");
  revalidatePath("/tech-atlas");
  revalidatePath("/admin/listings");

  return { success: true, count: jobs.length };
}

export async function createAdSlotAction(formData: FormData): Promise<{ success: boolean; id: string }> {
  const { supabase, tenant, user } = await requireTenantContext();

  const sponsorName = text(formData, "sponsor_name");
  const slotType = text(formData, "slot_type") as "flash_banner" | "header_banner" | "featured_pin" | "featured_listing";
  const placementLocation = text(formData, "placement_location") || "in_feed";
  const targetCategoryId = text(formData, "target_category_id") || null;
  const targetCity = text(formData, "target_city") || "all";
  const title = text(formData, "title");
  const description = text(formData, "description");
  const ctaText = text(formData, "cta_text") || "Learn More";
  const badgeText = text(formData, "badge_text") || "Sponsored";
  const targetUrl = text(formData, "target_url");
  const bannerUrl = text(formData, "banner_url");
  const startDate = text(formData, "start_date");
  const endDate = text(formData, "end_date");
  const pricePaid = parseFloat(text(formData, "price_paid") || "0") || 0;
  const status = (text(formData, "status") || "active") as "draft" | "active";
  const listingId = text(formData, "listing_id") || null;

  if (!sponsorName) throw new Error("Sponsor name is required.");
  if (!slotType) throw new Error("Slot placement type is required.");
  if (!startDate || !endDate) throw new Error("Start and end dates are required.");
  if (new Date(endDate) <= new Date(startDate)) throw new Error("End date must be after start date.");

  // Get primary domain for this tenant
  const { data: domains } = await supabase
    .from("domains")
    .select("id")
    .eq("tenant_id", tenant.id)
    .limit(1);

  const domainId = text(formData, "domain_id") || domains?.[0]?.id;
  if (!domainId) throw new Error("Tenant domain not found.");

  const { data: inserted, error } = await supabase
    .from("ad_slots")
    .insert({
      tenant_id: tenant.id,
      domain_id: domainId,
      listing_id: listingId,
      slot_type: slotType,
      placement_location: placementLocation,
      target_category_id: targetCategoryId,
      target_city: targetCity,
      sponsor_name: sponsorName,
      title: title || sponsorName,
      description: description || null,
      cta_text: ctaText,
      badge_text: badgeText,
      target_url: targetUrl || null,
      banner_url: bannerUrl || null,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      status: status,
      price_paid: pricePaid,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("Ad slot creation error:", error);
    throw new Error("Failed to create ad slot: " + (error?.message || "Unknown error"));
  }

  // Audit log
  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: "ad_slot_created",
    entity_type: "ad_slot",
    entity_id: inserted.id,
    metadata: {
      slot_type: slotType,
      sponsor_name: sponsorName,
      price_paid: pricePaid,
      start_date: startDate,
      end_date: endDate,
    },
  });

  revalidatePath("/admin/advertising");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tech-atlas");

  return { success: true, id: inserted.id };
}

export async function updateAdSlotStatusAction(
  slotId: string,
  newStatus: "draft" | "active" | "cancelled" | "expired"
): Promise<{ success: boolean }> {
  const { supabase, tenant, user } = await requireTenantContext();

  const { error } = await supabase
    .from("ad_slots")
    .update({ status: newStatus })
    .eq("id", slotId)
    .eq("tenant_id", tenant.id);

  if (error) throw new Error("Could not update ad slot status: " + error.message);

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: `ad_slot_status_${newStatus}`,
    entity_type: "ad_slot",
    entity_id: slotId,
  });

  revalidatePath("/admin/advertising");
  revalidatePath("/");
  revalidatePath("/tech-atlas");

  return { success: true };
}

export async function deleteAdSlotAction(slotId: string): Promise<{ success: boolean }> {
  const { supabase, tenant, user } = await requireTenantContext();

  const { error } = await supabase
    .from("ad_slots")
    .delete()
    .eq("id", slotId)
    .eq("tenant_id", tenant.id);

  if (error) throw new Error("Could not delete ad slot: " + error.message);

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: "ad_slot_deleted",
    entity_type: "ad_slot",
    entity_id: slotId,
  });

  revalidatePath("/admin/advertising");
  revalidatePath("/");
  revalidatePath("/tech-atlas");

  return { success: true };
}

export async function createBlogAction(formData: FormData): Promise<{ success: boolean; id: string; slug: string }> {
  const { supabase, tenant, user } = await requireTenantContext();

  const title = text(formData, "title");
  let slug = text(formData, "slug");
  const category = text(formData, "category") || "City Guide";
  const excerpt = text(formData, "excerpt") || null;
  const content = text(formData, "content");
  const coverImageUrl = text(formData, "cover_image_url") || null;
  const authorName = text(formData, "author_name") || "LocaToGo Editorial";
  const authorAvatarUrl = text(formData, "author_avatar_url") || null;
  const rawTags = text(formData, "tags");
  const readingTime = parseInt(text(formData, "reading_time_minutes") || "4", 10) || 4;
  const status = (text(formData, "status") || "published") as "draft" | "published" | "archived";
  const isFeatured = formData.get("is_featured") === "true" || formData.get("is_featured") === "on";

  if (!title) throw new Error("Article title is required.");
  if (!content) throw new Error("Article content is required.");

  if (!slug) {
    slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  // Get primary domain
  const { data: domains } = await supabase
    .from("domains")
    .select("id")
    .eq("tenant_id", tenant.id)
    .limit(1);

  const domainId = domains?.[0]?.id || null;

  const tags = rawTags
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { data: inserted, error } = await supabase
    .from("blogs")
    .insert({
      tenant_id: tenant.id,
      domain_id: domainId,
      title,
      slug,
      category,
      excerpt,
      content,
      cover_image_url: coverImageUrl,
      author_name: authorName,
      author_avatar_url: authorAvatarUrl,
      tags,
      reading_time_minutes: readingTime,
      status,
      is_featured: isFeatured,
    })
    .select("id, slug")
    .single();

  if (error || !inserted) {
    throw new Error("Could not create blog article: " + (error?.message || "Unknown error"));
  }

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: "blog_created",
    entity_type: "blog",
    entity_id: inserted.id,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${inserted.slug}`);
  revalidatePath("/admin/blogs");
  revalidatePath("/landing");

  return { success: true, id: inserted.id, slug: inserted.slug };
}

export async function updateBlogAction(
  blogId: string,
  formData: FormData
): Promise<{ success: boolean; slug: string }> {
  const { supabase, tenant, user } = await requireTenantContext();

  const title = text(formData, "title");
  let slug = text(formData, "slug");
  const category = text(formData, "category") || "City Guide";
  const excerpt = text(formData, "excerpt") || null;
  const content = text(formData, "content");
  const coverImageUrl = text(formData, "cover_image_url") || null;
  const authorName = text(formData, "author_name") || "LocaToGo Editorial";
  const authorAvatarUrl = text(formData, "author_avatar_url") || null;
  const rawTags = text(formData, "tags");
  const readingTime = parseInt(text(formData, "reading_time_minutes") || "4", 10) || 4;
  const status = (text(formData, "status") || "published") as "draft" | "published" | "archived";
  const isFeatured = formData.get("is_featured") === "true" || formData.get("is_featured") === "on";

  if (!title) throw new Error("Article title is required.");
  if (!content) throw new Error("Article content is required.");

  if (!slug) {
    slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  const tags = rawTags
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { data: updated, error } = await supabase
    .from("blogs")
    .update({
      title,
      slug,
      category,
      excerpt,
      content,
      cover_image_url: coverImageUrl,
      author_name: authorName,
      author_avatar_url: authorAvatarUrl,
      tags,
      reading_time_minutes: readingTime,
      status,
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq("id", blogId)
    .eq("tenant_id", tenant.id)
    .select("slug")
    .single();

  if (error || !updated) {
    throw new Error("Could not update blog article: " + (error?.message || "Unknown error"));
  }

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: "blog_updated",
    entity_type: "blog",
    entity_id: blogId,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${updated.slug}`);
  revalidatePath("/admin/blogs");
  revalidatePath("/landing");

  return { success: true, slug: updated.slug };
}

export async function deleteBlogAction(blogId: string): Promise<{ success: boolean }> {
  const { supabase, tenant, user } = await requireTenantContext();

  const { error } = await supabase
    .from("blogs")
    .delete()
    .eq("id", blogId)
    .eq("tenant_id", tenant.id);

  if (error) throw new Error("Could not delete blog article: " + error.message);

  await supabase.from("listing_audit_logs").insert({
    tenant_id: tenant.id,
    actor_user_id: user.id,
    action: "blog_deleted",
    entity_type: "blog",
    entity_id: blogId,
  });

  revalidatePath("/blog");
  revalidatePath("/admin/blogs");
  revalidatePath("/landing");

  return { success: true };
}

