import { z } from "zod";

const slug = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const domainInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(500).optional(),
});

export const categoryInputSchema = z.object({
  domainId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug,
  description: z.string().trim().max(500).optional(),
});

export const listingInputSchema = z.object({
  domainId: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  title: z.string().trim().min(2).max(180),
  slug,
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  addressLine1: z.string().trim().min(2).max(200),
  locality: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  administrativeArea: z.string().trim().max(120).optional(),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  postalCode: z.string().trim().max(32).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  website: z.string().trim().url().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  status: z.enum(["draft", "pending_review", "approved", "published", "rejected", "suspended", "archived"]).optional(),
  verificationStatus: z.enum(["unverified", "pending", "verified", "rejected"]).optional(),
  isFeatured: z.boolean().optional(),
});

export const customFieldInputSchema = z.object({
  domainId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  key: z.string().trim().regex(/^[a-z][a-z0-9_]*$/),
  fieldType: z.enum(["text", "long_text", "number", "currency", "boolean", "date", "select", "multi_select", "url", "email", "phone", "image", "file"]),
  isRequired: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  isFilterable: z.boolean().default(false),
});

export const socialLinkInputSchema = z.object({
  listingId: z.string().uuid(),
  platform: z.string().trim().min(2).max(40),
  url: z.string().trim().url(),
});

export const submissionInputSchema = z.object({
  domainSlug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(180),
  email: z.string().trim().email(),
  description: z.string().trim().min(10).max(5000),
  companyType: z.string().trim().min(2).max(60).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  careersUrl: z.string().trim().url().optional().or(z.literal("")),
  city: z.string().trim().max(120).optional(),
  locality: z.string().trim().max(120).optional(),
  countryCode: z.string().trim().regex(/^[A-Z]{2}$/).optional(),
  categoryId: z.string().uuid().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const claimInputSchema = z.object({
  listingId: z.string().uuid(),
  information: z.string().trim().min(10).max(2000),
});

export type ActionResult = { error?: string; success?: string };
