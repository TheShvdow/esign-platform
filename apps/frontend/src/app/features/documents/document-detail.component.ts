import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize, map } from 'rxjs';
import { DocumentService } from '../../core/services/document.service';
import {
  DocumentDto,
  DocumentStatus,
  SignatureType,
} from '../../core/models/document.models';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss',
})
export class DocumentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  private readonly destroyRef = inject(DestroyRef);

  readonly SignatureType = SignatureType;

  readonly document = signal<DocumentDto | null>(null);
  readonly isLoading = signal(false);
  readonly actionBusy = signal(false);
  readonly signingInProgress = signal(false);
  readonly showSignatureModal = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly signError = signal<string | null>(null);
  readonly verificationBanner = signal<string | null>(null);

  signatureType: SignatureType = SignatureType.ADVANCED;
  certificateId = 'cert-dev-1';
  signReason = '';

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => this.loadDocument(id));
  }

  loadDocument(id: string): void {
    this.loadError.set(null);
    this.verificationBanner.set(null);
    this.isLoading.set(true);
    this.documentService
      .getDocument(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (doc) => this.document.set(doc),
        error: () =>
          this.loadError.set(
            'Impossible de charger ce document (droits insuffisants ou document introuvable).',
          ),
      });
  }

  goBack(): void {
    this.router.navigate(['/documents']);
  }

  downloadDocument(): void {
    const doc = this.document();
    if (!doc) {
      return;
    }
    this.actionBusy.set(true);
    this.documentService
      .downloadFile(doc.id, doc.originalName)
      .pipe(finalize(() => this.actionBusy.set(false)))
      .subscribe({
        next: ({ blob, fileName }) => {
          const url = URL.createObjectURL(blob);
          const link = window.document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.loadError.set('Échec du téléchargement.'),
      });
  }

  canSign(): boolean {
    const doc = this.document();
    if (!doc) {
      return false;
    }
    if (doc.maySign !== undefined) {
      return doc.maySign;
    }
    return (
      doc.status === DocumentStatus.PENDING_SIGNATURE ||
      doc.status === DocumentStatus.PARTIALLY_SIGNED
    );
  }

  openSignatureModal(): void {
    this.signError.set(null);
    this.signatureType = SignatureType.ADVANCED;
    this.certificateId = 'cert-dev-1';
    this.signReason = '';
    this.showSignatureModal.set(true);
  }

  closeSignatureModal(): void {
    this.showSignatureModal.set(false);
    this.signError.set(null);
  }

  submitSign(): void {
    const doc = this.document();
    const cid = this.certificateId.trim();
    if (!doc || !cid) {
      return;
    }
    this.signingInProgress.set(true);
    this.signError.set(null);
    this.documentService
      .signDocument(doc.id, {
        signatureType: this.signatureType,
        certificateId: cid,
        additionalMetadata: this.signReason.trim()
          ? { reason: this.signReason.trim() }
          : undefined,
      })
      .pipe(finalize(() => this.signingInProgress.set(false)))
      .subscribe({
        next: (updated) => {
          this.document.set(updated);
          this.closeSignatureModal();
        },
        error: (err: { error?: { message?: string } }) => {
          const msg =
            err?.error?.message ||
            'La signature a échoué. Vérifiez le certificat et réessayez.';
          this.signError.set(msg);
        },
      });
  }

  verifySignatures(): void {
    const documentId = this.document()?.id;
    if (!documentId) {
      return;
    }

    this.actionBusy.set(true);
    this.verificationBanner.set(null);
    this.documentService
      .verifyDocument(documentId)
      .pipe(finalize(() => this.actionBusy.set(false)))
      .subscribe({
        next: (result) => {
          const parts = result.signatures.map(
            (s) =>
              `${s.signatureId.slice(0, 8)}… : ${s.isValid ? 'OK' : 'invalide'}`,
          );
          this.verificationBanner.set(
            `Vérification globale : ${result.isValid ? 'valide' : 'invalide'}. ` +
              (parts.length ? `Détail : ${parts.join(' · ')}` : 'Aucune signature.'),
          );
          this.loadDocument(documentId);
        },
        error: () =>
          this.verificationBanner.set('La vérification n’a pas pu être effectuée.'),
      });
  }

  getStatusLabel(status?: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'Brouillon';
      case DocumentStatus.PENDING_SIGNATURE:
        return 'En attente de signature';
      case DocumentStatus.PARTIALLY_SIGNED:
        return 'Partiellement signé';
      case DocumentStatus.FULLY_SIGNED:
        return 'Complètement signé';
      case DocumentStatus.EXPIRED:
        return 'Expiré';
      case DocumentStatus.REJECTED:
        return 'Rejeté';
      case DocumentStatus.ARCHIVED:
        return 'Archivé';
      default:
        return 'Statut inconnu';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('fr-FR');
  }
}
