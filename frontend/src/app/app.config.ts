import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthGuard } from './guards/auth.guard';
import { HomePageComponent } from './pages/home/home.page';
import { AdminPageComponent } from './pages/admin/admin.page';
import { PaymentSuccessPageComponent } from './pages/payment-success/payment-success.page';
import { PaymentCancelPageComponent } from './pages/payment-cancel/payment-cancel.page';
import { InsightsPageComponent } from './pages/insights/insights.page';
import { ResumeReviewPageComponent } from './pages/resume-review/resume-review.page';

const routes = [
  { path: '', component: HomePageComponent },
  { path: 'admin', component: AdminPageComponent, canActivate: [AuthGuard] },
  { path: 'payment/success', component: PaymentSuccessPageComponent },
  { path: 'payment/cancel', component: PaymentCancelPageComponent },
  { path: 'insights', component: InsightsPageComponent },
  { path: 'resume-review', component: ResumeReviewPageComponent },
  { path: '**', redirectTo: '' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
};