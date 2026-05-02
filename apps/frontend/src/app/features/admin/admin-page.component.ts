import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { DocumentService } from '../../core/services/document.service';
import {
  AdminAuditEntry,
  AdminDailyCount,
  AdminPlatformStats,
  AdminUserRow,
} from '../../core/models/admin.models';
import { DocumentDto } from '../../core/models/document.models';
import { AdminChartComponent } from './admin-chart.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminChartComponent],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
})
export class AdminPageComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly documentService = inject(DocumentService);
  private readonly router = inject(Router);

  readonly stats = signal<AdminPlatformStats | null>(null);
  readonly statsError = signal<string | null>(null);

  readonly users = signal<AdminUserRow[]>([]);
  readonly usersTotal = signal(0);
  readonly usersPage = signal(1);
  readonly usersLoading = signal(false);
  readonly patchBusyId = signal<string | null>(null);

  readonly ownerOptions = signal<AdminUserRow[]>([]);

  readonly documents = signal<DocumentDto[]>([]);
  readonly documentsTotal = signal(0);
  readonly documentsPage = signal(1);
  readonly documentsLoading = signal(false);
  readonly docActionBusyId = signal<string | null>(null);
  readonly docActionError = signal<string | null>(null);

  readonly auditItems = signal<AdminAuditEntry[]>([]);
  readonly auditTotal = signal(0);
  readonly auditPage = signal(1);
  readonly auditLoading = signal(false);

  /** Filtres utilisateurs */
  userFilterQ = '';
  userFilterRole = '';

  /** Filtres documents */
  docFilterStatus = '';
  docFilterOwnerId = '';
  docFilterQ = '';
  docFilterDateFrom = '';
  docFilterDateTo = '';
  docSortBy: 'createdAt' | 'title' | 'fileSize' = 'createdAt';
  docSortOrder: 'ASC' | 'DESC' = 'DESC';

  /** Filtres audit */
  auditFilterAction = '';
  auditFilterUserId = '';
  auditFilterDateFrom = '';
  auditFilterDateTo = '';

  readonly roleOptions = [
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'DIRECTOR', label: 'Direction' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'VALIDATOR', label: 'Validateur' },
    { value: 'USER', label: 'Utilisateur' },
  ];

  readonly docStatusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'DRAFT', label: 'Brouillon' },
    { value: 'PENDING_SIGNATURE', label: 'En attente' },
    { value: 'PARTIALLY_SIGNED', label: 'Partiel' },
    { value: 'FULLY_SIGNED', label: 'Signé' },
    { value: 'EXPIRED', label: 'Expiré' },
    { value: 'REJECTED', label: 'Rejeté' },
    { value: 'ARCHIVED', label: 'Archivé' },
  ];

  readonly auditActionOptions = [
    { value: '', label: 'Toutes les actions' },
    { value: 'USER_LOGIN', label: 'Connexion' },
    { value: 'USER_LOGOUT', label: 'Déconnexion' },
    { value: 'USER_REGISTER', label: 'Inscription' },
    { value: 'USER_UPDATE', label: 'Utilisateur modifié' },
    { value: 'DOCUMENT_UPLOAD', label: 'Upload document' },
    { value: 'DOCUMENT_DOWNLOAD', label: 'Téléchargement' },
    { value: 'DOCUMENT_SIGN', label: 'Signature' },
    { value: 'DOCUMENT_VERIFY', label: 'Vérification' },
    { value: 'DOCUMENT_UPDATE', label: 'Document modifié' },
    { value: 'DOCUMENT_DELETE', label: 'Document supprimé' },
  ];

  readonly chartLabels = computed(() => {
    const s = this.stats()?.trends?.documentsPerDay;
    if (!s?.length) return [];
    return s.map((d) => this.shortDateLabel(d.date));
  });

  readonly chartDocs = computed(() =>
    (this.stats()?.trends?.documentsPerDay ?? []).map((x: AdminDailyCount) => x.count),
  );
  readonly chartUsers = computed(() =>
    (this.stats()?.trends?.usersPerDay ?? []).map((x: AdminDailyCount) => x.count),
  );
  readonly chartSigs = computed(() =>
    (this.stats()?.trends?.signaturesPerDay ?? []).map((x: AdminDailyCount) => x.count),
  );

  ngOnInit(): void {
    this.refreshAll();
    this.loadOwnerDirectory();
  }

  shortDateLabel(isoDay: string): string {
    const d = new Date(isoDay + 'T12:00:00Z');
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  }

  loadOwnerDirectory(): void {
    this.adminApi.getUsers({ page: 1, limit: 500 }).subscribe({
      next: (res) => this.ownerOptions.set(res.users),
      error: () => this.ownerOptions.set([]),
    });
  }

  refreshAll(): void {
    this.loadStats();
    this.applyUserFilters(1);
    this.applyDocFilters(1);
    this.applyAuditFilters(1);
  }

  loadStats(): void {
    this.statsError.set(null);
    this.adminApi.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () =>
        this.statsError.set(
          'Impossible de charger les indicateurs (droits ou serveur).',
        ),
    });
  }

  applyUserFilters(page = 1): void {
    this.usersLoading.set(true);
    this.usersPage.set(page);
    this.adminApi
      .getUsers({
        page,
        limit: 15,
        role: this.userFilterRole || undefined,
        q: this.userFilterQ.trim() || undefined,
      })
      .pipe(finalize(() => this.usersLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.users.set(res.users);
          this.usersTotal.set(res.total);
        },
        error: () => this.users.set([]),
      });
  }

  applyDocFilters(page = 1): void {
    this.documentsLoading.set(true);
    this.documentsPage.set(page);
    this.docActionError.set(null);
    this.adminApi
      .getDocuments({
        page,
        limit: 15,
        status: this.docFilterStatus || undefined,
        ownerId: this.docFilterOwnerId || undefined,
        q: this.docFilterQ.trim() || undefined,
        dateFrom: this.docFilterDateFrom || undefined,
        dateTo: this.docFilterDateTo || undefined,
        sortBy: this.docSortBy,
        sortOrder: this.docSortOrder,
      })
      .pipe(finalize(() => this.documentsLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.documents.set(res.documents);
          this.documentsTotal.set(res.total);
        },
        error: () => this.documents.set([]),
      });
  }

  applyAuditFilters(page = 1): void {
    this.auditLoading.set(true);
    this.auditPage.set(page);
    this.adminApi
      .getAudit({
        page,
        limit: 25,
        action: this.auditFilterAction || undefined,
        userId: this.auditFilterUserId.trim() || undefined,
        dateFrom: this.auditFilterDateFrom || undefined,
        dateTo: this.auditFilterDateTo || undefined,
      })
      .pipe(finalize(() => this.auditLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.auditItems.set(res.items);
          this.auditTotal.set(res.total);
        },
        error: () => this.auditItems.set([]),
      });
  }

  onRoleChange(user: AdminUserRow, newRole: string): void {
    if (user.role === newRole) return;
    this.patchBusyId.set(user.id);
    this.adminApi
      .updateUser(user.id, { role: newRole })
      .pipe(finalize(() => this.patchBusyId.set(null)))
      .subscribe({
        next: (updated) => {
          this.users.update((rows) =>
            rows.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
          );
          this.loadOwnerDirectory();
        },
        error: () => this.applyUserFilters(this.usersPage()),
      });
  }

  onActiveToggle(user: AdminUserRow, checked: boolean): void {
    if (user.isActive === checked) return;
    this.patchBusyId.set(user.id);
    this.adminApi
      .updateUser(user.id, { isActive: checked })
      .pipe(finalize(() => this.patchBusyId.set(null)))
      .subscribe({
        next: () => {
          this.users.update((rows) =>
            rows.map((r) =>
              r.id === user.id ? { ...r, isActive: checked } : r,
            ),
          );
          this.loadStats();
          this.loadOwnerDirectory();
        },
        error: () => this.applyUserFilters(this.usersPage()),
      });
  }

  onDocumentStatusChange(doc: DocumentDto, newStatus: string): void {
    if (doc.status === newStatus) return;
    this.docActionBusyId.set(doc.id);
    this.docActionError.set(null);
    this.adminApi
      .updateDocumentStatus(doc.id, newStatus)
      .pipe(finalize(() => this.docActionBusyId.set(null)))
      .subscribe({
        next: (updated) => {
          this.documents.update((rows) =>
            rows.map((r) => (r.id === updated.id ? updated : r)),
          );
          this.loadStats();
        },
        error: (err) => {
          this.docActionError.set(
            err?.error?.message ?? 'Mise à jour impossible.',
          );
          this.applyDocFilters(this.documentsPage());
        },
      });
  }

  confirmDeleteDocument(doc: DocumentDto): void {
    const ok = window.confirm(
      `Supprimer définitivement « ${doc.title} » ? Le fichier et les signatures seront effacés.`,
    );
    if (!ok) return;
    this.docActionBusyId.set(doc.id);
    this.docActionError.set(null);
    this.adminApi
      .deleteDocument(doc.id)
      .pipe(finalize(() => this.docActionBusyId.set(null)))
      .subscribe({
        next: () => {
          this.applyDocFilters(this.documentsPage());
          this.loadStats();
        },
        error: (err) => {
          this.docActionError.set(
            err?.error?.message ?? 'Suppression impossible.',
          );
        },
      });
  }

  downloadDocument(doc: DocumentDto): void {
    this.documentService.downloadFile(doc.id, doc.originalName).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () =>
        this.docActionError.set('Téléchargement impossible.'),
    });
  }

  openDocument(id: string): void {
    void this.router.navigate(['/documents', id]);
  }

  formatBytes(raw: string | number): string {
    try {
      let n = BigInt(typeof raw === 'number' ? Math.floor(raw) : raw);
      const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
      let i = 0;
      while (n >= 1024n && i < units.length - 1) {
        n /= 1024n;
        i++;
      }
      return `${n.toString()} ${units[i]}`;
    } catch {
      return String(raw);
    }
  }

  docStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Brouillon',
      PENDING_SIGNATURE: 'En attente',
      PARTIALLY_SIGNED: 'Partiel',
      FULLY_SIGNED: 'Signé',
      EXPIRED: 'Expiré',
      REJECTED: 'Rejeté',
      ARCHIVED: 'Archivé',
    };
    return map[status] ?? status;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR');
  }

  auditActionLabel(action: string): string {
    const opt = this.auditActionOptions.find((o) => o.value === action);
    return opt?.label ?? action;
  }
}
