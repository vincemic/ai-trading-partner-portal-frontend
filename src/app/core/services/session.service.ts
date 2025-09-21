import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, SessionUser } from '../models/dto.models';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly tokenKey = environment.sessionTokenKey;
  private readonly _session = signal<SessionUser | null>(null);
  private readonly _isAuthenticated = computed(() => this._session() !== null);

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = this._isAuthenticated;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeSession();
  }

  private initializeSession(): void {
    const token = this.getStoredToken();
    if (token) {
      try {
        // In a real implementation, you might validate the token here
        // For now, we'll assume it's valid if it exists
        const storedUser = sessionStorage.getItem('portalUser');
        if (storedUser) {
          const user = JSON.parse(storedUser) as SessionUser;
          this._session.set(user);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        this.clearSession();
      }
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return new Observable<LoginResponse>(observer => {
      // For testing purposes, use predefined session tokens based on role
      // In production, this would be a real API call
      const token = this.generateTestToken(request.role);
      const user: SessionUser = {
        userId: request.userId,
        partnerId: request.partner,
        role: request.role
      };
      
      const response: LoginResponse = {
        token: token,
        user: user
      };

      // Simulate API delay
      setTimeout(() => {
        this.setSession(response.token, response.user);
        observer.next(response);
        observer.complete();
      }, 300);
    });
  }

  private generateTestToken(role: string): string {
    // Use predefined tokens that the backend API recognizes
    switch (role) {
      case 'PartnerAdmin':
        return 'admin-session-token';
      case 'PartnerUser':
        return 'user-session-token';
      case 'InternalSupport':
        return 'test-admin-user1';
      default:
        return 'test-session-token';
    }
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: SessionUser): void {
    try {
      sessionStorage.setItem(this.tokenKey, token);
      sessionStorage.setItem('portalUser', JSON.stringify(user));
      this._session.set(user);
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  private clearSession(): void {
    try {
      sessionStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem('portalUser');
      this._session.set(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  private getStoredToken(): string | null {
    try {
      return sessionStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  hasRole(requiredRoles: string[]): boolean {
    const session = this._session();
    if (!session) return false;
    return requiredRoles.includes(session.role);
  }

  handleUnauthorized(): void {
    this.clearSession();
    this.router.navigate(['/login'], { 
      queryParams: { message: 'Session expired. Please log in again.' }
    });
  }
}