import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentListComponent } from "./document-list.component";
import { DocumentUploadComponent } from "./document-upload.component";

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DocumentListComponent, DocumentUploadComponent],
  templateUrl: './documents-page.component.html',
  styleUrl: './documents-page.component.scss',
})
export class DocumentsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly userName = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return 'Utilisateur';
    }

    return `${user.firstName} ${user.lastName}`;
  });

  /** Signal : true si le compte a le rôle ADMIN (lien vers la console d’administration). */
  readonly isAdmin = this.authService.isAdmin;

  onDocumentUploaded(): void {
    this.router.navigate(['/documents']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
