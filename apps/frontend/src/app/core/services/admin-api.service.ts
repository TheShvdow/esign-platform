import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminAuditResponse,
  AdminPlatformStats,
  AdminUpdateUserPayload,
  AdminUserRow,
  AdminUsersResponse,
} from '../models/admin.models';
import { DocumentDto, DocumentsListResponse } from '../models/document.models';

function paramsFromRecord(
  r: Record<string, string | number | undefined>,
): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(r)) {
    if (v !== undefined && v !== '') {
      p = p.set(k, String(v));
    }
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin`;

  getStats(): Observable<AdminPlatformStats> {
    return this.http.get<AdminPlatformStats>(`${this.base}/stats`);
  }

  getDocuments(filters: {
    page?: number;
    limit?: number;
    status?: string;
    ownerId?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<DocumentsListResponse> {
    const params = paramsFromRecord({
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      status: filters.status,
      ownerId: filters.ownerId,
      q: filters.q,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
    return this.http.get<DocumentsListResponse>(`${this.base}/documents`, {
      params,
    });
  }

  updateDocumentStatus(id: string, status: string): Observable<DocumentDto> {
    return this.http.patch<DocumentDto>(`${this.base}/documents/${id}`, {
      status,
    });
  }

  deleteDocument(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/documents/${id}`);
  }

  getUsers(filters: {
    page?: number;
    limit?: number;
    role?: string;
    q?: string;
  }): Observable<AdminUsersResponse> {
    const params = paramsFromRecord({
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      role: filters.role,
      q: filters.q,
    });
    return this.http.get<AdminUsersResponse>(`${this.base}/users`, {
      params,
    });
  }

  updateUser(
    id: string,
    payload: AdminUpdateUserPayload,
  ): Observable<AdminUserRow> {
    return this.http.patch<AdminUserRow>(`${this.base}/users/${id}`, payload);
  }

  getAudit(filters: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<AdminAuditResponse> {
    const params = paramsFromRecord({
      page: filters.page ?? 1,
      limit: filters.limit ?? 25,
      action: filters.action,
      userId: filters.userId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
    return this.http.get<AdminAuditResponse>(`${this.base}/audit`, { params });
  }
}
