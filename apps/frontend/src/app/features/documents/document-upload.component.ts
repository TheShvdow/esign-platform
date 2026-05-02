import { Component, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../core/services/document.service';
import { UserDto } from '../../core/models/document.models';
import { UsersDirectoryService } from '../../core/services/users-directory.service';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss',
})
export class DocumentUploadComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly usersDirectory = inject(UsersDirectoryService);

  // Outputs
  readonly documentUploaded = output<void>();

  // Signals
  readonly selectedFile = signal<File | null>(null);
  readonly isDragOver = signal(false);
  readonly isUploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly errorMessage = signal<string | null>(null);
  readonly directoryUsers = signal<UserDto[]>([]);

  // Form data
  documentTitle = '';
  documentDescription = '';
  requiredSigCount = 1;
  selectedParticipantIds: string[] = [];
  workflowJsonAdvanced = '';

  ngOnInit(): void {
    this.usersDirectory.getDirectory().subscribe({
      next: (users) => this.directoryUsers.set(users),
      error: () => this.directoryUsers.set([]),
    });
  }

  toggleParticipant(userId: string): void {
    const idx = this.selectedParticipantIds.indexOf(userId);
    if (idx >= 0) {
      this.selectedParticipantIds = this.selectedParticipantIds.filter((id) => id !== userId);
    } else {
      this.selectedParticipantIds = [...this.selectedParticipantIds, userId];
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    // Validate file
    if (!this.isValidFile(file)) {
      this.errorMessage.set('Type de fichier non supporté. Utilisez PDF, DOC, DOCX, JPG ou PNG.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      this.errorMessage.set('Le fichier est trop volumineux (max 10MB).');
      return;
    }

    this.selectedFile.set(file);
    this.documentTitle = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    this.errorMessage.set(null);
  }

  private isValidFile(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    return allowedTypes.includes(file.type);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.documentTitle = '';
    this.documentDescription = '';
    this.requiredSigCount = 1;
    this.selectedParticipantIds = [];
    this.workflowJsonAdvanced = '';
    this.errorMessage.set(null);
  }

  cancelUpload(): void {
    this.removeFile(new Event('cancel'));
  }

  canUpload(): boolean {
    return !!(this.selectedFile() && this.documentTitle.trim());
  }

  uploadDocument(): void {
    if (!this.canUpload()) return;

    const file = this.selectedFile()!;
    const formData = new FormData();

    formData.append('file', file);
    formData.append('title', this.documentTitle.trim());
    if (this.documentDescription.trim()) {
      formData.append('description', this.documentDescription.trim());
    }

    const metaJson = this.buildMetadataPayload();
    if (metaJson === false) {
      return;
    }
    if (metaJson) {
      formData.append('metadata', metaJson);
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.errorMessage.set(null);

    this.documentService.uploadDocument(formData)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: (document) => {
          console.log('Document uploaded successfully:', document);
          this.uploadProgress.set(100);

          // Reset form
          this.selectedFile.set(null);
          this.documentTitle = '';
          this.documentDescription = '';
          this.requiredSigCount = 1;
          this.selectedParticipantIds = [];
          this.workflowJsonAdvanced = '';

          // Notify parent component
          this.documentUploaded.emit();
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.errorMessage.set('Erreur lors de l\'upload. Veuillez réessayer.');
          this.uploadProgress.set(0);
        }
      });

    // Simulate progress (in real app, you'd track actual upload progress)
    this.simulateUploadProgress();
  }

  /**
   * @returns chaîne JSON, undefined si rien à envoyer, false si erreur de parsing.
   */
  private buildMetadataPayload(): string | undefined | false {
    const meta: Record<string, unknown> = {};
    const req = Math.max(1, Number(this.requiredSigCount) || 1);
    if (req !== 1) {
      meta['requiredSignatures'] = req;
    }
    if (this.selectedParticipantIds.length > 0) {
      meta['participantUserIds'] = [...this.selectedParticipantIds];
    }
    if (this.workflowJsonAdvanced.trim()) {
      try {
        const extra = JSON.parse(this.workflowJsonAdvanced) as Record<string, unknown>;
        Object.assign(meta, extra);
      } catch {
        this.errorMessage.set('Le JSON du workflow est invalide.');
        return false;
      }
    }
    if (Object.keys(meta).length === 0) {
      return undefined;
    }
    return JSON.stringify(meta);
  }

  private simulateUploadProgress(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 90) {
        progress = 90;
        clearInterval(interval);
      }
      this.uploadProgress.set(Math.round(progress));
    }, 200);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
