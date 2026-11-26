import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  /**
   * Access token is held strictly in memory.
   * Never written to localStorage or sessionStorage to guard against XSS token exfiltration.
   */
  private readonly _accessToken = signal<string | null>(null);
  readonly accessToken = this._accessToken.asReadonly();

  getToken(): string | null {
    return this._accessToken();
  }

  setToken(token: string): void {
    this._accessToken.set(token);
  }

  clearToken(): void {
    this._accessToken.set(null);
  }
}
