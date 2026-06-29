import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DatosPersonalesComponent } from '../components/datos-personales/datos-personales.component';
import { EstudiosCursadosComponent } from '../components/estudios-cursados/estudios-cursados.component';
import { ConvalidacionesSolicitadasComponent } from '../components/convalidaciones-solicitadas/convalidaciones-solicitadas.component';
import { DocumentacionAportarComponent } from '../components/documentacion-aportar/documentacion-aportar.component';
import { ResumenFormularioComponent } from '../components/resumen-formulario/resumen-formulario.component';
import { ConvalidacionesService, isValidPersonalDocumentNumber } from '../services/convalidaciones.service';

@Component({
  selector: 'app-formulario-page',
  standalone: true,
  imports: [
    CommonModule,
    DatosPersonalesComponent,
    EstudiosCursadosComponent,
    ConvalidacionesSolicitadasComponent,
    DocumentacionAportarComponent,
    ResumenFormularioComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <div class="flex items-center gap-2">
            <span class="font-black text-lg tracking-tight text-gray-900 uppercase">
              SOMO <span class="text-indigo-600">CONVALIDACIONES</span>
            </span>
          </div>
        </div>
      </header>

      <main class="flex-grow py-12">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          <div *ngIf="authChecking" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Comprobando sesión...
          </div>

          <div *ngIf="!authChecking && authError" class="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            {{ authError }}
          </div>

          <ng-container *ngIf="!authChecking && !authError">
          <div class="mb-12">
            <div class="md:hidden mb-4 px-1">
              <div class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                Paso {{ getActiveStepNumber() }} de {{ steps.length }}
              </div>
            </div>

            <div class="relative hidden md:flex items-center justify-between px-12 md:px-24">
              <div class="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>

              <div
                *ngFor="let step of steps"
                class="relative z-10 flex flex-col items-center group"
                [ngClass]="canGoToStep(step.id) ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'"
                (click)="goToStep(step.id)"
              >
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2"
                  [ngClass]="
                    activeStep === step.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110'
                      : isCompleted(step.id)
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : 'bg-white border-gray-200 text-gray-400'
                  "
                >
                  <svg *ngIf="isCompleted(step.id)" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span *ngIf="!isCompleted(step.id)" class="text-xs font-bold">{{ step.number }}</span>
                </div>
                <span
                  class="absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-200"
                  [ngClass]="activeStep === step.id ? 'text-indigo-600' : 'text-gray-400 text-gray-500/80'"
                >
                  {{ step.label }}
                </span>
              </div>
            </div>
          </div>

          <app-datos-personales *ngIf="activeStep === 'personal'" (next)="nextStep()" />
          <app-estudios-cursados *ngIf="activeStep === 'input'" (next)="nextStep()" (prev)="prevStep()" />
          <app-convalidaciones-solicitadas *ngIf="activeStep === 'results'" (next)="nextStep()" (prev)="prevStep()" />
          <app-documentacion-aportar *ngIf="activeStep === 'docs'" (next)="nextStep()" (prev)="prevStep()" />
          <app-resumen-formulario
            *ngIf="activeStep === 'resumen'"
            (prev)="prevStep()"
            (submitted)="onFormularioEnviado()"
          />
          </ng-container>
        </div>
      </main>

      <footer class="bg-white border-t border-gray-100 py-6">
        <div class="max-w-7xl mx-auto px-4 text-center">
          <p class="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
            © 2024 Somorrostro · Gestión de Convalidaciones
          </p>
        </div>
      </footer>
    </div>
  `,
})
export class FormularioPageComponent implements OnInit {
  activeStep: 'personal' | 'input' | 'results' | 'docs' | 'resumen' = 'personal';
  formularioEnviado = false;
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  authChecking = true;
  authError: string | null = null;

  constructor(
    private convalidacionesService: ConvalidacionesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserSession();
  }

  steps = [
    { id: 'personal', number: 1, label: 'Datos personales' },
    { id: 'input', number: 2, label: 'Estudios cursados' },
    { id: 'results', number: 3, label: 'Solicitudes' },
    { id: 'docs', number: 4, label: 'Documentación' },
    { id: 'resumen', number: 5, label: 'Resumen' },
  ];

  isCompleted(stepId: string): boolean {
    const order = ['personal', 'input', 'results', 'docs', 'resumen'];
    return order.indexOf(stepId) < order.indexOf(this.activeStep);
  }

  private loadUserSession(): void {
    this.authChecking = true;
    this.authError = null;
    this.convalidacionesService.getUserSession().subscribe({
      next: (session) => {
        this.authChecking = false;
        const [nombre, ...resto] = String(session.nombre || '').trim().split(/\s+/).filter(Boolean);
        this.convalidacionesService.setPersonalData({
          documentType: 'dni',
          nombre: nombre || '',
          apellidos: resto.join(' '),
          dni: session.dni || '',
          email: session.email || session.username || '',
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err?.status === 401) {
          this.router.navigateByUrl('/');
          return;
        }
        this.authChecking = false;
        this.authError = err?.error?.detail || 'No se ha podido comprobar tu sesión.';
        this.cdr.detectChanges();
      },
    });
  }

  canGoToStep(stepId: string): boolean {
    const order = ['personal', 'input', 'results', 'docs', 'resumen'];
    const targetIndex = order.indexOf(stepId);
    const currentIndex = order.indexOf(this.activeStep);

    if (this.formularioEnviado) {
      return stepId === 'resumen';
    }

    if (targetIndex <= currentIndex) return true;

    if (targetIndex >= 1 && !this.hasPersonalData()) return false;
    if (targetIndex >= 2 && !this.hasInputData()) return false;
    if (targetIndex >= 3 && !this.hasResultsData()) return false;
    if (targetIndex >= 4 && !this.hasDocsData()) return false;
    return true;
  }

  goToStep(stepId: any) {
    if (this.canGoToStep(stepId)) {
      this.activeStep = stepId;
      this.scrollToTop();
    }
  }

  private hasPersonalData(): boolean {
    const data = this.convalidacionesService.getPersonalData();
    return !!data.nombre?.trim()
      && !!data.apellidos?.trim()
      && isValidPersonalDocumentNumber(data.documentType || 'dni', data.dni || '')
      && this.emailPattern.test(data.email?.trim() ?? '');
  }

  private hasInputData(): boolean {
    return (
      this.convalidacionesService.getEstudios().length > 0
      || this.convalidacionesService.getAcreditaciones().length > 0
      || this.convalidacionesService.getOtrosCiclosModulos().length > 0
    );
  }

  private hasResultsData(): boolean {
    return (
      this.convalidacionesService.sharedSelectedConvalidations.length > 0
      || this.convalidacionesService.otrosModulosCiclo.length > 0
      || this.convalidacionesService.otrosSolicitudes.length > 0
    );
  }

  private hasDocsData(): boolean {
    return !!this.convalidacionesService.documentoDni && this.convalidacionesService.documentosCertificado.length > 0;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep() {
    if (this.activeStep === 'personal') this.activeStep = 'input';
    else if (this.activeStep === 'input') this.activeStep = 'results';
    else if (this.activeStep === 'results') this.activeStep = 'docs';
    else if (this.activeStep === 'docs') this.activeStep = 'resumen';
    this.scrollToTop();
  }

  prevStep() {
    if (this.formularioEnviado) return;

    if (this.activeStep === 'input') this.activeStep = 'personal';
    else if (this.activeStep === 'results') this.activeStep = 'input';
    else if (this.activeStep === 'docs') this.activeStep = 'results';
    else if (this.activeStep === 'resumen') this.activeStep = 'docs';
  }

  onFormularioEnviado(): void {
    this.formularioEnviado = true;
    this.activeStep = 'resumen';
  }

  getActiveStepNumber(): number {
    const index = this.steps.findIndex((step) => step.id === this.activeStep);
    return index >= 0 ? index + 1 : 1;
  }
}
