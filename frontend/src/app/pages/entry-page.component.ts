import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConvalidacionesService } from '../services/convalidaciones.service';

@Component({
  selector: 'app-entry-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <main class="max-w-md mx-auto px-4 py-20">
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 class="text-2xl font-black text-slate-900">Acceso</h1>
          <p class="mt-2 text-sm text-slate-500" *ngIf="checkingSession">Comprobando sesión...</p>
          <p class="mt-2 text-sm text-slate-500" *ngIf="redirectingToLogin">Redirigiendo al login de Microsoft...</p>
          <p *ngIf="error" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {{ error }}
          </p>
        </section>
      </main>
    </div>
  `,
})
export class EntryPageComponent implements OnInit {
  checkingSession = true;
  redirectingToLogin = false;
  error: string | null = null;

  constructor(
    private convalidacionesService: ConvalidacionesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resolveEntry();
  }

  private resolveEntry(): void {
    this.checkingSession = true;
    this.redirectingToLogin = false;
    this.error = null;
    this.convalidacionesService.getUserSession().subscribe({
      next: (session) => {
        this.checkingSession = false;
        const target = (session.rol || '').trim().toLowerCase() === 'admin' ? '/admin' : '/formulario';
        this.router.navigateByUrl(target);
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err?.status === 401) {
          this.checkingSession = false;
          this.redirectingToLogin = true;
          this.cdr.detectChanges();
          const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          window.location.assign(this.convalidacionesService.getAuthLoginUrl(returnTo));
          return;
        }
        this.checkingSession = false;
        this.error = err?.error?.detail || 'No se ha podido comprobar tu sesión.';
        this.cdr.detectChanges();
      },
    });
  }
}
