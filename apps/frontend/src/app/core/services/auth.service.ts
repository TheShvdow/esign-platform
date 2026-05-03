import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'esign.accessToken';
const USER_KEY = 'esign.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  private readonly accessTokenSignal = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );
  private readonly userSignal = signal<User | null>(this.readStoredUser());

  readonly accessToken = computed(() => this.accessTokenSignal());
  readonly isAuthenticated = computed(() => Boolean(this.accessTokenSignal()));
  readonly currentUser = computed(() => this.userSignal());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'ADMIN');

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  private persistSession(response: AuthResponse): void {
    this.accessTokenSignal.set(response.accessToken);
    this.userSignal.set(response.user);

    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  private readStoredUser(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
