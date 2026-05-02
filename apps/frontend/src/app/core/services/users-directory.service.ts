import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto } from '../models/document.models';

@Injectable({ providedIn: 'root' })
export class UsersDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  /** Liste des utilisateurs pour participants / workflow (champs limités). */
  getDirectory(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiBaseUrl}/users`);
  }
}
