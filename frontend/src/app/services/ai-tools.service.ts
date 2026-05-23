import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiToolsApiService {
  private base = `${environment.apiUrl}/ai-tools`;

  constructor(private http: HttpClient) {}

  getRemaining(email: string) {
    return this.http.get<{ remaining: number }>(`${this.base}/remaining?email=${encodeURIComponent(email)}&service=ideas`);
  }

  sendCode(email: string) {
    return this.http.post<{ sent: boolean }>(`${this.base}/send-code`, { email });
  }

  verifyCode(email: string, code: string) {
    return this.http.post<{ verified: boolean }>(`${this.base}/verify-code`, { email, code });
  }

  generateIdeas(email: string, topic: string) {
    return this.http.post<{ ideas: any[]; remaining: number }>(`${this.base}/ideas`, { email, topic });
  }
}
