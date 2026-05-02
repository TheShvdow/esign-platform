import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DocumentDto,
  CreateDocumentDto,
  SignDocumentDto,
  DocumentsListResponse,
  DocumentVerificationResult,
} from '../models/document.models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getDocuments(page: number = 1, limit: number = 10): Observable<DocumentsListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<DocumentsListResponse>(`${this.apiBaseUrl}/documents`, { params });
  }

  getDocument(id: string): Observable<DocumentDto> {
    return this.http.get<DocumentDto>(`${this.apiBaseUrl}/documents/${id}`);
  }

  uploadDocument(formData: FormData): Observable<DocumentDto> {
    return this.http.post<DocumentDto>(`${this.apiBaseUrl}/documents`, formData);
  }

  signDocument(documentId: string, signDto: SignDocumentDto): Observable<DocumentDto> {
    return this.http.post<DocumentDto>(`${this.apiBaseUrl}/documents/${documentId}/sign`, signDto);
  }

  verifyDocument(documentId: string): Observable<DocumentVerificationResult> {
    return this.http.post<DocumentVerificationResult>(`${this.apiBaseUrl}/documents/${documentId}/verify`, {});
  }

  /** GET avec JWT ; récupère le blob et un nom de fichier depuis Content-Disposition */
  downloadFile(
    documentId: string,
    fallbackFileName: string,
  ): Observable<{ blob: Blob; fileName: string }> {
    return this.http
      .get(`${this.apiBaseUrl}/documents/${documentId}/download`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((res) => {
          const header = res.headers.get('content-disposition');
          const fileName = DocumentService.parseContentDispositionFilename(
            header,
            fallbackFileName,
          );
          return { blob: res.body as Blob, fileName };
        }),
      );
  }

  private static parseContentDispositionFilename(
    header: string | null,
    fallback: string,
  ): string {
    if (!header) {
      return fallback;
    }
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utf8?.[1]) {
      try {
        return decodeURIComponent(utf8[1].trim());
      } catch {
        /* ignore */
      }
    }
    const quoted = /filename="([^"]+)"/i.exec(header);
    if (quoted?.[1]) {
      return quoted[1];
    }
    const plain = /filename=([^;\s]+)/i.exec(header);
    if (plain?.[1]) {
      return plain[1].replace(/^["']|["']$/g, '');
    }
    return fallback;
  }
}
