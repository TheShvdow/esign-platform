import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { DocumentDto, DocumentStatus } from '../../core/models/document.models';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly router = inject(Router);

  readonly documents = signal<DocumentDto[]>([]);
  readonly isLoading = signal(false);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly hasMorePages = signal(false);

  readonly selectedStatus = signal('');

  readonly filteredDocuments = computed(() => {
    const docs = this.documents();
    const status = this.selectedStatus();
    if (!status) {
      return docs;
    }
    return docs.filter((d) => d.status === status);
  });

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    this.documentService.getDocuments(this.currentPage(), 12)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (this.currentPage() === 1) {
            this.documents.set(response.documents);
          } else {
            this.documents.update(docs => [...docs, ...response.documents]);
          }

          this.totalCount.set(response.total);
          this.hasMorePages.set(response.documents.length === 12 && this.documents().length < response.total);
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          // TODO: Show error notification
        }
      });
  }

  loadNextPage(): void {
    this.currentPage.update(page => page + 1);
    this.loadDocuments();
  }

  viewDocument(documentId: string): void {
    this.router.navigate(['/documents', documentId]);
  }

  signDocument(documentId: string): void {
    this.router.navigate(['/documents', documentId]);
    // The detail component will handle the signing modal
  }

  downloadDocument(doc: DocumentDto): void {
    this.documentService.downloadFile(doc.id, doc.originalName).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Téléchargement impossible:', err),
    });
  }

  canSign(document: DocumentDto): boolean {
    if (document.maySign !== undefined) {
      return document.maySign;
    }
    return (
      document.status === DocumentStatus.PENDING_SIGNATURE ||
      document.status === DocumentStatus.PARTIALLY_SIGNED
    );
  }

  getStatusLabel(status: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.DRAFT: return 'Brouillon';
      case DocumentStatus.PENDING_SIGNATURE: return 'En attente';
      case DocumentStatus.PARTIALLY_SIGNED: return 'Partiel';
      case DocumentStatus.FULLY_SIGNED: return 'Signé';
      case DocumentStatus.EXPIRED: return 'Expiré';
      case DocumentStatus.REJECTED: return 'Rejeté';
      case DocumentStatus.ARCHIVED: return 'Archivé';
      default: return 'Inconnu';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  }
}
