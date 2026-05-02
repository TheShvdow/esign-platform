export interface AdminDailyCount {
  date: string;
  count: number;
}

export interface AdminPlatformStats {
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  documents: {
    total: number;
    byStatus: Record<string, number>;
    totalBytesStored: string;
  };
  signatures: { total: number };
  audit: { entriesLast7Days: number; totalEntries: number };
  trends: {
    trendDays: number;
    documentsPerDay: AdminDailyCount[];
    usersPerDay: AdminDailyCount[];
    signaturesPerDay: AdminDailyCount[];
  };
}

export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

export interface AdminAuditResponse {
  items: AdminAuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUpdateUserPayload {
  role?: string;
  isActive?: boolean;
}
