import { z } from "zod";

// ─── URL Validation ───────────────────────────────────────────────────────────

export const urlSchema = z
  .string()
  .min(1, "URL is required")
  .url("Must be a valid URL")
  .refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "URL must start with http:// or https://"
  );

export const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(64, "Slug must be at most 64 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Slug can only contain letters, numbers, hyphens, and underscores")
  .refine((s) => !["api", "admin", "dashboard", "sign-in", "sign-up", "settings"].includes(s), {
    message: "This slug is reserved",
  });

// ─── Link Schemas ─────────────────────────────────────────────────────────────

export const createLinkSchema = z.object({
  destinationUrl: urlSchema,
  title: z.string().max(120, "Title must be at most 120 characters").optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  slug: slugSchema.optional(),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(64, "Password must be at most 64 characters")
    .optional()
    .or(z.literal("")),
  expiresAt: z.coerce.date().min(new Date(), "Expiration must be in the future").optional().nullable(),
  maxClicks: z
    .number()
    .int()
    .positive("Max clicks must be a positive number")
    .optional()
    .nullable(),
  redirectDelay: z.number().int().min(0).max(30, "Delay max is 30 seconds").default(0),
  ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ogTitle: z.string().max(120).optional(),
  ogDescription: z.string().max(300).optional(),
  faviconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.array(z.string().max(30)).max(10, "Max 10 tags").default([]),
  notes: z.string().max(1000).optional(),
  projectId: z.string().cuid().optional().nullable(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

export const updateLinkSchema = createLinkSchema.partial().extend({
  id: z.string().cuid(),
  changeNote: z.string().max(500).optional(),
});

export const updateDestinationSchema = z.object({
  id: z.string().cuid(),
  destinationUrl: urlSchema,
  changeNote: z.string().max(500).optional(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "Select at least one link"),
  action: z.enum(["delete", "archive", "enable", "disable", "restore"]),
});

// ─── Project Schemas ──────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color")
    .default("#6366f1"),
  icon: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().cuid(),
});

// ─── User / Settings Schemas ──────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  emailNotifications: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  linkCreatedAlert: z.boolean().optional(),
  clickThresholdAlert: z.boolean().optional(),
  clickThreshold: z.number().int().positive().optional(),
  defaultRedirectDelay: z.number().int().min(0).max(30).optional(),
  defaultLinkExpiry: z.number().int().positive().optional().nullable(),
  publicProfile: z.boolean().optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).min(1, "Select at least one scope"),
  expiresAt: z.coerce.date().optional().nullable(),
});

// ─── Analytics Query Schema ───────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  linkId: z.string().cuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  groupBy: z.enum(["hour", "day", "week", "month"]).default("day"),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  page: z.coerce.number().int().positive().default(1),
});

// ─── Custom Domain Schemas ────────────────────────────────────────────────────

export const addCustomDomainSchema = z.object({
  domain: z
    .string()
    .min(3)
    .max(253)
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Must be a valid domain"
    ),
});

// ─── Admin Schemas ────────────────────────────────────────────────────────────

export const banUserSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().min(1).max(500),
});

export const searchSchema = z.object({
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.string().optional(),
  projectId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ─── Type Exports ──────────────────────────────────────────────────────────────

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type AddCustomDomainInput = z.infer<typeof addCustomDomainSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
