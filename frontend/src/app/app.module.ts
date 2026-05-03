import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { HomePageComponent } from './pages/home/home.page';
import { AdminPageComponent } from './pages/admin/admin.page';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'admin', component: AdminPageComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  declarations: [],
  imports: [
    BrowserModule, BrowserAnimationsModule,
    HttpClientModule, ReactiveFormsModule, FormsModule,
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' }),
  ],
  providers: [
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
})
export class AppModule {}