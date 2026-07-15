import type {
  User,
  UserSettings,
  Project,
  DynamicLink,
  LinkHistory,
  Analytics,
  Visitor,
  CustomDomain,
  ApiKey,
  AuditLog,
  UserSession,
  UserRole,
  LinkStatus,
  DeviceType,
  AuditAction,
} from "@prisma/client";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  User,
  UserSettings,
  Project,
  DynamicLink,
  LinkHistory,
  Analytics,
  Visitor,
  CustomDomain,
  ApiKey,
  AuditLog,
  UserSession,
  UserRole,
  LinkStatus,
  DeviceType,
  AuditAction,
};

// ─── Extended types ────────────────────────────────────────────────────────────

export type UserWithSettings = User & { settings: UserSettings | null };

export type LinkWithProject = DynamicLink & {
  project: Pick<Project, "id" | "name" | "color"> | null;
  _count: { analytics: number };
};

export type LinkWithRelations = DynamicLink & {
  project: Pick<Project, "id" | "name" | "color"> | null;
  history: LinkHistory[];
  _count: { analytics: number };
};

export type ProjectWithCount = Project & {
  _count: { links: number };
};

// ─── API types ─────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalLinks: number;
  activeLinks: number;
  todayClicks: number;
  monthClicks: number;
  uniqueVisitors: number;
  clickGrowth: number;
  topLinks: Pick<DynamicLink, "id" | "slug" | "title" | "destinationUrl" | "totalClicks">[];
  recentActivity: Pick<Analytics, "clickedAt" | "country" | "browser" | "linkId">[];
  clicksOverTime: { date: string; clicks: number }[];
}

export interface LinkAnalyticsSummary {
  total: number;
  today: number;
  month: number;
  unique: number;
  topCountries: { country: string; count: number }[];
  topBrowsers: { browser: string; count: number }[];
  topDevices: { device: DeviceType; count: number }[];
  topReferrers: { referrer: string; count: number }[];
}

// ─── UI state types ────────────────────────────────────────────────────────────

export interface TableFilters {
  q?: string;
  status?: string;
  projectId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type ToastVariant = "default" | "destructive" | "success";
