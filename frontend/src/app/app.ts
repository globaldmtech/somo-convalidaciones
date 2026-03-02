import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatosPersonalesComponent } from './components/datos-personales/datos-personales.component';
import { EstudiosCursadosComponent } from './components/estudios-cursados/estudios-cursados.component';
import { ConvalidacionesSolicitadasComponent } from './components/convalidaciones-solicitadas/convalidaciones-solicitadas.component';
import { DocumentacionAportarComponent } from './components/documentacion-aportar/documentacion-aportar.component';
import { ResumenFormularioComponent } from './components/resumen-formulario/resumen-formulario.component';
import { ConvalidacionesService } from './services/convalidaciones.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DatosPersonalesComponent,
    EstudiosCursadosComponent,
    ConvalidacionesSolicitadasComponent,
    DocumentacionAportarComponent,
    ResumenFormularioComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <!-- Navbar / Header -->
      <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-black text-lg tracking-tight text-gray-900 uppercase">SOMO <span class="text-indigo-600">CONVALIDACIONES</span></span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-grow py-12">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
          
          <!-- Stepper Section (Now inside gray area) -->
          <div class="mb-12 px-12 sm:px-24">
            <div class="relative flex items-center justify-between">
              <!-- Continuous Line Background -->
              <div class="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
              
              <!-- Step Indicators -->
              <div *ngFor="let step of steps"
                   class="relative z-10 flex flex-col items-center group"
                   [ngClass]="canGoToStep(step.id) ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'"
                   (click)="goToStep(step.id)">
                <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2"
                     [ngClass]="activeStep === step.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110' : 
                                (isCompleted(step.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400')">
                  <svg *ngIf="isCompleted(step.id)" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span *ngIf="!isCompleted(step.id)" class="text-xs font-bold">{{ step.number }}</span>
                </div>
                <span class="absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-200"
                      [ngClass]="activeStep === step.id ? 'text-indigo-600' : 'text-gray-400 text-gray-500/80'">{{ step.label }}</span>
              </div>
            </div>
          </div>

          <!-- Components -->
          <app-datos-personales *ngIf="activeStep === 'personal'" (next)="nextStep()" />
          <app-estudios-cursados *ngIf="activeStep === 'input'" (next)="nextStep()" (prev)="prevStep()" />
          <app-convalidaciones-solicitadas *ngIf="activeStep === 'results'" (next)="nextStep()" (prev)="prevStep()" />
          <app-documentacion-aportar *ngIf="activeStep === 'docs'" (next)="nextStep()" (prev)="prevStep()" />
          <app-resumen-formulario *ngIf="activeStep === 'resumen'" (prev)="prevStep()" />
        </div>
      </main>

      <!-- Minimal Footer -->
      <footer class="bg-white border-t border-gray-100 py-6">
        <div class="max-w-7xl mx-auto px-4 text-center">
          <p class="text-[10px] text-gray-400 font-medium uppercase tracking-widest">© 2024 Somorrostro · Gestión de Convalidaciones</p>
        </div>
      </footer>
    </div>
  `
})
export class App {
  activeStep: 'personal' | 'input' | 'results' | 'docs' | 'resumen' = 'personal';

  constructor(private convalidacionesService: ConvalidacionesService) {}

  steps = [
    { id: 'personal', number: 1, label: 'Datos personales' },
    { id: 'input', number: 2, label: 'Estudios cursados' },
    { id: 'results', number: 3, label: 'Solicitudes' },
    { id: 'docs', number: 4, label: 'Documentación' },
    { id: 'resumen', number: 5, label: 'Resumen' }
  ];

  isCompleted(stepId: string): boolean {
    const order = ['personal', 'input', 'results', 'docs', 'resumen'];
    return order.indexOf(stepId) < order.indexOf(this.activeStep);
  }

  canGoToStep(stepId: string): boolean {
    const order = ['personal', 'input', 'results', 'docs', 'resumen'];
    const targetIndex = order.indexOf(stepId);
    const currentIndex = order.indexOf(this.activeStep);

    // Always allow going backwards or staying on current step.
    if (targetIndex <= currentIndex) return true;

    // Allow forward jump only if all previous sections have some data.
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
    return !!(data.nombre?.trim() || data.apellidos?.trim() || data.dni?.trim() || data.email?.trim());
  }

  private hasInputData(): boolean {
    return this.convalidacionesService.getEstudios().length > 0
      || this.convalidacionesService.getAcreditaciones().length > 0
      || this.convalidacionesService.getOtrosCiclosModulos().length > 0;
  }

  private hasResultsData(): boolean {
    return this.convalidacionesService.sharedSelectedConvalidations.length > 0
      || this.convalidacionesService.otrosModulosCiclo.length > 0
      || this.convalidacionesService.otrosSolicitudes.length > 0;
  }

  private hasDocsData(): boolean {
    return !!this.convalidacionesService.documentoDni
      && this.convalidacionesService.documentosCertificado.length > 0;
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
    if (this.activeStep === 'input') this.activeStep = 'personal';
    else if (this.activeStep === 'results') this.activeStep = 'input';
    else if (this.activeStep === 'docs') this.activeStep = 'results';
    else if (this.activeStep === 'resumen') this.activeStep = 'docs';
  }
}
