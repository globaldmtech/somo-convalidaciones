import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import {
  AdminCicloModulo,
  AdminCicloConModulos,
  AdminConvalidacionRegla,
  AdminCreateConvalidacionesMasivasResponse,
  AdminDeleteConvalidacionesMasivasResponse,
  AdminFormulario,
  AdminUser,
  ConvalidacionesService,
} from '../services/convalidaciones.service';
import { CatalogService } from '../services/catalog.service';
import { Ciclo, Grado, Modulo } from '../models/catalog.models';
import { finalize, timeout } from 'rxjs/operators';

type AdminTab = 'formularios' | 'modulos' | 'convalidaciones' | 'administradores';
type AdminConvalidacionesView = 'destino' | 'multiple';
type AdminBusquedaOrigenTipo = 'modulos' | 'ciclos' | 'acreditaciones';

type AdminAlumnoGroup = {
  key: string;
  nombre: string;
  dni: string;
  email: string;
  formularios: AdminFormulario[];
};

type AdminCicloModulosGroup = {
  key: string;
  cicloId: number | null;
  cicloNombre: string;
  modulos: Array<{ id: number; nombre: string; codigo?: string | null; nota?: number | null; numerico?: number | null }>;
};

type AdminCicloSolicitudesGroup = {
  key: string;
  cicloNombre: string;
  solicitudes: Array<{
    id: number;
    idConvalidacion?: number | null;
    nombre: string;
    codigo?: string | null;
    esOtroNoRegistrado?: boolean;
    convalidadoPor?: string | null;
    convalidadoPorIds?: number[];
    nota_manual?: number | null;
    nota_media_origen?: number | null;
    estadoModuloId: number | null;
    estadoModulo: string | null;
  }>;
};

type AdminFamiliaGradosGroup = {
  key: string;
  familiaNombre: string;
  familiaId: number | null;
  ciclos: AdminCicloConModulos[];
};

type ModuloDraftRow = {
  id_oficial: string;
  nombre: string;
  numerico: number;
};

type AdminAcreditacionExternaGroup = {
  key: string;
  label: string;
  modulos: Array<AdminCicloModulo & { cicloNombre: string }>;
};

type AdminConvalidacionCicloAgrupado = {
  key: string;
  cicloOrigenNombre: string;
  esCicloCompleto: boolean;
  totalModulosNecesarios: number;
  modulosOrigen: Array<{ nombre: string; codigo: string | null }>;
  fuentes: Array<{ sourceLink: string | null; sourcePage: number | null }>;
  totalReglas: number;
  reglaIds: number[];
};

type AdminConvalidacionModuloAgrupado = {
  key: number;
  idModuloDestino: number;
  moduloDestinoNombre: string;
  moduloDestinoCodigo: string | null;
  cicloDestinoNombre: string;
  ciclosOrigen: AdminConvalidacionCicloAgrupado[];
};

type AdminConvalidacionOrigenEditable = {
  key: string;
  idConvalidacion: number;
  idModuloOrigen: number | null;
  moduloOrigenNombre: string | null;
  moduloOrigenCodigo: string | null;
  cicloOrigenNombre: string;
  esCicloCompleto: boolean;
};

type AdminBusquedaModuloResultado = {
  key: string;
  nombre: string;
  codigo: string | null;
  totalCiclos: number;
  ciclos: Array<{
    moduloId: number;
    moduloNombre: string;
    moduloCodigo: string | null;
    cicloId: number;
    cicloNombre: string;
    cicloCodigo: string | null;
    familiaNombre: string | null;
    gradoNombre: string | null;
  }>;
};

type AdminBusquedaModuloSeleccionItem = {
  origenTipo: 'modulo' | 'ciclo' | 'acreditacion_externa' | 'destino';
  moduloId: number | null;
  moduloNombre: string | null;
  moduloCodigo: string | null;
  cicloId: number;
  cicloNombre: string;
  gradoNombre: string | null;
  familiaNombre: string | null;
};

type AdminConvalidacionesMultiplesAction = 'crear' | 'eliminar';

type PendingConvalidacionOrigenDelete = {
  key: string;
  idConvalidacion: number;
  idModuloOrigen: number;
  moduloOrigenNombre: string;
  moduloOrigenCodigo: string | null;
};

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div #headerInner class="max-w-[1600px] mx-auto px-4 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-4 relative">
          <div #headerBrand class="flex items-center min-w-0">
            <div class="font-black text-lg tracking-tight uppercase shrink-0">SOMO <span class="text-indigo-600">CONVALIDACIONES</span></div>
          </div>
          <nav *ngIf="isAuthenticated && !useMenuTabs" class="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-6">
            <button
              type="button"
              class="px-0 py-1 text-sm font-semibold border-b-2 transition-colors"
              [ngClass]="tabClass('formularios')"
              (click)="setActiveTab('formularios')"
            >
              Formularios
            </button>
            <button
              type="button"
              class="px-0 py-1 text-sm font-semibold border-b-2 transition-colors"
              [ngClass]="tabClass('modulos')"
              (click)="setActiveTab('modulos')"
            >
              Modulos
            </button>
            <button
              type="button"
              class="px-0 py-1 text-sm font-semibold border-b-2 transition-colors"
              [ngClass]="tabClass('convalidaciones')"
              (click)="setActiveTab('convalidaciones')"
            >
              Convalidaciones
            </button>
            <button
              type="button"
              class="px-0 py-1 text-sm font-semibold border-b-2 transition-colors"
              [ngClass]="tabClass('administradores')"
              (click)="setActiveTab('administradores')"
            >
              Administradores
            </button>
          </nav>
          <div class="flex items-center gap-2">
            <span *ngIf="isAuthenticated" class="hidden lg:inline text-xs text-slate-500">
              {{ adminDisplayName }}
            </span>
            <button
              *ngIf="isAuthenticated && useMenuTabs"
              type="button"
              class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              (click)="toggleMenuTabs()"
              aria-label="Abrir menú"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <button
              *ngIf="isAuthenticated"
              type="button"
              class="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              (click)="logoutAdmin()"
            >
              Cerrar sesión
            </button>
          </div>

          <div *ngIf="isAuthenticated" class="absolute -left-[9999px] top-0 invisible pointer-events-none">
            <div #headerTabsMeasure class="flex items-center gap-6">
              <button type="button" class="px-0 py-1 text-sm font-semibold border-b-2">Formularios</button>
              <button type="button" class="px-0 py-1 text-sm font-semibold border-b-2">Modulos</button>
              <button type="button" class="px-0 py-1 text-sm font-semibold border-b-2">Convalidaciones</button>
              <button type="button" class="px-0 py-1 text-sm font-semibold border-b-2">Administradores</button>
            </div>
            <div #headerActionsMeasure class="mt-2 flex items-center gap-2">
              <span class="hidden lg:inline text-xs">{{ adminDisplayName }}</span>
              <button type="button" class="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border">Cerrar sesión</button>
            </div>
          </div>

          <div *ngIf="isAuthenticated && useMenuTabs && menuTabsOpen" class="absolute top-full right-4 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-lg p-2 z-20">
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
              [ngClass]="menuTabClass('formularios')"
              (click)="selectTabFromMenu('formularios')"
            >
              Formularios
            </button>
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
              [ngClass]="menuTabClass('modulos')"
              (click)="selectTabFromMenu('modulos')"
            >
              Modulos
            </button>
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
              [ngClass]="menuTabClass('convalidaciones')"
              (click)="selectTabFromMenu('convalidaciones')"
            >
              Convalidaciones
            </button>
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
              [ngClass]="menuTabClass('administradores')"
              (click)="selectTabFromMenu('administradores')"
            >
              Administradores
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <section *ngIf="!isAuthenticated" class="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 class="text-2xl font-black text-slate-900">Acceso Admin</h1>
          <p class="text-sm text-slate-500 mt-1">Inicia sesión para visualizar y gestionar formularios.</p>

          <form class="mt-5 space-y-4" (ngSubmit)="loginAdmin()">
            <div>
              <label class="text-xs font-semibold text-slate-600">Usuario</label>
              <input
                type="text"
                [(ngModel)]="adminNombre"
                name="adminNombre"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                placeholder="admin"
                autocomplete="username"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600">Contraseña</label>
              <input
                type="password"
                [(ngModel)]="adminPassword"
                name="adminPassword"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                placeholder="••••••••••"
                autocomplete="current-password"
              />
            </div>
            <button
              type="submit"
              class="w-full rounded-lg bg-indigo-600 text-white font-semibold text-sm py-2.5 hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              [disabled]="loginLoading"
            >
              {{ loginLoading ? 'Accediendo...' : 'Entrar' }}
            </button>
          </form>

          <p *ngIf="loginError" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {{ loginError }}
          </p>
        </section>

        <ng-container *ngIf="isAuthenticated">
          <section *ngIf="activeTab === 'formularios'">
            <div *ngIf="formularioEstadoFiltro !== 3; else archivadasHeader" class="mb-3 flex items-start justify-between gap-3 flex-wrap">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                  [ngClass]="formularioEstadoFiltro === 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                  (click)="setFormularioEstadoFiltro(0)"
                >
                  En revisión{{ formularioEstadoFiltro === 0 && !loading ? ' (' + countFormulariosByEstado(0) + ')' : '' }}
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                  [ngClass]="formularioEstadoFiltro === 1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                  (click)="setFormularioEstadoFiltro(1)"
                >
                  Validadas{{ formularioEstadoFiltro === 1 && !loading ? ' (' + countFormulariosByEstado(1) + ')' : '' }}
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                  [ngClass]="formularioEstadoFiltro === 2 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                  (click)="setFormularioEstadoFiltro(2)"
                >
                  Rechazadas{{ formularioEstadoFiltro === 2 && !loading ? ' (' + countFormulariosByEstado(2) + ')' : '' }}
                </button>
              </div>
              <div class="ml-auto flex flex-wrap justify-end gap-2">
                <button
                  *ngIf="formularioEstadoFiltro === 1"
                  type="button"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="formulariosFiltrados.length === 0"
                  (click)="exportarSolicitudesConvalidacion()"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"></path>
                  </svg>
                  Exportar solicitudes de convalidación
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                  [ngClass]="'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                  (click)="setFormularioEstadoFiltro(3)"
                >
                  Archivadas
                </button>
              </div>
            </div>
            <ng-template #archivadasHeader>
              <div class="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Formularios</p>
                    <h1 class="text-2xl font-black text-slate-900">Formularios archivados</h1>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                    (click)="volverDesdeArchivadas()"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Volver atrás
                  </button>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                    [ngClass]="archivadasEstadoFiltro === 3 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                    (click)="setArchivadasEstadoFiltro(3)"
                  >
                    Validadas{{ archivadasEstadoFiltro === 3 && !loading ? ' (' + countFormulariosArchivadosByEstado(3) + ')' : '' }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                    [ngClass]="archivadasEstadoFiltro === 4 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                    (click)="setArchivadasEstadoFiltro(4)"
                  >
                    Rechazadas{{ archivadasEstadoFiltro === 4 && !loading ? ' (' + countFormulariosArchivadosByEstado(4) + ')' : '' }}
                  </button>
                </div>
              </div>
            </ng-template>
            <div *ngIf="!loading && !error" class="mb-4 flex flex-wrap items-end gap-2">
              <label *ngIf="formularioEstadoFiltro === 3" class="min-w-[220px]">
                <span class="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Curso academico</span>
                <select
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  [ngModel]="cursoAcademicoFiltro"
                  (ngModelChange)="setCursoAcademicoFiltro($event)"
                  [disabled]="cursosAcademicosDisponibles.length === 0"
                >
                  <option *ngIf="cursosAcademicosDisponibles.length === 0" value="">---</option>
                  <option *ngFor="let curso of cursosAcademicosDisponibles" [ngValue]="curso">
                    {{ curso }}
                  </option>
                </select>
              </label>
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold leading-none text-slate-700">
                  {{ alumnosMostrados.length }} alumnos
                </span>
                <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold leading-none text-slate-700">
                  {{ formulariosMostrados.length }} formularios
                </span>
              </div>
            </div>

            <div *ngIf="loading" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cargando formularios...
            </div>
            <div *ngIf="!loading && error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ error }}
            </div>
            <div *ngIf="!loading && !error && alumnosMostrados.length === 0" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              No hay formularios para ese estado.
            </div>

            <div *ngIf="!loading && alumnosMostrados.length > 0" class="space-y-4">
              <article *ngFor="let alumno of alumnosMostrados; trackBy: trackByAlumno" class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  type="button"
                  class="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                  (click)="toggleAlumno(alumno.key)"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {{ getInitials(alumno.nombre) }}
                      </div>
                      <div class="min-w-0">
                        <h2 class="text-base font-bold text-slate-900 truncate">{{ alumno.nombre || 'Alumno sin nombre' }}</h2>
                        <p class="text-xs text-slate-500 truncate">DNI: {{ alumno.dni || '—' }} · {{ alumno.email || '—' }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {{ alumno.formularios.length }} formularios
                      </span>
                      <svg
                        class="w-5 h-5 text-slate-500 transition-transform"
                        [class.rotate-180]="isAlumnoOpen(alumno.key)"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </button>

                <div *ngIf="isAlumnoOpen(alumno.key)" class="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-4">
                  <section *ngFor="let f of alumno.formularios; trackBy: trackByFormulario" class="rounded-xl border border-slate-200 bg-white p-4">
                    <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 class="text-sm font-bold text-slate-900">Formulario #{{ f.id }}</h3>
                        <p class="text-xs text-slate-500">Enviado: {{ formatDate(f.enviado_at) }}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <span *ngIf="f.estado_id !== 0" class="px-2.5 py-1 rounded-full text-xs font-bold" [ngClass]="estadoClass(f.estado_id)">
                          {{ estadoLabel(f) }}
                        </span>
                        <button
                          *ngIf="canFormularioBackToRevision(f.estado_id)"
                          type="button"
                          class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          [disabled]="isFormularioUpdating(f.id)"
                          (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, 0, f.estado_id)"
                          title="Volver a revisión"
                          aria-label="Volver a revisión"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 109-9m0 0H8m4 0v4"></path>
                          </svg>
                        </button>
                        <div *ngIf="canFormularioValidateReject(f.estado_id)" class="flex items-center gap-1">
                          <button
                            type="button"
                            class="inline-flex items-center justify-center w-6 h-6 rounded border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            [disabled]="isFormularioUpdating(f.id)"
                            (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, 2, f.estado_id)"
                            title="Rechazar formulario"
                            aria-label="Rechazar formulario"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="inline-flex items-center justify-center w-6 h-6 rounded border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            [disabled]="isFormularioUpdating(f.id)"
                            (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, 1, f.estado_id)"
                            title="Validar formulario"
                            aria-label="Validar formulario"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <p *ngIf="isFormularioUpdating(f.id)" class="mb-2 text-[11px] text-slate-500 text-right">Guardando estado del formulario...</p>

                    <div class="space-y-4">
                      <div class="grid grid-cols-1 xl:grid-cols-[minmax(320px,0.95fr)_minmax(520px,1.55fr)] gap-4 p-1">
                        <div class="flex flex-col">
                          <div class="mb-2 bg-slate-100 border-l-4 border-indigo-600 px-3 py-2">
                            <p class="text-[11px] uppercase tracking-wider text-slate-500 font-bold">MÓDULOS APORTADOS</p>
                          </div>
                          <div class="space-y-2 xl:h-[616px]" *ngIf="getModulosPorCiclo(f).length > 0; else sinModulos">
                            <div *ngFor="let ciclo of getModulosPorCiclo(f)" class="rounded-md border border-slate-200 bg-white p-3 xl:h-full flex flex-col">
                              <button
                                type="button"
                                class="w-full text-left flex items-center justify-between gap-2"
                                (click)="toggleCiclo(f.id, ciclo.key)"
                              >
                                <p class="text-sm font-semibold text-slate-700">{{ ciclo.cicloNombre }}</p>
                                <div class="flex items-center gap-2">
                                  <span *ngIf="getNotaMediaCiclo(ciclo) !== null" class="text-xs font-semibold text-indigo-700">
                                    Nota media ciclo: {{ getNotaMediaCiclo(ciclo) | number:'1.0-2' }}
                                  </span>
                                  <span class="text-xs text-slate-500">{{ ciclo.modulos.length }} módulos</span>
                                  <svg
                                    class="w-4 h-4 text-slate-500 transition-transform"
                                    [class.rotate-180]="isCicloOpen(f.id, ciclo.key)"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </div>
                              </button>
                              <ul *ngIf="isCicloOpen(f.id, ciclo.key)" class="mt-3 xl:flex-1 overflow-y-auto pr-1 max-h-[560px] xl:max-h-none">
                                <li
                                  *ngFor="let modulo of ciclo.modulos"
                                  class="text-sm text-slate-700 py-1.5 border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-2"
                                >
                                  <span>{{ modulo.nombre }}</span>
                                  <span *ngIf="getEtiquetaNotaModuloAdmin(modulo) as etiqueta" class="text-xs font-semibold text-indigo-700 whitespace-nowrap">
                                    {{ etiqueta }}
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                          <ng-template #sinModulos>
                            <p class="text-sm text-slate-500">Sin módulos aportados.</p>
                          </ng-template>
                        </div>

                        <div>
                          <div class="mb-2 flex items-center justify-between gap-2 bg-slate-100 border-l-4 border-indigo-600 px-3 py-2">
                            <p class="text-[11px] uppercase tracking-wider text-slate-500 font-bold">DOCUMENTOS APORTADOS</p>
                            <span class="text-xs text-slate-500 font-semibold">
                              {{ (f.documentos_aportados || []).length }} documentos
                            </span>
                          </div>
                          <div class="rounded-md border border-slate-200 bg-white overflow-hidden">
                            <div *ngIf="(f.documentos_aportados || []).length > 0; else sinDocumentosAportados" class="flex flex-col">
                              <div class="border-b border-slate-200 bg-slate-50 p-2">
                                <div class="flex items-start gap-2">
                                  <div class="min-w-0 flex-1">
                                    <div class="flex flex-wrap items-center gap-1.5">
                                      <button
                                        *ngFor="let documento of f.documentos_aportados; let i = index"
                                        type="button"
                                        class="inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm transition-colors"
                                        [ngClass]="isDocumentoPreviewSelected(f.id, documento.ruta_almacenamiento)
                                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'"
                                        (click)="seleccionarDocumentoPreview(f.id, documento.ruta_almacenamiento)"
                                      >
                                        <span class="block">
                                          {{ getDocumentoDisplayName(documento, i) }}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                  <div class="shrink-0 flex items-center gap-1">
                                    <button
                                      type="button"
                                      class="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-indigo-700 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      [disabled]="!getDocumentoPreviewSeleccionado(f)"
                                      (click)="abrirDocumentoPreviewSeleccionado(f)"
                                      title="Abrir documento seleccionado"
                                      aria-label="Abrir documento seleccionado"
                                    >
                                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 3h7m0 0v7m0-7L10 14"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5h6M5 5v14h14v-6"></path>
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      class="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-indigo-700 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      [disabled]="!getDocumentoPreviewSeleccionado(f)"
                                      (click)="descargarDocumentoPreviewSeleccionado(f)"
                                      title="Descargar documento seleccionado"
                                      aria-label="Descargar documento seleccionado"
                                    >
                                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"></path>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div class="relative h-[560px] bg-slate-50">
                                <iframe
                                  [attr.id]="getDocumentoPreviewFrameId(f.id)"
                                  class="w-full h-full bg-white"
                                  [class.hidden]="!hasDocumentoPreviewUrl(f.id)"
                                  title="Vista previa del documento aportado"
                                ></iframe>
                                <div *ngIf="isDocumentoPreviewLoading(f.id)" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 bg-slate-50/90">
                                  Cargando documento...
                                </div>
                                <div *ngIf="!isDocumentoPreviewLoading(f.id) && getDocumentoPreviewError(f.id) as previewError" class="absolute inset-0 flex items-center justify-center px-4 text-sm text-rose-600 text-center bg-slate-50/90">
                                  {{ previewError }}
                                </div>
                                <div *ngIf="!isDocumentoPreviewLoading(f.id) && !getDocumentoPreviewError(f.id) && !hasDocumentoPreviewUrl(f.id)" class="absolute inset-0 flex items-center justify-center px-4 text-sm text-slate-500 text-center">
                                  Selecciona un documento para visualizarlo.
                                </div>
                              </div>
                            </div>
                            <ng-template #sinDocumentosAportados>
                              <div class="p-4 text-sm text-slate-500">Sin documentos aportados.</div>
                            </ng-template>
                          </div>
                        </div>
                      </div>

                      <div class="p-1">
                        <div class="mb-2 flex items-center justify-between gap-2 bg-slate-100 border-l-4 border-indigo-600 px-3 py-2">
                          <p class="text-[11px] uppercase tracking-wider text-slate-500 font-bold">SOLICITUDES</p>
                          <span class="text-xs text-slate-500 font-semibold">
                            {{ (f.solicitudes || []).length }} módulos
                          </span>
                        </div>
                        <div class="space-y-2" *ngIf="getSolicitudesPorCiclo(f).length > 0; else sinSolicitudes">
                          <div
                            *ngFor="let ciclo of getSolicitudesPorCiclo(f)"
                            class="py-1"
                            [ngClass]="isOtrosNoRegistrados(ciclo.cicloNombre) ? 'mt-2 pt-1' : ''"
                          >
                            <p class="text-sm font-semibold text-slate-700 mb-2">
                              {{ isOtrosNoRegistrados(ciclo.cicloNombre) ? 'Otros no registrados' : ciclo.cicloNombre }}
                            </p>
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
                              <div class="rounded-md border border-slate-200 bg-slate-50/30 p-2">
                                <p class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold pb-1 mb-2 border-b border-indigo-500">En revisión</p>
                                <ul>
                                  <li
                                    *ngFor="let solicitud of getSolicitudesEnRevision(ciclo); let i = index; let items = ngForOf"
                                    class="px-1 py-2 text-sm text-slate-700"
                                    [ngClass]="
                                      isFirstOtrosInList(items, i)
                                        ? 'pt-3 border-t-2 border-dashed border-slate-500'
                                        : (i > 0 ? 'border-t border-slate-200/80' : '')
                                    "
                                  >
                                    <div class="flex items-start justify-between gap-2">
                                      <div class="min-w-0">
                                        <p class="font-medium">{{ solicitud.nombre }}</p>
                                        <p *ngIf="solicitud.codigo || solicitud.esOtroNoRegistrado" class="text-[11px] text-slate-500 mt-0.5">
                                          {{ solicitud.codigo || '(otros no registrados)' }}
                                        </p>
                                        <ng-container *ngIf="solicitud.convalidadoPor as convalidadoPor">
                                          <details
                                            *ngIf="debeMostrarDesplegableConvalidadoPor(convalidadoPor); else convalidadoSimpleRevision"
                                            class="mt-0.5 text-[11px] text-slate-500"
                                          >
                                            <summary class="italic cursor-pointer select-none">
                                              Convalidado por: Ciclo completo
                                            </summary>
                                            <p class="mt-1 whitespace-pre-line">
                                              {{ getConvalidadoPorConNota(f, solicitud).join('\n') }}
                                            </p>
                                          </details>
                                          <ng-template #convalidadoSimpleRevision>
                                            <p class="text-[11px] italic text-slate-500 mt-0.5">
                                              Convalidado por: {{ getConvalidadoPorConNota(f, solicitud).join(', ') }}
                                            </p>
                                          </ng-template>
                                        </ng-container>
                                      </div>
                                      <div *ngIf="f.estado_id === 0" class="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          class="inline-flex items-center justify-center w-6 h-6 rounded border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                          [disabled]="isSolicitudUpdating(solicitud.id)"
                                          (click)="actualizarEstadoSolicitud(f.id, solicitud.id, 2)"
                                          title="Rechazar"
                                          aria-label="Rechazar"
                                        >
                                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          class="inline-flex items-center justify-center w-6 h-6 rounded border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                          [disabled]="isSolicitudUpdating(solicitud.id)"
                                          (click)="solicitarValidacionSolicitud(f, solicitud)"
                                          title="Validar"
                                          aria-label="Validar"
                                        >
                                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                    <p *ngIf="isSolicitudUpdating(solicitud.id)" class="mt-1 text-[11px] text-slate-500 text-right">Guardando...</p>
                                  </li>
                                </ul>
                              </div>

                              <div class="rounded-md border border-slate-200 bg-slate-50/30 p-2">
                                <p class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold pb-1 mb-2 border-b border-indigo-500">Validadas</p>
                                <ul>
                                  <li
                                    *ngFor="let solicitud of getSolicitudesValidadas(ciclo); let i = index; let items = ngForOf"
                                    class="px-1 py-2 text-sm text-slate-700"
                                    [ngClass]="
                                      isFirstOtrosInList(items, i)
                                        ? 'pt-3 border-t-2 border-dashed border-slate-500'
                                        : (i > 0 ? 'border-t border-slate-200/80' : '')
                                    "
                                  >
                                    <div class="flex items-start justify-between gap-2">
                                      <div class="min-w-0">
                                        <p class="font-medium">{{ solicitud.nombre }}</p>
                                        <p *ngIf="solicitud.codigo || solicitud.esOtroNoRegistrado" class="text-[11px] text-slate-500 mt-0.5">
                                          {{ solicitud.codigo || '(otros no registrados)' }}
                                        </p>
                                        <ng-container *ngIf="solicitud.convalidadoPor as convalidadoPor; else notaManualValidada">
                                          <details
                                            *ngIf="debeMostrarDesplegableConvalidadoPor(convalidadoPor); else convalidadoSimpleValidadas"
                                            class="mt-0.5 text-[11px] text-slate-500"
                                          >
                                            <summary class="italic cursor-pointer select-none">
                                              Convalidado por: Ciclo completo
                                            </summary>
                                            <p class="mt-1 whitespace-pre-line">
                                              {{ getConvalidadoPorConNota(f, solicitud).join('\n') }}
                                            </p>
                                          </details>
                                          <ng-template #convalidadoSimpleValidadas>
                                            <p class="text-[11px] italic text-slate-500 mt-0.5">
                                              Convalidado por: {{ getConvalidadoPorConNota(f, solicitud).join(', ') }}
                                            </p>
                                          </ng-template>
                                        </ng-container>
                                        <ng-template #notaManualValidada>
                                          <p *ngIf="solicitud.nota_manual !== null && solicitud.nota_manual !== undefined" class="text-[11px] italic text-slate-500 mt-0.5">
                                            Nota del módulo convalidado: {{ getConvalidadoPorConNota(f, solicitud).join(', ') }}
                                          </p>
                                        </ng-template>
                                        <p *ngIf="getNotaConvalidadaRedondeada(solicitud.nota_media_origen) !== null" class="text-[11px] italic text-slate-500 mt-0.5">
                                          Nota convalidada: {{ getNotaConvalidadaRedondeada(solicitud.nota_media_origen) }}
                                        </p>
                                      </div>
                                      <button
                                        *ngIf="f.estado_id === 0"
                                        type="button"
                                        class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                                        [disabled]="isSolicitudUpdating(solicitud.id)"
                                        (click)="actualizarEstadoSolicitud(f.id, solicitud.id, 0)"
                                        title="Volver a en revisión"
                                        aria-label="Volver a en revisión"
                                      >
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 109-9m0 0H8m4 0v4"></path>
                                        </svg>
                                      </button>
                                    </div>
                                    <p *ngIf="isSolicitudUpdating(solicitud.id)" class="mt-1 text-[11px] text-slate-500 text-right">Guardando...</p>
                                  </li>
                                </ul>
                              </div>

                              <div class="rounded-md border border-slate-200 bg-slate-50/30 p-2">
                                <p class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold pb-1 mb-2 border-b border-indigo-500">Rechazadas</p>
                                <ul>
                                  <li
                                    *ngFor="let solicitud of getSolicitudesRechazadas(ciclo); let i = index; let items = ngForOf"
                                    class="px-1 py-2 text-sm text-slate-700"
                                    [ngClass]="
                                      isFirstOtrosInList(items, i)
                                        ? 'pt-3 border-t-2 border-dashed border-slate-500'
                                        : (i > 0 ? 'border-t border-slate-200/80' : '')
                                    "
                                  >
                                    <div class="flex items-start justify-between gap-2">
                                      <div class="min-w-0">
                                        <p class="font-medium">{{ solicitud.nombre }}</p>
                                        <p *ngIf="solicitud.codigo || solicitud.esOtroNoRegistrado" class="text-[11px] text-slate-500 mt-0.5">
                                          {{ solicitud.codigo || '(otros no registrados)' }}
                                        </p>
                                        <ng-container *ngIf="solicitud.convalidadoPor as convalidadoPor">
                                          <details
                                            *ngIf="debeMostrarDesplegableConvalidadoPor(convalidadoPor); else convalidadoSimpleRechazadas"
                                            class="mt-0.5 text-[11px] text-slate-500"
                                          >
                                            <summary class="italic cursor-pointer select-none">
                                              Convalidado por: Ciclo completo
                                            </summary>
                                            <p class="mt-1 whitespace-pre-line">
                                              {{ getConvalidadoPorConNota(f, solicitud).join('\n') }}
                                            </p>
                                          </details>
                                        <ng-template #convalidadoSimpleRechazadas>
                                          <p class="text-[11px] italic text-slate-500 mt-0.5">
                                            Convalidado por: {{ getConvalidadoPorConNota(f, solicitud).join(', ') }}
                                          </p>
                                        </ng-template>
                                        </ng-container>
                                        <p *ngIf="getNotaConvalidadaRedondeada(solicitud.nota_media_origen) !== null" class="text-[11px] italic text-slate-500 mt-0.5">
                                          Nota convalidada: {{ getNotaConvalidadaRedondeada(solicitud.nota_media_origen) }}
                                        </p>
                                      </div>
                                      <button
                                        *ngIf="f.estado_id === 0"
                                        type="button"
                                        class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                                        [disabled]="isSolicitudUpdating(solicitud.id)"
                                        (click)="actualizarEstadoSolicitud(f.id, solicitud.id, 0)"
                                        title="Volver a en revisión"
                                        aria-label="Volver a en revisión"
                                      >
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 109-9m0 0H8m4 0v4"></path>
                                        </svg>
                                      </button>
                                    </div>
                                    <p *ngIf="isSolicitudUpdating(solicitud.id)" class="mt-1 text-[11px] text-slate-500 text-right">Guardando...</p>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ng-template #sinSolicitudes>
                          <p class="text-sm text-slate-500">Sin solicitudes asociadas.</p>
                        </ng-template>
                      </div>

                      <div class="flex flex-wrap justify-end gap-2 pt-1">
                        <button
                          *ngIf="canFormularioDelete(f.estado_id)"
                          type="button"
                          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          [disabled]="isFormularioDeleting(f.id)"
                          (click)="abrirModalEliminarFormulario(f, alumno.nombre)"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"></path>
                          </svg>
                          {{ isFormularioDeleting(f.id) ? 'Eliminando...' : 'Eliminar' }}
                        </button>
                        <button
                          *ngIf="canFormularioUnarchive(f.estado_id)"
                          type="button"
                          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          [disabled]="isFormularioUpdating(f.id)"
                          (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, getUnarchiveEstadoObjetivo(f.estado_id), f.estado_id)"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                          </svg>
                          Desarchivar
                        </button>
                        <button
                          *ngIf="canFormularioArchive(f.estado_id)"
                          type="button"
                          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          [disabled]="isFormularioUpdating(f.id)"
                          (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, getArchiveEstadoObjetivo(f.estado_id), f.estado_id)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                          </svg>
                          Archivar
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </article>
            </div>
          </section>

          <section *ngIf="activeTab === 'modulos'" class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                [ngClass]="modulosVistaActiva === 'ciclos' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                (click)="modulosVistaActiva = 'ciclos'"
              >
                Ciclos
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                [ngClass]="modulosVistaActiva === 'acreditaciones' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                (click)="modulosVistaActiva = 'acreditaciones'"
              >
                Acreditaciones externas
              </button>
            </div>

            <div *ngIf="modulosVistaActiva === 'acreditaciones'">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="!acreditacionExternaCiclo"
                (click)="abrirModalCrearAcreditacionExterna()"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
                Añadir titulo externo
              </button>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span *ngIf="modulosVistaActiva === 'ciclos'" class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {{ ciclosCatalogo.length }} ciclos
                  </span>
                  <span *ngIf="modulosVistaActiva === 'ciclos'" class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {{ totalModulosCatalogo }} modulos
                  </span>
                  <span *ngIf="modulosVistaActiva === 'acreditaciones'" class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {{ modulosAcreditacionesExternas.length }} titulos
                  </span>
                </div>

                <div *ngIf="modulosVistaActiva === 'ciclos'" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Familia</span>
                    <select
                      [(ngModel)]="filtroFamiliaModulos"
                      class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    >
                      <option value="">Todas las familias</option>
                      <option *ngFor="let familia of familiasFiltroModulos" [value]="familia">{{ familia }}</option>
                    </select>
                  </label>

                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Grado</span>
                    <select
                      [(ngModel)]="filtroGradoModulos"
                      class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    >
                      <option value="">Todos los grados</option>
                      <option *ngFor="let grado of gradosFiltroModulos" [value]="grado">{{ grado }}</option>
                    </select>
                  </label>

                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Ciclo</span>
                    <select
                      [(ngModel)]="filtroCicloModulos"
                      class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    >
                      <option value="">Todos los ciclos</option>
                      <option *ngFor="let ciclo of ciclosFiltroModulos" [value]="ciclo.nombre">{{ ciclo.nombre }}</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div *ngIf="loadingModulos" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cargando ciclos y modulos...
            </div>
            <div *ngIf="!loadingModulos && errorModulos" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ errorModulos }}
            </div>
            <div *ngIf="!loadingModulos && !errorModulos && modulosVistaActiva === 'ciclos' && ciclosConModulosFiltrados.length === 0" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              No hay resultados para el filtro aplicado.
            </div>
            <div *ngIf="!loadingModulos && !errorModulos && modulosVistaActiva === 'acreditaciones' && modulosAcreditacionesExternas.length === 0" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              No hay acreditaciones externas disponibles.
            </div>

            <div *ngIf="modulosVistaActiva === 'ciclos'" class="space-y-5">
              <section *ngFor="let familia of ciclosModulosAgrupados" class="space-y-3">
                <div class="bg-slate-100 border-l-4 border-indigo-600 px-3 py-2">
                  <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {{ familia.familiaNombre }}
                  </h2>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  (click)="abrirModalCrearCiclo(familia.familiaId)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                  </svg>
                  Añadir ciclo
                </button>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <article
                    *ngFor="let ciclo of familia.ciclos"
                    class="group rounded-xl border border-slate-200 bg-white shadow-sm p-4 min-h-[172px] flex flex-col transition-colors hover:border-slate-300 hover:bg-slate-50/40 cursor-pointer"
                    (click)="abrirModalModulos(ciclo)"
                  >
                    <div class="mb-3">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                          {{ ciclo.grado_nombre || 'Sin grado' }}
                        </p>
                        <h4 class="text-sm font-bold text-slate-900 leading-5 line-clamp-2">{{ ciclo.nombre }}</h4>
                        <p class="text-xs text-slate-500 mt-1">{{ ciclo.total_modulos }} modulos</p>
                      </div>
                    </div>

                    <div class="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between gap-3 rounded-b-lg transition-colors">
                      <div class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
                        <span class="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 transition-colors hover:bg-indigo-100">
                          Mostrar modulos
                        </span>
                      </div>

                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-indigo-600 transition-colors"
                          (click)="$event.stopPropagation(); editarCiclo(ciclo)"
                          title="Editar ciclo"
                          aria-label="Editar ciclo"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L12 14l-4 1 1-4 7.5-7.5z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-rose-600 transition-colors"
                          (click)="$event.stopPropagation(); eliminarCiclo(ciclo)"
                          title="Eliminar ciclo"
                          aria-label="Eliminar ciclo"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </div>

            <div *ngIf="!loadingModulos && !errorModulos && modulosVistaActiva === 'acreditaciones'" class="space-y-4">
              <section *ngFor="let grupo of acreditacionesExternasAgrupadas" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-bold text-slate-900">{{ grupo.label }}</p>
                    <span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                      {{ grupo.modulos.length }} {{ grupo.modulos.length === 1 ? 'titulo' : 'titulos' }}
                    </span>
                  </div>
                </div>
                <ul class="divide-y divide-slate-100">
                  <li *ngFor="let modulo of grupo.modulos" class="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                    <p class="text-sm font-semibold text-slate-900 leading-5 flex-1">{{ modulo.nombre }}</p>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      [disabled]="deletingModulos.has(modulo.id)"
                      (click)="abrirModalEliminarModulo(modulo.id, modulo.nombre, modulo.cicloNombre, true)"
                      title="Eliminar módulo"
                      aria-label="Eliminar módulo"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V5a1 1 0 011-1h6a1 1 0 011 1v2m-9 0h10"></path>
                      </svg>
                    </button>
                  </li>
                </ul>
              </section>
            </div>
          </section>

          <section *ngIf="activeTab === 'convalidaciones'" class="space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <div class="inline-flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  [ngClass]="convalidacionesView === 'destino'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'"
                  (click)="setConvalidacionesView('destino')"
                >
                  Convalidaciones por destino
                </button>
                <button
                  type="button"
                  class="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  [ngClass]="convalidacionesView === 'multiple'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'"
                  (click)="setConvalidacionesView('multiple')"
                >
                  Edición multiples convalidaciones
                </button>
              </div>
            </div>

            <ng-container *ngIf="convalidacionesView === 'destino'">
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Grado destino</label>
                  <select
                    [(ngModel)]="filtroConvalidacionesGradoId"
                    (change)="onFiltroConvalidacionesGradoChange()"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    [disabled]="loadingConvalidacionesGrados"
                  >
                    <option [ngValue]="null">Todos los grados</option>
                    <option *ngFor="let grado of convalidacionesGrados" [ngValue]="grado.id">
                      {{ grado.nombre }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Ciclo destino</label>
                  <select
                    [(ngModel)]="filtroConvalidacionesCicloId"
                    (change)="onFiltroConvalidacionesCicloChange()"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    [disabled]="loadingConvalidacionesCiclos"
                  >
                    <option [ngValue]="null">Todos los ciclos</option>
                    <option *ngFor="let ciclo of convalidacionesCiclos" [ngValue]="ciclo.id">
                      {{ ciclo.nombre }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-3 justify-between">
                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {{ convalidacionesAgrupadas.length }} modulos
                </span>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  (click)="limpiarFiltroConvalidaciones()"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            <div *ngIf="loadingConvalidaciones" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cargando reglas de convalidacion...
            </div>
            <div *ngIf="!loadingConvalidaciones && errorConvalidaciones" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ errorConvalidaciones }}
            </div>
            <div *ngIf="!loadingConvalidaciones && !errorConvalidaciones && !hasConvalidacionesFiltroAplicado" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Selecciona ciclo destino para cargar las reglas de convalidacion.
            </div>
            <div *ngIf="!loadingConvalidaciones && !errorConvalidaciones && hasConvalidacionesFiltroAplicado && convalidacionesAgrupadas.length === 0" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              No hay resultados para el filtro aplicado.
            </div>
            <div *ngIf="!loadingConvalidaciones && !errorConvalidaciones && hasConvalidacionesFiltroAplicado" class="px-1">
              <div class="bg-indigo-50/70 border-l-4 border-indigo-500 rounded-r-xl pl-3 py-2 shadow-sm">
                <p class="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Reglas de convalidacion</p>
                <p class="text-[13px] uppercase tracking-wider font-semibold text-slate-500 mt-1">
                  {{ cicloConvalidacionesSeleccionadoNombre }}
                </p>
              </div>
              <button
                type="button"
                class="mt-3 inline-flex items-center text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
                (click)="abrirModalCrearConvalidacion()"
              >
                + Añadir regla de convalidación
              </button>
            </div>

            <article *ngFor="let grupo of convalidacionesAgrupadas" class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                class="w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                (click)="toggleConvalidacion(grupo.idModuloDestino)"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-[11px] uppercase tracking-wide font-bold text-indigo-700">Formación a convalidar</p>
                    <h2 class="text-sm font-bold text-slate-900 truncate">
                      <span *ngIf="grupo.moduloDestinoCodigo" class="text-slate-500">{{ grupo.moduloDestinoCodigo }} · </span>{{ grupo.moduloDestinoNombre }}
                    </h2>
                    <p class="text-xs text-slate-500">{{ grupo.cicloDestinoNombre }}</p>
                  </div>
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {{ grupo.ciclosOrigen.length }} reglas de convalidacion
                  </span>
                </div>
              </button>

              <div *ngIf="isConvalidacionOpen(grupo.idModuloDestino)" class="border-t border-slate-100 px-5 py-3">
                <p class="mb-3 text-[11px] uppercase tracking-wide font-bold text-indigo-700">
                  Formación aportada
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <article *ngFor="let ciclo of grupo.ciclosOrigen" class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div class="flex items-start gap-2 px-4 py-3">
                      <button
                        type="button"
                        class="flex-1 text-left hover:bg-slate-50 transition-colors rounded-md -ml-1 px-1 py-0.5"
                        (click)="toggleConvalidacionCiclo(ciclo.key)"
                      >
                        <div class="min-w-0">
                          <p class="text-sm font-semibold text-slate-800 leading-5">{{ ciclo.cicloOrigenNombre }}</p>
                        </div>
                      </button>

                      <div class="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          class="flex items-center gap-1 hover:bg-slate-50 rounded-md px-1 py-0.5 transition-colors"
                          (click)="toggleConvalidacionCiclo(ciclo.key)"
                        >
                          <span class="inline-flex text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                            {{ ciclo.esCicloCompleto ? 'Ciclo completo' : (ciclo.totalModulosNecesarios + ' modulos') }}
                          </span>
                          <span
                            class="inline-flex items-center justify-center w-5 h-5 text-slate-400 transition-transform"
                            [class.rotate-180]="!isConvalidacionCicloOpen(ciclo.key)"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 15l6-6 6 6"></path>
                            </svg>
                          </span>
                        </button>
                        <div class="flex items-center gap-1">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-indigo-600 transition-colors"
                          (click)="editarConvalidacionCiclo(grupo, ciclo, $event)"
                          title="Editar opcion de convalidacion"
                          aria-label="Editar opcion de convalidacion"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L12 14l-4 1 1-4 7.5-7.5z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          (click)="eliminarConvalidacionCiclo(grupo, ciclo, $event)"
                          title="Eliminar opcion de convalidacion"
                          aria-label="Eliminar opcion de convalidacion"
                          [disabled]="deletingConvalidacionCiclos.has(ciclo.key)"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"></path>
                          </svg>
                        </button>
                        </div>
                      </div>
                    </div>

                    <div *ngIf="isConvalidacionCicloOpen(ciclo.key)" class="border-t border-slate-100 px-4 py-3 bg-slate-50">
                      <p class="text-[11px] uppercase tracking-wide font-semibold text-slate-500">Origen de la regla</p>
                      <ul class="mt-1.5 mb-3 space-y-1 text-xs text-slate-600">
                        <li *ngFor="let fuente of ciclo.fuentes">
                          <span class="font-semibold text-slate-700">URL:</span>
                          <ng-container *ngIf="fuente.sourceLink; else sinUrlFuente">
                            <a
                              [href]="buildFuenteUrl(fuente.sourceLink, fuente.sourcePage)"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="text-indigo-700 hover:text-indigo-800 underline break-all"
                            >
                              {{ fuente.sourceLink }}
                            </a>
                          </ng-container>
                          <ng-template #sinUrlFuente>
                            <span class="italic text-slate-500">sin URL</span>
                          </ng-template>
                          <span class="ml-2">
                            <span class="font-semibold text-slate-700">Página:</span>
                            <span>{{ getDocumentoPage(fuente.sourcePage, fuente.sourceLink) ?? 'sin página' }}</span>
                          </span>
                        </li>
                      </ul>
                      <p class="text-[11px] uppercase tracking-wide font-semibold text-indigo-700 mb-1.5">
                        {{ ciclo.esCicloCompleto ? 'Formación aportada' : 'Módulos aportados' }}
                      </p>
                      <p *ngIf="ciclo.esCicloCompleto" class="text-sm text-slate-700 leading-5">Ciclo completo</p>
                      <ul *ngIf="!ciclo.esCicloCompleto" class="space-y-1.5">
                        <li *ngFor="let modulo of ciclo.modulosOrigen" class="text-sm text-slate-700 leading-5">
                          <span *ngIf="modulo.codigo" class="text-slate-500">{{ modulo.codigo }} · </span>{{ modulo.nombre }}
                        </li>
                      </ul>
                    </div>
                  </article>
                </div>
              </div>
            </article>
            </ng-container>

            <ng-container *ngIf="convalidacionesView === 'multiple'">
              <div *ngIf="loadingModulos" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Cargando ciclos y modulos...
              </div>
              <div *ngIf="!loadingModulos && errorModulos" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {{ errorModulos }}
              </div>

              <div *ngIf="!loadingModulos && !errorModulos" class="space-y-4">
                <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-4">
                  <div>
                    <p class="text-[11px] uppercase tracking-wide font-bold text-indigo-700">Crear reglas de convalidación</p>
                    <p class="mt-1 text-sm text-slate-500">
                      Selecciona orígenes y módulos destino para crear o eliminar reglas en bloque.
                    </p>
                  </div>

                  <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Origen</p>
                        <p class="mt-1 text-sm font-semibold text-slate-900">
                          {{ totalBusquedaModuloOrigenSeleccionados }} orígenes seleccionados
                        </p>
                      </div>
                      <button
                        type="button"
                        class="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        (click)="abrirModalBusquedaOrigen()"
                      >
                        Seleccionar
                      </button>
                    </div>
                    <div *ngIf="selectedBusquedaModuloOrigenItems.length > 0; else sinOrigenSeleccionado" class="mt-2 max-h-40 overflow-y-auto pr-1 space-y-1">
                      <p *ngFor="let item of selectedBusquedaModuloOrigenItems" class="text-xs text-slate-600">
                        {{ formatBusquedaModuloSeleccionItem(item) }}
                      </p>
                    </div>
                    <ng-template #sinOrigenSeleccionado>
                      <p class="mt-2 text-xs text-slate-500">Todavía no has seleccionado orígenes.</p>
                    </ng-template>
                  </div>

                  <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Destino</p>
                        <p class="mt-1 text-sm font-semibold text-slate-900">
                          {{ totalBusquedaModuloDestinoSeleccionados }} módulos seleccionados
                        </p>
                      </div>
                      <button
                        type="button"
                        class="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        (click)="abrirModalBusquedaDestino()"
                      >
                        Seleccionar
                      </button>
                    </div>
                    <div *ngIf="selectedBusquedaModuloDestinoItems.length > 0; else sinDestinoSeleccionado" class="mt-2 max-h-40 overflow-y-auto pr-1 space-y-1">
                      <p *ngFor="let item of selectedBusquedaModuloDestinoItems" class="text-xs text-slate-600">
                        {{ formatBusquedaModuloSeleccionItem(item) }}
                      </p>
                    </div>
                    <ng-template #sinDestinoSeleccionado>
                      <p class="mt-2 text-xs text-slate-500">Todavía no has seleccionado módulos de destino.</p>
                    </ng-template>
                  </div>

                  <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Fuente</p>
                    <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-slate-600">URL</span>
                        <input
                          type="url"
                          [(ngModel)]="createMultipleConvalidacionesSourceLink"
                          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                          placeholder="https://..."
                        />
                      </label>
                      <label class="flex flex-col gap-1">
                        <span class="text-xs font-semibold text-slate-600">Página</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          [(ngModel)]="createMultipleConvalidacionesSourcePage"
                          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                          placeholder="Ej. 147"
                        />
                      </label>
                    </div>
                  </div>

                  <div class="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3">
                    <p class="text-sm font-semibold text-indigo-900">Resumen</p>
                    <p class="mt-1 text-xs text-indigo-800">
                      Se procesarán {{ totalCombinacionesConvalidacionMultiples }} reglas:
                      cada origen seleccionado con cada módulo de destino.
                    </p>
                  </div>

                  <p *ngIf="createMultipleConvalidacionesError" class="text-sm text-rose-700">{{ createMultipleConvalidacionesError }}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      class="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 bg-indigo-600 hover:bg-indigo-700"
                      [disabled]="!canCrearConvalidacionesMultiples || creatingMultipleConvalidaciones"
                      (click)="setConvalidacionesMultiplesAction('crear'); crearConvalidacionesMultiples()"
                    >
                      {{ creatingMultipleConvalidaciones && convalidacionesMultiplesAction === 'crear'
                        ? 'Creando reglas...'
                        : 'Crear reglas de convalidación' }}
                    </button>
                    <button
                      type="button"
                      class="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 bg-slate-600 hover:bg-slate-700"
                      [disabled]="!canCrearConvalidacionesMultiples || creatingMultipleConvalidaciones"
                      (click)="abrirModalEliminarConvalidacionesMultiples()"
                    >
                      {{ creatingMultipleConvalidaciones && convalidacionesMultiplesAction === 'eliminar'
                        ? 'Eliminando reglas...'
                        : 'Eliminar reglas de convalidación' }}
                    </button>
                  </div>
                </section>

              </div>
            </ng-container>
          </section>

          <section *ngIf="activeTab === 'administradores'" class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="flex flex-wrap items-start gap-3 justify-between">
                <div>
                  <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    {{ administradores.length }} administradores
                  </span>
                </div>
                <input
                  type="text"
                  [(ngModel)]="filtroAdministradores"
                  class="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Filtrar por nombre"
                />
              </div>
            </div>
            <div *ngIf="isRootAdminSession" class="px-1">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                [disabled]="creatingAdmin"
                (click)="abrirModalCrearAdministrador()"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
                Añadir administrador
              </button>
            </div>

            <div *ngIf="loadingAdministradores" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cargando administradores...
            </div>
            <div *ngIf="!loadingAdministradores && errorAdministradores" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ errorAdministradores }}
            </div>
            <div *ngIf="!loadingAdministradores && !errorAdministradores && administradoresFiltrados.length === 0" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              No hay administradores para el filtro aplicado.
            </div>

            <div *ngIf="!loadingAdministradores && !errorAdministradores && administradoresFiltrados.length > 0" class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table class="w-full table-fixed text-sm">
                <colgroup>
                  <col class="w-[36%]" />
                  <col class="w-[34%]" />
                  <col class="w-[30%]" />
                </colgroup>
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="text-left px-4 py-2.5 font-semibold text-slate-600">Nombre</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-slate-600">Creado</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let admin of administradoresFiltrados" class="border-b border-slate-100 last:border-b-0">
                    <td class="px-4 py-2.5 font-medium text-slate-800">{{ admin.nombre }}</td>
                    <td class="px-4 py-2.5 text-slate-600">{{ formatDate(admin.created_at) }}</td>
                    <td class="px-4 py-2.5">
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-400 transition-colors disabled:opacity-100 disabled:cursor-not-allowed"
                          (click)="abrirModalEditarAdministrador(admin)"
                          title="Editar administrador"
                          aria-label="Editar administrador"
                          [disabled]="!canGestionarAdministrador(admin) || editingAdmin"
                          [ngClass]="{
                            'hover:text-indigo-600 text-slate-500': canGestionarAdministrador(admin),
                            'text-slate-300': !canGestionarAdministrador(admin)
                          }"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L12 14l-4 1 1-4 7.5-7.5z"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-400 transition-colors disabled:opacity-100 disabled:cursor-not-allowed"
                          (click)="abrirModalEliminarAdministrador(admin)"
                          title="Eliminar administrador"
                          aria-label="Eliminar administrador"
                          [disabled]="!canGestionarAdministrador(admin) || deletingAdmin"
                          [ngClass]="{
                            'hover:text-rose-600 text-slate-500': canGestionarAdministrador(admin),
                            'text-slate-300': !canGestionarAdministrador(admin)
                          }"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div *ngIf="confirmModalOpen" class="fixed inset-0 z-[100] bg-slate-900/40 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">{{ confirmModalTitulo }}</h3>
              <p class="mt-2 text-sm text-slate-600">{{ confirmModalDescripcion }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  (click)="cancelarConfirmacionFormulario()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border transition-colors"
                  [ngClass]="confirmEstadoObjetivo === 2
                    ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : (confirmEstadoObjetivo === 1
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'border-slate-300 text-slate-700 bg-slate-100 hover:bg-slate-200')"
                  (click)="confirmarValidacionFormulario()"
                >
                  {{ (confirmEstadoActual === 3 || confirmEstadoActual === 4) ? 'Desarchivar' : (confirmEstadoObjetivo === 2 ? 'Rechazar' : (confirmEstadoObjetivo === 1 ? 'Validar' : ((confirmEstadoObjetivo === 3 || confirmEstadoObjetivo === 4) ? 'Archivar' : 'Volver a revisión'))) }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="deleteFormularioModalOpen && formularioToDeleteId !== null" class="fixed inset-0 z-[101] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Eliminar formulario</h3>
              <p class="mt-2 text-sm text-slate-600">
                ¿Estás seguro de que quieres eliminar este formulario? Se borrarán también sus solicitudes, módulos y documentos asociados.
              </p>
              <p class="mt-1 text-sm font-semibold text-slate-800">
                Formulario #{{ formularioToDeleteId }}{{ formularioToDeleteAlumnoNombre ? ' · ' + formularioToDeleteAlumnoNombre : '' }}
              </p>
              <p *ngIf="deleteFormularioError" class="mt-3 text-sm text-rose-700">{{ deleteFormularioError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="deletingFormulario"
                  (click)="cerrarModalEliminarFormulario()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="deletingFormulario"
                  (click)="confirmarEliminarFormulario()"
                >
                  {{ deletingFormulario ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="exportArchiveModalOpen" class="fixed inset-0 z-[102] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Archivar formularios exportados</h3>
              <p class="mt-2 text-sm text-slate-600">
                El Excel ya se ha descargado. Selecciona qué formularios quieres mover a archivados.
              </p>
              <div class="mt-4 space-y-3">
                <label class="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    [(ngModel)]="exportArchiveValidadosSelected"
                    [disabled]="archivandoTrasExportar || exportArchiveValidadosCount === 0"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-semibold text-slate-900">Validados</span>
                    <span class="block text-xs text-slate-500">{{ exportArchiveValidadosCount }} formularios</span>
                  </span>
                </label>
                <label class="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    [(ngModel)]="exportArchiveRechazadosSelected"
                    [disabled]="archivandoTrasExportar || exportArchiveRechazadosCount === 0"
                  />
                  <span class="min-w-0">
                    <span class="block text-sm font-semibold text-slate-900">Rechazados</span>
                    <span class="block text-xs text-slate-500">{{ exportArchiveRechazadosCount }} formularios</span>
                  </span>
                </label>
              </div>
              <p *ngIf="exportArchiveError" class="mt-3 text-sm text-rose-700">{{ exportArchiveError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="archivandoTrasExportar"
                  (click)="cerrarModalArchivarTrasExportar()"
                >
                  Omitir
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="archivandoTrasExportar || !canConfirmExportArchive"
                  (click)="confirmarArchivarTrasExportar()"
                >
                  {{ archivandoTrasExportar ? 'Archivando...' : 'Archivar seleccionados' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="createMultipleConvalidacionesResultModalOpen" class="fixed inset-0 z-[103] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">
                {{ createMultipleConvalidacionesResultAction === 'crear' ? 'Reglas de convalidación creadas' : 'Reglas de convalidación eliminadas' }}
              </h3>
              <p class="mt-3 text-sm text-slate-700">
                {{ createMultipleConvalidacionesResultAction === 'crear' ? 'Se han creado' : 'Se han eliminado' }}
                {{ createMultipleConvalidacionesResultCreatedCount }} reglas de convalidación.
              </p>
              <p class="mt-2 text-sm text-slate-700">
                {{ createMultipleConvalidacionesResultSkippedCount }}
                {{ createMultipleConvalidacionesResultAction === 'crear'
                  ? 'reglas no se han insertado porque ya existían.'
                  : 'reglas no se han eliminado porque no existían.' }}
              </p>
              <div class="mt-5 flex items-center justify-end">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  (click)="cerrarModalResultadoConvalidacionesMultiples()"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="deleteMultipleConvalidacionesModalOpen" class="fixed inset-0 z-[104] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Eliminar reglas de convalidación</h3>
              <p class="mt-2 text-sm text-slate-600">
                ¿Estás seguro de que quieres eliminar {{ totalCombinacionesConvalidacionMultiples }} reglas?
              </p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  (click)="cerrarModalEliminarConvalidacionesMultiples()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 bg-slate-700 text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                  [disabled]="creatingMultipleConvalidaciones"
                  (click)="confirmarEliminarConvalidacionesMultiples()"
                >
                  Eliminar reglas
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="busquedaOrigenModalOpen" class="fixed inset-0 z-[124] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-3xl max-h-[85vh] rounded-xl bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden">
              <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 bg-white shrink-0">
                <div>
                  <p class="text-[11px] uppercase tracking-wide font-bold text-indigo-700">Origen</p>
                  <p class="mt-1 text-sm text-slate-500">Selecciona los orígenes que se aplicarán a las reglas.</p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  (click)="cerrarModalBusquedaOrigen()"
                  aria-label="Cerrar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div class="flex-1 min-h-0 overflow-y-auto">
                <div class="border-b border-slate-200 px-4 py-4 bg-white">
                  <div class="mt-3">
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Tipo de origen</label>
                    <div class="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 text-sm text-slate-700"
                        (click)="setBusquedaModuloIzquierdaOrigenTipo('modulos')"
                      >
                        <span
                          class="inline-flex h-4 w-4 items-center justify-center rounded border transition-colors"
                          [ngClass]="filtroBusquedaModuloIzquierdaOrigenTipo === 'modulos'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 bg-white'"
                        >
                          <span
                            *ngIf="filtroBusquedaModuloIzquierdaOrigenTipo === 'modulos'"
                            class="h-1.5 w-1.5 rounded-sm bg-white"
                          ></span>
                        </span>
                        <span class="font-medium">Módulo</span>
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 text-sm text-slate-700"
                        (click)="setBusquedaModuloIzquierdaOrigenTipo('ciclos')"
                      >
                        <span
                          class="inline-flex h-4 w-4 items-center justify-center rounded border transition-colors"
                          [ngClass]="filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 bg-white'"
                        >
                          <span
                            *ngIf="filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'"
                            class="h-1.5 w-1.5 rounded-sm bg-white"
                          ></span>
                        </span>
                        <span class="font-medium">Ciclo</span>
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 text-sm text-slate-700"
                        (click)="setBusquedaModuloIzquierdaOrigenTipo('acreditaciones')"
                      >
                        <span
                          class="inline-flex h-4 w-4 items-center justify-center rounded border transition-colors"
                          [ngClass]="filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 bg-white'"
                        >
                          <span
                            *ngIf="filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'"
                            class="h-1.5 w-1.5 rounded-sm bg-white"
                          ></span>
                        </span>
                        <span class="font-medium">Acreditación externa</span>
                      </button>
                    </div>
                  </div>
                  <div *ngIf="filtroBusquedaModuloIzquierdaOrigenTipo !== 'acreditaciones'" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 mb-1">Grado</label>
                      <select
                        [(ngModel)]="filtroBusquedaModuloIzquierdaGrado"
                        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">Todos los grados</option>
                        <option *ngFor="let grado of gradosBusquedaModuloIzquierda" [value]="grado">{{ grado }}</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 mb-1">Familia</label>
                      <select
                        [(ngModel)]="filtroBusquedaModuloIzquierdaFamilia"
                        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">Todas las familias</option>
                        <option *ngFor="let familia of familiasBusquedaModuloIzquierda" [value]="familia">{{ familia }}</option>
                      </select>
                    </div>
                  </div>
                  <label class="block text-xs font-semibold text-slate-600 mt-4 mb-1">
                    {{ filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos' ? 'Buscador de ciclos' : 'Buscador de módulos' }}
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="busquedaModuloIzquierda"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    [placeholder]="filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos' ? 'Buscar ciclo...' : 'Buscar módulo...'"
                  />
                  <p class="mt-2 text-xs text-slate-500">
                    {{ resultadosBusquedaModuloIzquierda.length }}
                    {{ filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                      ? (resultadosBusquedaModuloIzquierda.length === 1 ? 'ciclo encontrado' : 'ciclos encontrados')
                      : (resultadosBusquedaModuloIzquierda.length === 1 ? 'módulo único encontrado' : 'módulos únicos encontrados') }}
                  </p>
                </div>

                <div class="p-4">
                  <p *ngIf="!busquedaModuloIzquierdaNormalizada" class="px-2 py-1 text-sm text-slate-500">
                    {{ filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'
                      ? 'Escribe una acreditación para ver las acreditaciones externas disponibles.'
                      : (filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                        ? 'Escribe un ciclo para ver los ciclos disponibles y seleccionar todos sus módulos.'
                        : 'Escribe un módulo para ver cada módulo único y los ciclos que lo contienen.') }}
                  </p>
                  <p *ngIf="busquedaModuloIzquierdaNormalizada && resultadosBusquedaModuloIzquierda.length === 0" class="px-2 py-1 text-sm text-slate-500">
                    No hay {{ filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos' ? 'ciclos' : 'módulos' }} que coincidan con esa búsqueda.
                  </p>
                  <div *ngIf="resultadosBusquedaModuloIzquierda.length > 0" class="thin-scroll max-h-[60vh] overflow-y-auto pr-1 space-y-2">
                    <button
                      type="button"
                      class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      (click)="toggleBusquedaModuloSeleccion('izquierda')"
                    >
                      {{ isBusquedaModuloAllSelected('izquierda')
                        ? (filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'
                          ? 'Deseleccionar todas las acreditaciones'
                          : (filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                            ? 'Deseleccionar todos los ciclos'
                            : 'Deseleccionar todos los módulos y ciclos'))
                        : (filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'
                          ? 'Seleccionar todas las acreditaciones'
                          : (filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                            ? 'Seleccionar todos los ciclos'
                            : 'Seleccionar todos los módulos y ciclos')) }}
                    </button>
                    <article *ngFor="let resultado of resultadosBusquedaModuloIzquierda" class="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                      <ng-container *ngIf="filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'; else resultadoOrigenNoAcreditacion">
                        <label class="flex items-start gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            *ngIf="resultado.ciclos[0] as acreditacion"
                            type="checkbox"
                            class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [checked]="isBusquedaModuloCicloSelected('izquierda', acreditacion.moduloId)"
                            (change)="toggleBusquedaModuloCicloSeleccion('izquierda', acreditacion.moduloId, $any($event.target).checked)"
                          />
                          <span class="min-w-0">
                            <span class="block font-medium text-slate-900">{{ resultado.nombre }}</span>
                          </span>
                        </label>
                      </ng-container>
                      <ng-template #resultadoOrigenNoAcreditacion>
                      <ng-container *ngIf="filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'; else resultadoOrigenConDesplegable">
                        <label class="flex items-start gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            *ngIf="resultado.ciclos[0] as ciclo"
                            type="checkbox"
                            class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [checked]="isBusquedaModuloCicloSelected('izquierda', ciclo.moduloId)"
                            (change)="toggleBusquedaModuloCicloSeleccion('izquierda', ciclo.moduloId, $any($event.target).checked)"
                          />
                          <span class="min-w-0">
                            <span class="block font-medium text-slate-900">
                              <ng-container *ngIf="resultado.codigo">
                                <span class="text-slate-500">{{ resultado.codigo }} · </span>
                              </ng-container>
                              {{ resultado.nombre }}
                            </span>
                            <span *ngIf="formatBusquedaModuloMeta(resultado)" class="block text-xs text-slate-500">
                              {{ formatBusquedaModuloMeta(resultado) }}
                            </span>
                          </span>
                        </label>
                      </ng-container>
                      <ng-template #resultadoOrigenConDesplegable>
                      <button
                        type="button"
                        class="w-full text-left rounded-lg px-2 py-2 hover:bg-slate-50 transition-colors"
                        (click)="toggleBusquedaModuloRow('izquierda', resultado.key)"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p class="text-sm font-bold text-slate-900">
                              <ng-container *ngIf="resultado.codigo">
                                <span class="text-slate-500">{{ resultado.codigo }} · </span>
                              </ng-container>
                              {{ resultado.nombre }}
                            </p>
                            <p *ngIf="formatBusquedaModuloMeta(resultado)" class="text-xs text-slate-500">
                              {{ formatBusquedaModuloMeta(resultado) }}
                            </p>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              {{ resultado.totalCiclos }}
                              {{ filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                                ? (resultado.totalCiclos === 1 ? 'módulo' : 'módulos')
                                : (resultado.totalCiclos === 1 ? 'ciclo' : 'ciclos') }}
                            </span>
                            <span class="inline-flex items-center justify-center w-5 h-5 text-slate-400 transition-transform"
                              [class.rotate-180]="isBusquedaModuloRowOpen('izquierda', resultado.key)">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 9l6 6 6-6"></path>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </button>
                      <div *ngIf="isBusquedaModuloRowOpen('izquierda', resultado.key)" class="px-2 pt-1">
                        <button
                          type="button"
                          class="mb-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                          (click)="toggleBusquedaModuloResultadoSeleccion('izquierda', resultado)"
                        >
                          {{ isBusquedaModuloResultadoAllSelected('izquierda', resultado)
                            ? (filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'
                              ? 'Deseleccionar esta acreditación'
                              : (filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                                ? 'Deseleccionar todos los módulos de este ciclo'
                                : 'Deseleccionar todos los ciclos de este módulo'))
                            : (filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones'
                              ? 'Seleccionar esta acreditación'
                              : (filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                                ? 'Seleccionar todos los módulos de este ciclo'
                                : 'Seleccionar todos los ciclos de este módulo')) }}
                        </button>
                        <label *ngFor="let ciclo of resultado.ciclos" class="flex items-start gap-3 py-1.5 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [checked]="isBusquedaModuloCicloSelected('izquierda', ciclo.moduloId)"
                            (change)="toggleBusquedaModuloCicloSeleccion('izquierda', ciclo.moduloId, $any($event.target).checked)"
                          />
                          <span class="min-w-0">
                            <span class="block font-medium text-slate-900">
                              {{ filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
                                ? ((ciclo.moduloCodigo ? (ciclo.moduloCodigo + ' · ') : '') + ciclo.moduloNombre)
                                : ciclo.cicloNombre }}
                            </span>
                            <span *ngIf="formatBusquedaModuloCicloMeta(ciclo)" class="block text-xs text-slate-500">
                              {{ formatBusquedaModuloCicloMeta(ciclo) }}
                            </span>
                          </span>
                        </label>
                      </div>
                      </ng-template>
                      </ng-template>
                    </article>
                  </div>
                </div>
                <div class="border-t border-slate-200 px-4 py-4 bg-white flex justify-end">
                  <button
                    type="button"
                    class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    (click)="guardarModalBusquedaOrigen()"
                  >
                    Guardar selección
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="busquedaDestinoModalOpen" class="fixed inset-0 z-[125] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-3xl max-h-[85vh] rounded-xl bg-white border border-slate-200 shadow-xl flex flex-col overflow-hidden">
              <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 bg-white shrink-0">
                <div>
                  <p class="text-[11px] uppercase tracking-wide font-bold text-indigo-700">Destino</p>
                  <p class="mt-1 text-sm text-slate-500">Selecciona los módulos destino que se usarán en bloque.</p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  (click)="cerrarModalBusquedaDestino()"
                  aria-label="Cerrar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div class="flex-1 min-h-0 overflow-y-auto">
                <div class="border-b border-slate-200 px-4 py-4 bg-white">
                  <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 mb-1">Grado</label>
                      <select
                        [(ngModel)]="filtroBusquedaModuloDerechaGrado"
                        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">Todos los grados</option>
                        <option *ngFor="let grado of gradosBusquedaModuloDerecha" [value]="grado">{{ grado }}</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 mb-1">Familia</label>
                      <select
                        [(ngModel)]="filtroBusquedaModuloDerechaFamilia"
                        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">Todas las familias</option>
                        <option *ngFor="let familia of familiasBusquedaModuloDerecha" [value]="familia">{{ familia }}</option>
                      </select>
                    </div>
                  </div>
                  <label class="block text-xs font-semibold text-slate-600 mt-4 mb-1">Buscador de módulos</label>
                  <input
                    type="text"
                    [(ngModel)]="busquedaModuloDerecha"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Buscar módulo..."
                  />
                  <p class="mt-2 text-xs text-slate-500">
                    {{ resultadosBusquedaModuloDerecha.length }} módulos únicos encontrados
                  </p>
                </div>

                <div class="p-4">
                  <p *ngIf="!busquedaModuloDerechaNormalizada" class="px-2 py-1 text-sm text-slate-500">
                    Escribe un módulo para ver cada módulo único y los ciclos que lo contienen.
                  </p>
                  <p *ngIf="busquedaModuloDerechaNormalizada && resultadosBusquedaModuloDerecha.length === 0" class="px-2 py-1 text-sm text-slate-500">
                    No hay módulos que coincidan con esa búsqueda.
                  </p>
                  <div *ngIf="resultadosBusquedaModuloDerecha.length > 0" class="thin-scroll max-h-[60vh] overflow-y-auto pr-1 space-y-2">
                    <button
                      type="button"
                      class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      (click)="toggleBusquedaModuloSeleccion('derecha')"
                    >
                      {{ isBusquedaModuloAllSelected('derecha') ? 'Deseleccionar todos los módulos y ciclos' : 'Seleccionar todos los módulos y ciclos' }}
                    </button>
                    <article *ngFor="let resultado of resultadosBusquedaModuloDerecha" class="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                      <button
                        type="button"
                        class="w-full text-left rounded-lg px-2 py-2 hover:bg-slate-50 transition-colors"
                        (click)="toggleBusquedaModuloRow('derecha', resultado.key)"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p class="text-sm font-bold text-slate-900">
                              <span *ngIf="resultado.codigo" class="text-slate-500">{{ resultado.codigo }} · </span>{{ resultado.nombre }}
                            </p>
                            <p *ngIf="formatBusquedaModuloMeta(resultado)" class="text-xs text-slate-500">{{ formatBusquedaModuloMeta(resultado) }}</p>
                          </div>
                          <div class="flex items-center gap-2 shrink-0">
                            <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                              {{ resultado.totalCiclos }} ciclos
                            </span>
                            <span class="inline-flex items-center justify-center w-5 h-5 text-slate-400 transition-transform"
                              [class.rotate-180]="isBusquedaModuloRowOpen('derecha', resultado.key)">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 9l6 6 6-6"></path>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </button>
                      <div *ngIf="isBusquedaModuloRowOpen('derecha', resultado.key)" class="px-2 pt-1">
                        <button
                          type="button"
                          class="mb-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                          (click)="toggleBusquedaModuloResultadoSeleccion('derecha', resultado)"
                        >
                          {{ isBusquedaModuloResultadoAllSelected('derecha', resultado) ? 'Deseleccionar todos los ciclos de este módulo' : 'Seleccionar todos los ciclos de este módulo' }}
                        </button>
                        <label *ngFor="let ciclo of resultado.ciclos" class="flex items-start gap-3 py-1.5 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [checked]="isBusquedaModuloCicloSelected('derecha', ciclo.moduloId)"
                            (change)="toggleBusquedaModuloCicloSeleccion('derecha', ciclo.moduloId, $any($event.target).checked)"
                          />
                          <span class="min-w-0">
                            <span class="block font-medium text-slate-900">{{ ciclo.cicloNombre }}</span>
                            <span *ngIf="formatBusquedaModuloCicloMeta(ciclo)" class="block text-xs text-slate-500">{{ formatBusquedaModuloCicloMeta(ciclo) }}</span>
                          </span>
                        </label>
                      </div>
                    </article>
                  </div>
                </div>
                <div class="border-t border-slate-200 px-4 py-4 bg-white flex justify-end">
                  <button
                    type="button"
                    class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    (click)="guardarModalBusquedaDestino()"
                  >
                    Guardar selección
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="deleteCicloModalOpen && cicloToDelete" class="fixed inset-0 z-[105] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Eliminar ciclo</h3>
              <p class="mt-2 text-sm text-slate-600">
                ¿Estás seguro de que quieres eliminar todo el ciclo y sus módulos?
              </p>
              <p class="mt-1 text-sm font-semibold text-slate-800">
                {{ cicloToDelete.nombre }}
              </p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="deletingCiclo"
                  (click)="cancelarEliminarCiclo()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="deletingCiclo"
                  (click)="confirmarEliminarCiclo()"
                >
                  {{ deletingCiclo ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="createCicloModalOpen" class="fixed inset-0 z-[107] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Añadir ciclo</h3>
              <div class="mt-4 space-y-3">
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Familia</span>
                  <select
                    [(ngModel)]="createCicloFamiliaId"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option [ngValue]="null">Selecciona una familia...</option>
                    <option *ngFor="let familia of familiasCreateCiclo" [ngValue]="familia.id">{{ familia.nombre }}</option>
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Grado</span>
                  <select
                    [(ngModel)]="createCicloGradoId"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option [ngValue]="null">Selecciona un grado...</option>
                    <option *ngFor="let grado of gradosCreateCiclo" [ngValue]="grado.id">{{ grado.nombre }}</option>
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre del ciclo</span>
                  <input
                    type="text"
                    [(ngModel)]="createCicloNombre"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ej: Desarrollo de Aplicaciones Multiplataforma"
                  />
                </label>
              </div>
              <p *ngIf="createCicloError" class="mt-3 text-sm text-rose-700">{{ createCicloError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="creatingCiclo"
                  (click)="cerrarModalCrearCiclo()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                  [disabled]="creatingCiclo || !canCreateCiclo()"
                  (click)="crearCiclo()"
                >
                  {{ creatingCiclo ? 'Creando...' : 'Crear ciclo' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="createAcreditacionExternaModalOpen" class="fixed inset-0 z-[108] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Añadir titulo externo</h3>
              <p class="mt-2 text-sm text-slate-600">
                Se insertará dentro del ciclo de acreditaciones externas.
              </p>
              <div class="mt-4 space-y-3">
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</span>
                  <div class="mt-2 space-y-2">
                    <label class="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        [checked]="createAcreditacionExternaCodigo === 'titulo_universitario'"
                        [disabled]="creatingAcreditacionExterna"
                        (change)="setCreateAcreditacionExternaCodigo('titulo_universitario', $any($event.target).checked)"
                      />
                      Título universitario
                    </label>
                    <label class="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        [checked]="createAcreditacionExternaCodigo === 'certificado_idioma'"
                        [disabled]="creatingAcreditacionExterna"
                        (change)="setCreateAcreditacionExternaCodigo('certificado_idioma', $any($event.target).checked)"
                      />
                      Certificado de idioma
                    </label>
                    <label class="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        [checked]="createAcreditacionExternaCodigo === 'otros'"
                        [disabled]="creatingAcreditacionExterna"
                        (change)="setCreateAcreditacionExternaCodigo('otros', $any($event.target).checked)"
                      />
                      Otros
                    </label>
                  </div>
                </label>
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre del titulo</span>
                  <input
                    type="text"
                    [(ngModel)]="createAcreditacionExternaNombre"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ej: Certificado de Nivel C1 de Inglés"
                    [disabled]="creatingAcreditacionExterna"
                  />
                </label>
              </div>
              <p *ngIf="createAcreditacionExternaError" class="mt-3 text-sm text-rose-700">{{ createAcreditacionExternaError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="creatingAcreditacionExterna"
                  (click)="cerrarModalCrearAcreditacionExterna()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                  [disabled]="creatingAcreditacionExterna || !canCreateAcreditacionExterna()"
                  (click)="crearAcreditacionExterna()"
                >
                  {{ creatingAcreditacionExterna ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="modulosModalCiclo" class="fixed inset-0 z-[110] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-4xl max-h-[85vh] rounded-xl bg-white border border-slate-200 shadow-xl p-5 flex flex-col overflow-hidden">
              <div class="flex items-start justify-between gap-3 shrink-0">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    {{ modulosModalCiclo.grado_nombre || 'Sin grado' }}
                  </p>
                  <h3 class="text-base font-bold text-slate-900">{{ modulosModalCiclo.nombre }}</h3>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ modulosModalCiclo.total_modulos }} módulos
                  </p>
                  <p *ngIf="modulosModalDeprecated.length > 0" class="text-xs text-slate-500 mt-1">
                    {{ modulosModalActivos.length }} activos · {{ modulosModalDeprecated.length }} obsoletos
                  </p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  (click)="cerrarModalModulos()"
                  aria-label="Cerrar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div class="border-t border-slate-100 mt-4 pt-4 flex-1 min-h-0 overflow-hidden">
                <div class="mb-3">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    (click)="toggleAddModulosForm()"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Añadir módulo
                  </button>
                </div>

                <div *ngIf="showAddModulosForm" class="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div *ngFor="let item of modulosDraft; let i = index" class="grid grid-cols-1 sm:grid-cols-[1fr_2fr_180px_auto] gap-2">
                    <input
                      type="text"
                      [(ngModel)]="item.id_oficial"
                      placeholder="Código módulo"
                      class="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                    <input
                      type="text"
                      [(ngModel)]="item.nombre"
                      placeholder="Nombre módulo"
                      class="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                    <select
                      [(ngModel)]="item.numerico"
                      class="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      <option [ngValue]="1">Numérico</option>
                      <option [ngValue]="0">APTO/NO APTO/EXENTO</option>
                    </select>
                    <button
                      type="button"
                      class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-rose-600 transition-colors"
                      (click)="removeModuloDraftRow(i)"
                      [disabled]="creatingModulos || modulosDraft.length === 1"
                      title="Quitar fila"
                      aria-label="Quitar fila"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>

                  <div class="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      (click)="addModuloDraftRow()"
                      [disabled]="creatingModulos"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Añadir otra fila
                    </button>
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                      (click)="crearModulos()"
                      [disabled]="creatingModulos || !canCreateModulos()"
                    >
                      {{ creatingModulos ? 'Guardando...' : 'Guardar módulos' }}
                    </button>
                  </div>
                  <p *ngIf="createModulosError" class="text-sm text-rose-700">{{ createModulosError }}</p>
                </div>

                <div class="thin-scroll h-full max-h-[60vh] overflow-y-auto pr-1 space-y-5">
                  <section>
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Módulos activos</h4>
                      <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {{ modulosModalActivos.length }}
                      </span>
                    </div>
                    <ul class="space-y-2">
                      <li
                        *ngFor="let modulo of modulosModalActivos"
                        class="text-sm text-slate-700 leading-5 border-b border-slate-100 pb-2 flex items-start justify-between gap-3"
                      >
                        <div class="min-w-0 flex-1">
                          <span *ngIf="modulo.id_oficial" class="text-xs text-slate-500 mr-1">{{ modulo.id_oficial }}</span>
                          {{ modulo.nombre }}
                          <span class="ml-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            {{ modulo.numerico === 0 ? 'No numérico' : 'Numérico' }}
                          </span>
                        </div>
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          [disabled]="deletingModulos.has(modulo.id)"
                          (click)="abrirModalEliminarModulo(modulo.id, modulo.nombre)"
                          title="Eliminar módulo"
                          aria-label="Eliminar módulo"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V5a1 1 0 011-1h6a1 1 0 011 1v2m-9 0h10"></path>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </section>

                  <section *ngIf="modulosModalDeprecated.length > 0">
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Módulos obsoletos</h4>
                      <span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {{ modulosModalDeprecated.length }}
                      </span>
                    </div>
                    <ul class="space-y-2">
                      <li
                        *ngFor="let modulo of modulosModalDeprecated"
                        class="text-sm text-slate-500 leading-5 border-b border-slate-100 pb-2 flex items-start justify-between gap-3"
                      >
                        <div class="min-w-0 flex-1">
                          <span *ngIf="modulo.id_oficial" class="text-xs text-slate-400 mr-1">{{ modulo.id_oficial }}</span>
                          {{ modulo.nombre }}
                          <span class="ml-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Obsoleto
                          </span>
                          <span class="ml-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            {{ modulo.numerico === 0 ? 'No numérico' : 'Numérico' }}
                          </span>
                        </div>
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          [disabled]="deletingModulos.has(modulo.id)"
                          (click)="abrirModalEliminarModulo(modulo.id, modulo.nombre)"
                          title="Eliminar módulo"
                          aria-label="Eliminar módulo"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V5a1 1 0 011-1h6a1 1 0 011 1v2m-9 0h10"></path>
                          </svg>
                        </button>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="deleteModuloModalOpen && moduloToDeleteId !== null && moduloToDeleteNombre" class="fixed inset-0 z-[115] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Eliminar módulo</h3>
              <p class="mt-2 text-sm text-slate-600">
                {{ deleteModuloEsAcreditacionExterna ? '¿Quieres eliminar esa acreditación externa?' : '¿Quieres eliminar el módulo del ciclo seleccionado?' }}
              </p>
              <p class="mt-1 text-sm font-semibold text-slate-800">
                {{ moduloToDeleteNombre }}
              </p>
              <p *ngIf="moduloToDeleteCicloNombre" class="mt-1 text-xs text-slate-500">
                Ciclo: {{ moduloToDeleteCicloNombre }}
              </p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="moduloToDeleteId !== null && deletingModulos.has(moduloToDeleteId)"
                  (click)="cancelarEliminarModulo()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="moduloToDeleteId !== null && deletingModulos.has(moduloToDeleteId)"
                  (click)="confirmarEliminarModulo()"
                >
                  {{ moduloToDeleteId !== null && deletingModulos.has(moduloToDeleteId) ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="deleteConvalidacionModalOpen" class="fixed inset-0 z-[116] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Eliminar opción de convalidación</h3>
              <p class="mt-2 text-sm text-slate-600">
                ¿Quieres eliminar esta opción de convalidación?
              </p>
              <p *ngIf="convalidacionToDeleteModuloNombre" class="mt-2 text-sm font-semibold text-slate-800">
                Módulo: {{ convalidacionToDeleteModuloNombre }}
              </p>
              <p *ngIf="convalidacionToDeleteCicloOrigenNombre" class="mt-1 text-sm text-slate-700">
                Ciclo origen: {{ convalidacionToDeleteCicloOrigenNombre }}
              </p>
              <p class="mt-1 text-xs text-slate-500">
                Se eliminarán {{ convalidacionToDeleteReglaIds.length }} regla(s).
              </p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="convalidacionToDeleteKey && deletingConvalidacionCiclos.has(convalidacionToDeleteKey)"
                  (click)="cancelarEliminarConvalidacion()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="convalidacionToDeleteKey && deletingConvalidacionCiclos.has(convalidacionToDeleteKey)"
                  (click)="confirmarEliminarConvalidacion()"
                >
                  {{ convalidacionToDeleteKey && deletingConvalidacionCiclos.has(convalidacionToDeleteKey) ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="editConvalidacionModalOpen" class="fixed inset-0 z-[117] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-2xl max-h-[85vh] rounded-xl bg-white border border-slate-200 shadow-xl p-5 flex flex-col overflow-hidden">
              <div class="flex items-start justify-between gap-3 shrink-0">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Editar opción de convalidación</p>
                  <h3 class="text-base font-bold text-slate-900">Detalle de la regla</h3>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  (click)="cerrarModalEditarConvalidacion()"
                  aria-label="Cerrar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div class="border-t border-slate-100 mt-4 pt-4 flex-1 min-h-0 overflow-hidden">
                <section class="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-3">
                  <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Formación a convalidar</p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ciclo destino</p>
                      <p class="text-sm text-slate-800 mt-0.5">{{ editConvalidacionCicloDestinoNombre }}</p>
                    </div>
                    <div>
                      <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Módulo destino</p>
                      <p class="text-sm text-slate-800 mt-0.5">
                        <span *ngIf="editConvalidacionModuloCodigo" class="text-slate-500">{{ editConvalidacionModuloCodigo }} · </span>{{ editConvalidacionModuloNombre }}
                      </p>
                    </div>
                  </div>
                </section>

                <section class="rounded-lg border border-slate-200 bg-white p-3 h-[calc(100%-9.25rem)] min-h-0 flex flex-col">
                  <p class="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Formación aportada</p>
                  <div class="mb-2">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ciclo origen</p>
                    <p class="text-sm text-slate-800 mt-0.5">{{ editConvalidacionCicloOrigenNombre }}</p>
                  </div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    {{ editConvalidacionOrigenes.length > 0 && editConvalidacionOrigenes[0].esCicloCompleto ? 'Formación aportada' : 'Módulo o módulos origen' }}
                  </p>
                <p *ngIf="editConvalidacionOrigenes.length > 0 && editConvalidacionOrigenes[0].esCicloCompleto" class="text-sm text-slate-800 mt-0.5">
                  Ciclo completo
                </p>
                <ul
                  *ngIf="!(editConvalidacionOrigenes.length > 0 && editConvalidacionOrigenes[0].esCicloCompleto)"
                  class="thin-scroll space-y-2 h-full max-h-[58vh] overflow-y-auto pr-1"
                >
                  <li
                    *ngFor="let origen of editConvalidacionOrigenes"
                    class="text-sm text-slate-700 leading-5 border-b border-slate-100 pb-2 flex items-start justify-between gap-3"
                  >
                    <div class="min-w-0 flex-1">
                      <ng-container *ngIf="origen.esCicloCompleto; else moduloOrigenEditable">
                        Ciclo completo
                      </ng-container>
                      <ng-template #moduloOrigenEditable>
                        <span *ngIf="origen.moduloOrigenCodigo" class="text-xs text-slate-500 mr-1">{{ origen.moduloOrigenCodigo }}</span>
                        {{ origen.moduloOrigenNombre }}
                      </ng-template>
                    </div>
                    <button
                      *ngIf="!origen.esCicloCompleto"
                      type="button"
                      class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      [disabled]="deletingConvalidacionOrigenes.has(origen.key)"
                      (click)="eliminarModuloOrigenConvalidacion(origen)"
                      title="Eliminar módulo origen"
                      aria-label="Eliminar módulo origen"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V5a1 1 0 011-1h6a1 1 0 011 1v2m-9 0h10"></path>
                      </svg>
                    </button>
                  </li>
                </ul>
                </section>
              </div>
            </div>
          </div>

          <div *ngIf="createConvalidacionModalOpen" class="fixed inset-0 z-[118] bg-slate-900/45 overflow-y-auto p-4">
            <div class="thin-scroll w-full max-w-3xl max-h-[88vh] my-6 mx-auto rounded-xl bg-white border border-slate-200 shadow-xl p-5 overflow-y-auto">
              <div class="flex items-start justify-between gap-3 shrink-0">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Añadir regla de convalidación</p>
                  <h3 class="text-base font-bold text-slate-900">Nueva regla</h3>
                  <p class="text-xs text-slate-500 mt-1">
                    Configura la formación a convalidar y la formación a aportar.
                  </p>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center justify-center w-8 h-8 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  (click)="cerrarModalCrearConvalidacion()"
                  aria-label="Cerrar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div class="border-t border-slate-100 mt-4 pt-4">
                <div class="space-y-5">
                  <section class="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Formación a convalidar</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label class="text-xs font-semibold text-slate-600">Ciclo destino</label>
                        <div class="mt-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          {{ cicloConvalidacionesSeleccionadoNombre }}
                        </div>
                      </div>
                      <div>
                        <label class="text-xs font-semibold text-slate-600">Módulo a convalidar</label>
                        <select
                          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                          [(ngModel)]="createConvalidacionDestinoModuloId"
                          [disabled]="loadingCreateConvalidacionDestinoModulos"
                        >
                          <option [ngValue]="null">Selecciona un módulo</option>
                          <option *ngFor="let modulo of createConvalidacionDestinoModulos" [ngValue]="modulo.id">
                            {{ modulo.id_oficial ? (modulo.id_oficial + ' · ') : '' }}{{ modulo.nombre }}
                          </option>
                        </select>
                        <p *ngIf="loadingCreateConvalidacionDestinoModulos" class="mt-1 text-xs text-slate-500">
                          Cargando módulos destino...
                        </p>
                      </div>
                    </div>
                  </section>

                  <section class="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Formación a aportar</p>
                    <div>
                      <label class="text-xs font-semibold text-slate-600">Tipo de origen</label>
                      <div class="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name="createConvalidacionOrigenTipo"
                            class="border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [(ngModel)]="createConvalidacionOrigenTipo"
                            [value]="'modulo'"
                            (ngModelChange)="onCrearConvalidacionOrigenTipoChange()"
                          />
                          Módulo
                        </label>
                        <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name="createConvalidacionOrigenTipo"
                            class="border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [(ngModel)]="createConvalidacionOrigenTipo"
                            [value]="'ciclo'"
                            (ngModelChange)="onCrearConvalidacionOrigenTipoChange()"
                          />
                          Ciclo
                        </label>
                        <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name="createConvalidacionOrigenTipo"
                            class="border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [(ngModel)]="createConvalidacionOrigenTipo"
                            [value]="'acreditacion_externa'"
                            (ngModelChange)="onCrearConvalidacionOrigenTipoChange()"
                          />
                          Acreditación externa
                        </label>
                      </div>
                    </div>

                    <ng-container *ngIf="createConvalidacionOrigenTipo !== 'acreditacion_externa'; else createConvalidacionAcreditacionExternaBlock">
                      <div>
                        <div>
                          <label class="text-xs font-semibold text-slate-600">Ciclo origen</label>
                          <select
                            class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                            [(ngModel)]="createConvalidacionOrigenCicloId"
                            (ngModelChange)="onCrearConvalidacionOrigenCicloChange()"
                            [disabled]="loadingCreateConvalidacionCiclosOrigen"
                          >
                            <option [ngValue]="null">Selecciona un ciclo</option>
                            <option *ngFor="let ciclo of createConvalidacionCiclosOrigen" [ngValue]="ciclo.id">
                              {{ ciclo.nombre }}
                            </option>
                          </select>
                          <p *ngIf="loadingCreateConvalidacionCiclosOrigen" class="mt-1 text-xs text-slate-500">
                            Cargando ciclos...
                          </p>
                        </div>
                      </div>

                      <div *ngIf="createConvalidacionOrigenCicloId" class="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div class="flex items-center justify-between gap-2 mb-2">
                          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {{ createConvalidacionOrigenTipo === 'ciclo' ? 'Ciclo origen' : 'Módulos origen' }}
                          </p>
                          <span class="text-xs text-slate-500">
                            {{ createConvalidacionOrigenTipo === 'ciclo'
                              ? '1 seleccionado'
                              : (createConvalidacionOrigenModuloIds.length + ' seleccionados') }}
                          </span>
                        </div>
                        <p
                          class="mb-2 text-xs min-h-[16px]"
                          [class.text-indigo-700]="createConvalidacionOrigenTipo === 'ciclo'"
                          [class.text-slate-500]="createConvalidacionOrigenTipo !== 'ciclo'"
                        >
                          {{ createConvalidacionOrigenTipo === 'ciclo'
                            ? 'Se utilizará el ciclo completo como origen.'
                            : 'Seleccione los módulos.' }}
                        </p>
                        <p *ngIf="loadingCreateConvalidacionOrigenModulos" class="text-xs text-slate-500">
                          Cargando módulos origen...
                        </p>
                        <div *ngIf="!loadingCreateConvalidacionOrigenModulos && createConvalidacionOrigenTipo === 'ciclo'" class="text-sm text-slate-700">
                          {{ createConvalidacionOrigenCicloNombreSeleccionado || 'Ciclo completo seleccionado' }}
                        </div>
                        <ul *ngIf="!loadingCreateConvalidacionOrigenModulos && createConvalidacionOrigenTipo === 'modulo'" class="thin-scroll max-h-44 overflow-y-auto space-y-1 pr-1">
                          <li *ngFor="let modulo of createConvalidacionOrigenModulos">
                            <label class="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white">
                              <input
                                type="checkbox"
                                class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                [checked]="createConvalidacionOrigenModuloIds.includes(modulo.id)"
                                (change)="toggleCrearConvalidacionOrigenModulo(modulo.id, $any($event.target).checked)"
                              />
                              <span class="text-sm text-slate-700">
                                {{ modulo.id_oficial ? (modulo.id_oficial + ' · ') : '' }}{{ modulo.nombre }}
                              </span>
                            </label>
                          </li>
                        </ul>
                      </div>
                    </ng-container>

                    <ng-template #createConvalidacionAcreditacionExternaBlock>
                      <div>
                        <label class="text-xs font-semibold text-slate-600">Acreditación externa</label>
                        <select
                          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                          [(ngModel)]="createConvalidacionOrigenAcreditacionId"
                          [disabled]="loadingCreateConvalidacionAcreditacionesExternas"
                        >
                          <option [ngValue]="null">Selecciona una acreditación externa</option>
                          <option *ngFor="let acreditacion of createConvalidacionAcreditacionesExternas" [ngValue]="acreditacion.id">
                            {{ acreditacion.nombre }}
                          </option>
                        </select>
                        <p *ngIf="loadingCreateConvalidacionAcreditacionesExternas" class="mt-1 text-xs text-slate-500">
                          Cargando acreditaciones externas...
                        </p>
                      </div>
                    </ng-template>

                  </section>
                </div>
              </div>

              <div class="mt-5 space-y-3">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Fuente</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs font-semibold text-slate-600">URL</label>
                    <input
                      type="url"
                      class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                      [(ngModel)]="createConvalidacionSourceLink"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label class="text-xs font-semibold text-slate-600">Página</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
                      [(ngModel)]="createConvalidacionSourcePage"
                      placeholder="Ej. 124860"
                    />
                  </div>
                </div>
              </div>

              <p *ngIf="createConvalidacionError" class="mt-3 text-sm text-rose-700">{{ createConvalidacionError }}</p>

              <div class="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="creatingConvalidacion"
                  (click)="cerrarModalCrearConvalidacion()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                  [disabled]="!canGuardarNuevaConvalidacion || creatingConvalidacion"
                  (click)="guardarNuevaConvalidacion()"
                >
                  {{ creatingConvalidacion ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="deleteConvalidacionOrigenModalOpen && convalidacionOrigenToDelete" class="fixed inset-0 z-[119] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Eliminar módulo origen</h3>
              <p class="mt-2 text-sm text-slate-600">
                ¿Quieres eliminar este módulo de la regla de convalidación?
              </p>
              <p class="mt-2 text-sm font-semibold text-slate-800">
                <span *ngIf="convalidacionOrigenToDelete.moduloOrigenCodigo" class="text-slate-500">{{ convalidacionOrigenToDelete.moduloOrigenCodigo }} · </span>{{ convalidacionOrigenToDelete.moduloOrigenNombre }}
              </p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="deletingConvalidacionOrigenes.has(convalidacionOrigenToDelete.key)"
                  (click)="cancelarEliminarModuloOrigenConvalidacion()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="deletingConvalidacionOrigenes.has(convalidacionOrigenToDelete.key)"
                  (click)="confirmarEliminarModuloOrigenConvalidacion()"
                >
                  {{ deletingConvalidacionOrigenes.has(convalidacionOrigenToDelete.key) ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="editAdminModalOpen && adminToEdit" class="fixed inset-0 z-[120] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Editar administrador</h3>
              <div class="mt-4 space-y-3">
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</span>
                  <input
                    type="text"
                    [(ngModel)]="editAdminNombre"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    [disabled]="editingAdmin"
                  />
                </label>
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Contraseña</span>
                  <input
                    type="password"
                    [(ngModel)]="editAdminPassword"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    [disabled]="editingAdmin"
                  />
                </label>
              </div>
              <p *ngIf="editAdminError" class="mt-3 text-sm text-rose-700">{{ editAdminError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="editingAdmin"
                  (click)="cerrarModalEditarAdministrador()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                  [disabled]="!canActualizarAdministrador || editingAdmin"
                  (click)="actualizarAdministrador()"
                >
                  {{ editingAdmin ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="deleteAdminModalOpen && adminToDelete" class="fixed inset-0 z-[121] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Eliminar administrador</h3>
              <p class="mt-2 text-sm text-slate-600">
                ¿Estás seguro que quieres eliminar este usuario?
              </p>
              <p class="mt-1 text-sm font-semibold text-slate-800">{{ adminToDelete.nombre }}</p>
              <p *ngIf="deleteAdminError" class="mt-3 text-sm text-rose-700">{{ deleteAdminError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="deletingAdmin"
                  (click)="cerrarModalEliminarAdministrador()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="deletingAdmin"
                  (click)="confirmarEliminarAdministrador()"
                >
                  {{ deletingAdmin ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="createAdminModalOpen" class="fixed inset-0 z-[122] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Añadir administrador</h3>
              <div class="mt-4 space-y-3">
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</span>
                  <input
                    type="text"
                    [(ngModel)]="createAdminNombre"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="usuario_admin"
                    [disabled]="creatingAdmin"
                  />
                </label>
                <label class="block">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Contraseña</span>
                  <input
                    type="password"
                    [(ngModel)]="createAdminPassword"
                    class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="••••••••"
                    [disabled]="creatingAdmin"
                  />
                </label>
              </div>
              <p *ngIf="createAdminError" class="mt-3 text-sm text-rose-700">{{ createAdminError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="creatingAdmin"
                  (click)="cerrarModalCrearAdministrador()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                  [disabled]="creatingAdmin || !canCrearAdministrador"
                  (click)="crearAdministrador()"
                >
                  {{ creatingAdmin ? 'Creando...' : 'Crear administrador' }}
                </button>
              </div>
            </div>
          </div>

          <div *ngIf="manualNotaModalOpen && manualNotaSolicitud" class="fixed inset-0 z-[123] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl p-5">
              <h3 class="text-base font-bold text-slate-900">Nota del módulo convalidado</h3>
              <p class="mt-2 text-sm text-slate-600">
                Esta solicitud no tiene una regla de convalidación asignada. Puedes guardar una nota manual antes de validarla.
              </p>
              <p class="mt-2 text-sm font-semibold text-slate-800">{{ manualNotaSolicitud.nombre }}</p>
              <label class="block mt-4">
                <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nota opcional</span>
                <input
                  type="number"
                  [(ngModel)]="manualNotaInput"
                  class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ej. 7,5"
                  min="0"
                  max="10"
                  step="0.01"
                  [disabled]="manualNotaSubmitting"
                />
              </label>
              <p class="mt-2 text-xs text-slate-500">Puedes dejarlo vacío y continuar igualmente.</p>
              <p *ngIf="manualNotaError" class="mt-3 text-sm text-rose-700">{{ manualNotaError }}</p>
              <div class="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                  [disabled]="manualNotaSubmitting"
                  (click)="cerrarModalNotaManual()"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  [disabled]="manualNotaSubmitting"
                  (click)="confirmarValidacionSolicitudSinNota()"
                >
                  Validar sin nota
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                  [disabled]="manualNotaSubmitting"
                  (click)="confirmarValidacionSolicitudConNota()"
                >
                  {{ manualNotaSubmitting ? 'Guardando...' : 'Guardar y validar' }}
                </button>
              </div>
            </div>
          </div>
        </ng-container>
      </main>
    </div>
  `,
})
export class AdminPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly adminSessionKey = 'somo_admin_session';
  private resizeObserver: ResizeObserver | null = null;
  @ViewChild('headerInner') headerInnerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('headerBrand') headerBrandRef?: ElementRef<HTMLDivElement>;
  @ViewChild('headerTabsMeasure') headerTabsMeasureRef?: ElementRef<HTMLDivElement>;
  @ViewChild('headerActionsMeasure') headerActionsMeasureRef?: ElementRef<HTMLDivElement>;

  activeTab: AdminTab = 'formularios';
  menuTabsOpen = false;
  useMenuTabs = false;

  formularios: AdminFormulario[] = [];
  alumnos: AdminAlumnoGroup[] = [];
  formularioEstadoFiltro: 0 | 1 | 2 | 3 = 0;
  archivadasEstadoFiltro: 3 | 4 = 3;
  cursoAcademicoFiltro = '';
  openAlumnos = new Set<string>();
  openCiclos = new Set<string>();
  openCatalogCiclos = new Set<number>();
  openConvalidaciones = new Set<number>();
  openConvalidacionCiclos = new Set<string>();
  updatingFormularios = new Set<number>();
  deletingFormularios = new Set<number>();
  updatingSolicitudes = new Set<number>();
  manualNotaModalOpen = false;
  manualNotaFormularioId: number | null = null;
  manualNotaSolicitud: AdminCicloSolicitudesGroup['solicitudes'][number] | null = null;
  manualNotaInput = '';
  manualNotaError: string | null = null;
  manualNotaSubmitting = false;
  confirmModalOpen = false;
  confirmFormularioId: number | null = null;
  confirmAlumnoNombre = '';
  confirmEstadoActual: number | null = null;
  confirmEstadoObjetivo: 0 | 1 | 2 | 3 | 4 = 1;
  deleteFormularioModalOpen = false;
  formularioToDeleteId: number | null = null;
  formularioToDeleteAlumnoNombre = '';
  deleteFormularioError: string | null = null;
  deletingFormulario = false;
  exportArchiveModalOpen = false;
  exportArchiveValidadosSelected = true;
  exportArchiveRechazadosSelected = true;
  exportArchiveError: string | null = null;
  archivandoTrasExportar = false;
  modulosModalCiclo: AdminCicloConModulos | null = null;
  deleteCicloModalOpen = false;
  cicloToDelete: AdminCicloConModulos | null = null;
  deletingCiclo = false;
  createCicloModalOpen = false;
  createCicloFamiliaId: number | null = null;
  createCicloGradoId: number | null = null;
  createCicloNombre = '';
  createCicloError: string | null = null;
  creatingCiclo = false;
  createAcreditacionExternaModalOpen = false;
  createAcreditacionExternaCodigo = 'otros';
  createAcreditacionExternaNombre = '';
  createAcreditacionExternaError: string | null = null;
  creatingAcreditacionExterna = false;
  showAddModulosForm = false;
  modulosDraft: ModuloDraftRow[] = [{ id_oficial: '', nombre: '', numerico: 1 }];
  createModulosError: string | null = null;
  creatingModulos = false;
  deletingModulos = new Set<number>();
  deletingConvalidacionCiclos = new Set<string>();
  deleteConvalidacionModalOpen = false;
  convalidacionToDeleteKey = '';
  convalidacionToDeleteModuloNombre = '';
  convalidacionToDeleteCicloOrigenNombre = '';
  convalidacionToDeleteReglaIds: number[] = [];
  editConvalidacionModalOpen = false;
  editConvalidacionModuloNombre = '';
  editConvalidacionModuloCodigo: string | null = null;
  editConvalidacionCicloDestinoNombre = '';
  editConvalidacionCicloOrigenNombre = '';
  editConvalidacionOrigenes: AdminConvalidacionOrigenEditable[] = [];
  deletingConvalidacionOrigenes = new Set<string>();
  createConvalidacionModalOpen = false;
  createConvalidacionDestinoModuloId: number | null = null;
  createConvalidacionOrigenTipo: 'modulo' | 'ciclo' | 'acreditacion_externa' = 'modulo';
  createConvalidacionDestinoModulos: Modulo[] = [];
  createConvalidacionCiclosOrigen: Ciclo[] = [];
  createConvalidacionOrigenCicloId: number | null = null;
  createConvalidacionOrigenCicloCompleto = false;
  createConvalidacionOrigenModulos: Modulo[] = [];
  createConvalidacionOrigenModuloIds: number[] = [];
  createConvalidacionAcreditacionesExternas: Array<{ id: number; nombre: string; tipo: string | null }> = [];
  createConvalidacionOrigenAcreditacionId: number | null = null;
  createConvalidacionSourceLink = '';
  createConvalidacionSourcePage: number | null = null;
  loadingCreateConvalidacionDestinoModulos = false;
  loadingCreateConvalidacionCiclosOrigen = false;
  loadingCreateConvalidacionOrigenModulos = false;
  loadingCreateConvalidacionAcreditacionesExternas = false;
  creatingConvalidacion = false;
  createConvalidacionError: string | null = null;
  deleteConvalidacionOrigenModalOpen = false;
  convalidacionOrigenToDelete: PendingConvalidacionOrigenDelete | null = null;
  deleteModuloModalOpen = false;
  moduloToDeleteId: number | null = null;
  moduloToDeleteNombre = '';
  moduloToDeleteCicloNombre = '';
  deleteModuloEsAcreditacionExterna = false;

  adminNombre = '';
  adminPassword = '';
  loginError: string | null = null;
  loginLoading = false;
  isAuthenticated = false;
  adminDisplayName = '';
  adminId: number | null = null;

  loading = false;
  error: string | null = null;

  ciclosConModulos: AdminCicloConModulos[] = [];
  modulosVistaActiva: 'ciclos' | 'acreditaciones' = 'ciclos';
  convalidaciones: AdminConvalidacionRegla[] = [];
  administradores: AdminUser[] = [];

  loadingModulos = false;
  loadingConvalidaciones = false;
  loadingAdministradores = false;

  errorModulos: string | null = null;
  errorConvalidaciones: string | null = null;
  errorAdministradores: string | null = null;

  loadedModulos = false;
  loadedConvalidaciones = false;
  loadedAdministradores = false;

  filtroFamiliaModulos = '';
  filtroGradoModulos = '';
  filtroCicloModulos = '';
  convalidacionesView: AdminConvalidacionesView = 'destino';
  filtroConvalidacionesGradoId: number | null = null;
  filtroConvalidacionesCicloId: number | null = null;
  filtroBusquedaModuloIzquierdaGrado = '';
  filtroBusquedaModuloIzquierdaFamilia = '';
  filtroBusquedaModuloIzquierdaOrigenTipo: AdminBusquedaOrigenTipo = 'modulos';
  filtroBusquedaModuloDerechaGrado = '';
  filtroBusquedaModuloDerechaFamilia = '';
  busquedaModuloIzquierda = '';
  busquedaModuloDerecha = '';
  openBusquedaModuloIzquierda = new Set<string>();
  openBusquedaModuloDerecha = new Set<string>();
  selectedBusquedaModuloIzquierda = new Set<number>();
  selectedBusquedaModuloDerecha = new Set<number>();
  draftSelectedBusquedaModuloIzquierda = new Set<number>();
  draftSelectedBusquedaModuloDerecha = new Set<number>();
  convalidacionesMultiplesAction: AdminConvalidacionesMultiplesAction = 'crear';
  creatingMultipleConvalidaciones = false;
  createMultipleConvalidacionesError: string | null = null;
  createMultipleConvalidacionesSuccess: string | null = null;
  createMultipleConvalidacionesSourceLink = '';
  createMultipleConvalidacionesSourcePage: number | null = null;
  createMultipleConvalidacionesResultModalOpen = false;
  createMultipleConvalidacionesResultAction: AdminConvalidacionesMultiplesAction = 'crear';
  createMultipleConvalidacionesResultCreatedCount = 0;
  createMultipleConvalidacionesResultSkippedCount = 0;
  deleteMultipleConvalidacionesModalOpen = false;
  busquedaOrigenModalOpen = false;
  busquedaDestinoModalOpen = false;
  filtroAdministradores = '';
  createAdminNombre = '';
  createAdminPassword = '';
  createAdminError: string | null = null;
  creatingAdmin = false;
  createAdminModalOpen = false;
  editAdminModalOpen = false;
  adminToEdit: AdminUser | null = null;
  editAdminNombre = '';
  editAdminPassword = '';
  editAdminError: string | null = null;
  editingAdmin = false;
  deleteAdminModalOpen = false;
  adminToDelete: AdminUser | null = null;
  deleteAdminError: string | null = null;
  deletingAdmin = false;
  convalidacionesGrados: Grado[] = [];
  convalidacionesCiclos: Ciclo[] = [];
  loadingConvalidacionesGrados = false;
  loadingConvalidacionesCiclos = false;
  loadedConvalidacionesGrados = false;
  documentoPreviewObjectUrls = new Map<number, string>();
  documentoPreviewSelectedPaths = new Map<number, string>();
  documentoPreviewLoading = new Set<number>();
  documentoPreviewErrors = new Map<number, string>();

  constructor(
    private convalidacionesService: ConvalidacionesService,
    private catalogService: CatalogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedAdmin = localStorage.getItem(this.adminSessionKey);
    if (!storedAdmin) {
      this.isAuthenticated = false;
      return;
    }

    this.isAuthenticated = true;
    try {
      const parsed = JSON.parse(storedAdmin);
      this.adminDisplayName = parsed?.nombre || '';
      this.adminId = typeof parsed?.id === 'number' ? parsed.id : null;
      const token = typeof parsed?.token === 'string' ? parsed.token.trim() : '';
      if (this.adminId === null || !token) {
        localStorage.removeItem(this.adminSessionKey);
        this.isAuthenticated = false;
        return;
      }
    } catch {
      localStorage.removeItem(this.adminSessionKey);
      this.isAuthenticated = false;
      return;
    }
    this.loadActiveTab();
    setTimeout(() => this.evaluateHeaderLayout());
  }

  ngAfterViewInit(): void {
    this.evaluateHeaderLayout();
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      this.evaluateHeaderLayout();
    });

    const header = this.headerInnerRef?.nativeElement;
    if (header) this.resizeObserver.observe(header);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.clearDocumentoPreviews();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.evaluateHeaderLayout();
  }

  loginAdmin(): void {
    if (this.loginLoading) return;
    this.loginError = null;

    const nombre = this.adminNombre.trim();
    if (!nombre || !this.adminPassword) {
      this.loginError = 'Introduce usuario y contraseña.';
      return;
    }

    this.loginLoading = true;
    this.convalidacionesService.loginAdmin(nombre, this.adminPassword).subscribe({
      next: (resp) => {
        this.isAuthenticated = true;
        this.adminDisplayName = resp.nombre;
        this.adminId = resp.id;
        this.formularioEstadoFiltro = 0;
        localStorage.setItem(this.adminSessionKey, JSON.stringify({ id: resp.id, nombre: resp.nombre, token: resp.token }));
        this.adminPassword = '';
        this.loginLoading = false;
        this.loadActiveTab();
        setTimeout(() => this.evaluateHeaderLayout());
        this.cdr.detectChanges();
      },
      error: () => {
        this.loginLoading = false;
        this.loginError = 'Credenciales inválidas.';
        this.cdr.detectChanges();
      },
    });
  }

  logoutAdmin(): void {
    localStorage.removeItem(this.adminSessionKey);
    this.isAuthenticated = false;
    this.adminDisplayName = '';
    this.adminId = null;
    this.adminPassword = '';
    this.loginError = null;

    this.formularios = [];
    this.alumnos = [];
    this.formularioEstadoFiltro = 0;
    this.ciclosConModulos = [];
    this.convalidaciones = [];
    this.administradores = [];

    this.openAlumnos.clear();
    this.openCiclos.clear();
    this.openCatalogCiclos.clear();
    this.openConvalidaciones.clear();
    this.openConvalidacionCiclos.clear();
    this.updatingFormularios.clear();
    this.updatingSolicitudes.clear();
    this.cerrarModalNotaManual(true);

    this.loadedModulos = false;
    this.loadedConvalidaciones = false;
    this.loadedAdministradores = false;
    this.loadedConvalidacionesGrados = false;

    this.error = null;
    this.errorModulos = null;
    this.errorConvalidaciones = null;
    this.errorAdministradores = null;
    this.createAdminNombre = '';
    this.createAdminPassword = '';
    this.createAdminError = null;
    this.creatingAdmin = false;
    this.createAdminModalOpen = false;
    this.editAdminModalOpen = false;
    this.adminToEdit = null;
    this.editAdminNombre = '';
    this.editAdminPassword = '';
    this.editAdminError = null;
    this.editingAdmin = false;
    this.deleteAdminModalOpen = false;
    this.adminToDelete = null;
    this.deleteAdminError = null;
    this.deletingAdmin = false;

    this.activeTab = 'formularios';
    this.menuTabsOpen = false;
    this.useMenuTabs = false;
    this.confirmModalOpen = false;
    this.confirmFormularioId = null;
    this.confirmAlumnoNombre = '';
    this.modulosModalCiclo = null;
    this.deleteCicloModalOpen = false;
    this.cicloToDelete = null;
    this.createCicloModalOpen = false;
    this.createCicloFamiliaId = null;
    this.createCicloGradoId = null;
    this.createCicloNombre = '';
    this.createCicloError = null;
    this.creatingCiclo = false;
    this.showAddModulosForm = false;
    this.modulosDraft = [{ id_oficial: '', nombre: '', numerico: 1 }];
    this.createModulosError = null;
    this.creatingModulos = false;
    this.deletingModulos.clear();
    this.deletingConvalidacionCiclos.clear();
    this.deleteModuloModalOpen = false;
    this.moduloToDeleteId = null;
    this.moduloToDeleteNombre = '';
    this.moduloToDeleteCicloNombre = '';
    this.deleteModuloEsAcreditacionExterna = false;
    this.deleteConvalidacionModalOpen = false;
    this.convalidacionToDeleteKey = '';
    this.convalidacionToDeleteModuloNombre = '';
    this.convalidacionToDeleteCicloOrigenNombre = '';
    this.convalidacionToDeleteReglaIds = [];
    this.editConvalidacionModalOpen = false;
    this.editConvalidacionModuloNombre = '';
    this.editConvalidacionModuloCodigo = null;
    this.editConvalidacionCicloDestinoNombre = '';
    this.editConvalidacionCicloOrigenNombre = '';
    this.editConvalidacionOrigenes = [];
    this.deletingConvalidacionOrigenes.clear();
    this.cerrarModalCrearConvalidacion(true);
    this.convalidacionesView = 'destino';
    this.filtroConvalidacionesGradoId = null;
    this.filtroConvalidacionesCicloId = null;
    this.convalidacionesGrados = [];
    this.convalidacionesCiclos = [];
    this.filtroBusquedaModuloIzquierdaGrado = '';
    this.filtroBusquedaModuloIzquierdaFamilia = '';
    this.filtroBusquedaModuloIzquierdaOrigenTipo = 'modulos';
    this.filtroBusquedaModuloDerechaGrado = '';
    this.filtroBusquedaModuloDerechaFamilia = '';
    this.busquedaModuloIzquierda = '';
    this.busquedaModuloDerecha = '';
    this.openBusquedaModuloIzquierda.clear();
    this.openBusquedaModuloDerecha.clear();
    this.selectedBusquedaModuloIzquierda.clear();
    this.selectedBusquedaModuloDerecha.clear();
    this.draftSelectedBusquedaModuloIzquierda.clear();
    this.draftSelectedBusquedaModuloDerecha.clear();
    this.convalidacionesMultiplesAction = 'crear';
    this.creatingMultipleConvalidaciones = false;
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
    this.createMultipleConvalidacionesSourceLink = '';
    this.createMultipleConvalidacionesSourcePage = null;
    this.createMultipleConvalidacionesResultModalOpen = false;
    this.createMultipleConvalidacionesResultAction = 'crear';
    this.createMultipleConvalidacionesResultCreatedCount = 0;
    this.createMultipleConvalidacionesResultSkippedCount = 0;
    this.deleteMultipleConvalidacionesModalOpen = false;
    this.busquedaOrigenModalOpen = false;
    this.busquedaDestinoModalOpen = false;
  }

  private handleAdminUnauthorized(err: any): boolean {
    if (err?.status !== 401) return false;
    this.logoutAdmin();
    this.loginError = 'Sesión de administrador caducada. Inicia sesión de nuevo.';
    this.cdr.detectChanges();
    return true;
  }

  setActiveTab(tab: AdminTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.menuTabsOpen = false;
    this.loadActiveTab();
  }

  toggleMenuTabs(): void {
    this.menuTabsOpen = !this.menuTabsOpen;
  }

  selectTabFromMenu(tab: AdminTab): void {
    this.setActiveTab(tab);
    this.menuTabsOpen = false;
  }

  tabClass(tab: AdminTab): string {
    if (this.activeTab === tab) {
      return 'border-indigo-600 text-indigo-700';
    }
    return 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300';
  }

  menuTabClass(tab: AdminTab): string {
    if (this.activeTab === tab) {
      return 'bg-indigo-50 text-indigo-700';
    }
    return 'text-slate-700 hover:bg-slate-100';
  }

  setConvalidacionesView(view: AdminConvalidacionesView): void {
    this.convalidacionesView = view;
    if (view === 'multiple') {
      this.cargarCiclosModulos();
    }
  }

  setBusquedaModuloIzquierdaOrigenTipo(tipo: AdminBusquedaOrigenTipo): void {
    if (this.filtroBusquedaModuloIzquierdaOrigenTipo === tipo) return;
    this.filtroBusquedaModuloIzquierdaOrigenTipo = tipo;
    this.filtroBusquedaModuloIzquierdaGrado = '';
    this.filtroBusquedaModuloIzquierdaFamilia = '';
    this.busquedaModuloIzquierda = '';
    this.openBusquedaModuloIzquierda.clear();
    this.selectedBusquedaModuloIzquierda.clear();
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
  }

  toggleBusquedaModuloRow(side: 'izquierda' | 'derecha', key: string): void {
    const target = side === 'izquierda' ? this.openBusquedaModuloIzquierda : this.openBusquedaModuloDerecha;
    if (target.has(key)) {
      target.delete(key);
      return;
    }
    target.add(key);
  }

  isBusquedaModuloRowOpen(side: 'izquierda' | 'derecha', key: string): boolean {
    const target = side === 'izquierda' ? this.openBusquedaModuloIzquierda : this.openBusquedaModuloDerecha;
    return target.has(key);
  }

  toggleBusquedaModuloCicloSeleccion(
    side: 'izquierda' | 'derecha',
    moduloId: number,
    selected: boolean
  ): void {
    const target = this.getBusquedaModuloEditableSelectionTarget(side);
    if (selected) {
      target.add(Number(moduloId));
      this.createMultipleConvalidacionesError = null;
      this.createMultipleConvalidacionesSuccess = null;
      return;
    }
    target.delete(Number(moduloId));
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
  }

  isBusquedaModuloCicloSelected(side: 'izquierda' | 'derecha', moduloId: number): boolean {
    const target = this.getBusquedaModuloEditableSelectionTarget(side);
    return target.has(Number(moduloId));
  }

  toggleBusquedaModuloSeleccionTotal(side: 'izquierda' | 'derecha', selected: boolean): void {
    const target = this.getBusquedaModuloEditableSelectionTarget(side);
    const visibleIds = this.getBusquedaModuloVisibleModuloIds(side);
    for (const cicloId of visibleIds) {
      if (selected) {
        target.add(cicloId);
      } else {
        target.delete(cicloId);
      }
    }
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
  }

  toggleBusquedaModuloSeleccion(side: 'izquierda' | 'derecha'): void {
    this.toggleBusquedaModuloSeleccionTotal(side, !this.isBusquedaModuloAllSelected(side));
  }

  isBusquedaModuloAllSelected(side: 'izquierda' | 'derecha'): boolean {
    const visibleIds = this.getBusquedaModuloVisibleModuloIds(side);
    if (visibleIds.length === 0) return false;
    const target = this.getBusquedaModuloEditableSelectionTarget(side);
    return visibleIds.every((cicloId) => target.has(cicloId));
  }

  totalBusquedaModuloModulosVisibles(side: 'izquierda' | 'derecha'): number {
    return this.getBusquedaModuloVisibleModuloIds(side).length;
  }

  toggleBusquedaModuloResultadoSeleccionTotal(
    side: 'izquierda' | 'derecha',
    resultado: AdminBusquedaModuloResultado,
    selected: boolean
  ): void {
    const target = this.getBusquedaModuloEditableSelectionTarget(side);
    for (const ciclo of resultado.ciclos) {
      const cicloId = Number(ciclo.moduloId);
      if (!Number.isFinite(cicloId)) continue;
      if (selected) {
        target.add(cicloId);
      } else {
        target.delete(cicloId);
      }
    }
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
  }

  toggleBusquedaModuloResultadoSeleccion(
    side: 'izquierda' | 'derecha',
    resultado: AdminBusquedaModuloResultado
  ): void {
    this.toggleBusquedaModuloResultadoSeleccionTotal(
      side,
      resultado,
      !this.isBusquedaModuloResultadoAllSelected(side, resultado)
    );
  }

  isBusquedaModuloResultadoAllSelected(
    side: 'izquierda' | 'derecha',
    resultado: AdminBusquedaModuloResultado
  ): boolean {
    if (!resultado.ciclos.length) return false;
    const target = this.getBusquedaModuloEditableSelectionTarget(side);
    return resultado.ciclos.every((ciclo) => {
      const cicloId = Number(ciclo.moduloId);
      return Number.isFinite(cicloId) && target.has(cicloId);
    });
  }

  get selectedBusquedaModuloOrigenItems(): AdminBusquedaModuloSeleccionItem[] {
    return this.getSelectedBusquedaModuloItems('izquierda', true);
  }

  get selectedBusquedaModuloDestinoItems(): AdminBusquedaModuloSeleccionItem[] {
    return this.getSelectedBusquedaModuloItems('derecha', true);
  }

  get totalBusquedaModuloOrigenSeleccionados(): number {
    return this.selectedBusquedaModuloOrigenItems.length;
  }

  get totalBusquedaModuloDestinoSeleccionados(): number {
    return this.selectedBusquedaModuloDestinoItems.length;
  }

  get canCrearConvalidacionesMultiples(): boolean {
    return this.totalCombinacionesConvalidacionMultiples > 0
      && !this.creatingMultipleConvalidaciones;
  }

  get totalCombinacionesConvalidacionMultiples(): number {
    return this.getBusquedaModuloCombinacionesMultiples().length;
  }

  setConvalidacionesMultiplesAction(action: AdminConvalidacionesMultiplesAction): void {
    this.convalidacionesMultiplesAction = action;
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
  }

  abrirModalEliminarConvalidacionesMultiples(): void {
    if (!this.canCrearConvalidacionesMultiples || this.creatingMultipleConvalidaciones) return;
    this.setConvalidacionesMultiplesAction('eliminar');
    this.deleteMultipleConvalidacionesModalOpen = true;
  }

  cerrarModalEliminarConvalidacionesMultiples(): void {
    this.deleteMultipleConvalidacionesModalOpen = false;
  }

  confirmarEliminarConvalidacionesMultiples(): void {
    if (this.creatingMultipleConvalidaciones) return;
    this.deleteMultipleConvalidacionesModalOpen = false;
    this.setConvalidacionesMultiplesAction('eliminar');
    this.crearConvalidacionesMultiples();
  }

  formatBusquedaModuloSeleccionItem(item: AdminBusquedaModuloSeleccionItem): string {
    if (item.origenTipo === 'ciclo') {
      return [
        item.cicloNombre.trim() || null,
        item.gradoNombre?.trim() || null,
        item.familiaNombre?.trim() || null,
      ]
        .filter((value): value is string => !!value)
        .join(' · ');
    }
    if (item.origenTipo === 'acreditacion_externa') {
      return item.moduloNombre?.trim() || item.cicloNombre.trim();
    }
    return [
      item.moduloCodigo?.trim() || null,
      item.moduloNombre?.trim() || null,
      item.cicloNombre.trim() || null,
    ]
      .filter((value): value is string => !!value)
      .join(' · ');
  }

  crearConvalidacionesMultiples(): void {
    const combinaciones = this.getBusquedaModuloCombinacionesMultiples();

    if (combinaciones.length === 0) {
      this.createMultipleConvalidacionesError = 'No hay combinaciones válidas para crear reglas de convalidación.';
      this.createMultipleConvalidacionesSuccess = null;
      return;
    }
    if (this.creatingMultipleConvalidaciones) return;

    const sourceLink = this.createMultipleConvalidacionesSourceLink.trim() || null;
    const rawSourcePage = this.createMultipleConvalidacionesSourcePage;
    const sourcePage = rawSourcePage === null || rawSourcePage === undefined
      ? null
      : Number(rawSourcePage);

    if (this.convalidacionesMultiplesAction === 'crear'
      && sourcePage !== null
      && (!Number.isInteger(sourcePage) || sourcePage <= 0)) {
      this.createMultipleConvalidacionesError = 'La página debe ser un número entero mayor que 0.';
      this.createMultipleConvalidacionesSuccess = null;
      return;
    }

    this.creatingMultipleConvalidaciones = true;
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
    const combinacionesModulo = combinaciones.filter((item): item is { tipo: 'modulo'; idModuloDestino: number; idModuloOrigen: number } => item.tipo === 'modulo');
    const combinacionesCiclo = combinaciones.filter((item): item is { tipo: 'ciclo'; idModuloDestino: number; idCicloOrigen: number } => item.tipo === 'ciclo');
    const requests: Array<Observable<AdminCreateConvalidacionesMasivasResponse | AdminDeleteConvalidacionesMasivasResponse>> = [];

    if (combinacionesModulo.length > 0) {
      requests.push(
        this.convalidacionesMultiplesAction === 'crear'
          ? this.convalidacionesService.crearConvalidacionesMasivasAdmin({
              reglas: combinacionesModulo.map((item) => ({
                id_modulo_destino: item.idModuloDestino,
                id_modulo_origen: item.idModuloOrigen,
              })),
              source_link: sourceLink,
              source_page: sourcePage,
            })
          : this.convalidacionesService.eliminarConvalidacionesMasivasAdmin({
              reglas: combinacionesModulo.map((item) => ({
                id_modulo_destino: item.idModuloDestino,
                id_modulo_origen: item.idModuloOrigen,
              })),
            })
      );
    }

    if (combinacionesCiclo.length > 0) {
      requests.push(
        this.convalidacionesMultiplesAction === 'crear'
          ? this.convalidacionesService.crearConvalidacionesCicloMasivasAdmin({
              reglas: combinacionesCiclo.map((item) => ({
                id_modulo_destino: item.idModuloDestino,
                id_ciclo_origen: item.idCicloOrigen,
              })),
              source_link: sourceLink,
              source_page: sourcePage,
            })
          : this.convalidacionesService.eliminarConvalidacionesCicloMasivasAdmin({
              reglas: combinacionesCiclo.map((item) => ({
                id_modulo_destino: item.idModuloDestino,
                id_ciclo_origen: item.idCicloOrigen,
              })),
            })
      );
    }

    const request$ = forkJoin(requests);

    request$
      .pipe(
        finalize(() => {
          this.creatingMultipleConvalidaciones = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (responses: Array<AdminCreateConvalidacionesMasivasResponse | AdminDeleteConvalidacionesMasivasResponse>) => {
          this.createMultipleConvalidacionesResultAction = this.convalidacionesMultiplesAction;
          const processedCount = responses.reduce((acc, resp) => acc + Number(this.convalidacionesMultiplesAction === 'crear'
            ? (resp as any)?.created_count || 0
            : (resp as any)?.deleted_count || 0), 0);
          const skippedCount = responses.reduce((acc, resp) => acc + Number(this.convalidacionesMultiplesAction === 'crear'
            ? (resp as any)?.skipped_existing_count || 0
            : (resp as any)?.skipped_missing_count || 0), 0);
          this.createMultipleConvalidacionesResultCreatedCount = processedCount;
          this.createMultipleConvalidacionesResultSkippedCount = skippedCount;
          this.createMultipleConvalidacionesResultModalOpen = true;
          this.createMultipleConvalidacionesSuccess = null;
          this.deleteMultipleConvalidacionesModalOpen = false;
          this.selectedBusquedaModuloIzquierda.clear();
          this.selectedBusquedaModuloDerecha.clear();
          this.createMultipleConvalidacionesSourceLink = '';
          this.createMultipleConvalidacionesSourcePage = null;
          this.errorConvalidaciones = null;
          if (this.hasConvalidacionesFiltroAplicado) {
            this.cargarConvalidaciones(true);
          }
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.deleteMultipleConvalidacionesModalOpen = false;
          this.createMultipleConvalidacionesError = err?.error?.detail || 'No se pudieron crear las reglas de convalidación.';
          this.cdr.detectChanges();
        },
      });
  }

  cerrarModalResultadoConvalidacionesMultiples(): void {
    this.createMultipleConvalidacionesResultModalOpen = false;
    this.createMultipleConvalidacionesResultAction = 'crear';
    this.createMultipleConvalidacionesResultCreatedCount = 0;
    this.createMultipleConvalidacionesResultSkippedCount = 0;
  }

  abrirModalBusquedaOrigen(): void {
    this.draftSelectedBusquedaModuloIzquierda = new Set(this.selectedBusquedaModuloIzquierda);
    this.busquedaOrigenModalOpen = true;
  }

  cerrarModalBusquedaOrigen(): void {
    this.draftSelectedBusquedaModuloIzquierda = new Set(this.selectedBusquedaModuloIzquierda);
    this.busquedaOrigenModalOpen = false;
  }

  guardarModalBusquedaOrigen(): void {
    this.selectedBusquedaModuloIzquierda = new Set(this.draftSelectedBusquedaModuloIzquierda);
    this.busquedaOrigenModalOpen = false;
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
  }

  abrirModalBusquedaDestino(): void {
    this.draftSelectedBusquedaModuloDerecha = new Set(this.selectedBusquedaModuloDerecha);
    this.busquedaDestinoModalOpen = true;
  }

  cerrarModalBusquedaDestino(): void {
    this.draftSelectedBusquedaModuloDerecha = new Set(this.selectedBusquedaModuloDerecha);
    this.busquedaDestinoModalOpen = false;
  }

  guardarModalBusquedaDestino(): void {
    this.selectedBusquedaModuloDerecha = new Set(this.draftSelectedBusquedaModuloDerecha);
    this.busquedaDestinoModalOpen = false;
    this.createMultipleConvalidacionesError = null;
    this.createMultipleConvalidacionesSuccess = null;
  }

  private getBusquedaModuloEditableSelectionTarget(side: 'izquierda' | 'derecha'): Set<number> {
    if (side === 'izquierda') {
      return this.busquedaOrigenModalOpen ? this.draftSelectedBusquedaModuloIzquierda : this.selectedBusquedaModuloIzquierda;
    }
    return this.busquedaDestinoModalOpen ? this.draftSelectedBusquedaModuloDerecha : this.selectedBusquedaModuloDerecha;
  }

  private getBusquedaModuloCombinacionesMultiples(): Array<
    | { tipo: 'modulo'; idModuloDestino: number; idModuloOrigen: number }
    | { tipo: 'ciclo'; idModuloDestino: number; idCicloOrigen: number }
  > {
    const origenItems = this.selectedBusquedaModuloOrigenItems;
    const destinoItems = this.selectedBusquedaModuloDestinoItems;
    const combinaciones: Array<
      | { tipo: 'modulo'; idModuloDestino: number; idModuloOrigen: number }
      | { tipo: 'ciclo'; idModuloDestino: number; idCicloOrigen: number }
    > = [];
    const seen = new Set<string>();

    for (const destino of destinoItems) {
      for (const origen of origenItems) {
        if (origen.origenTipo === 'modulo' || origen.origenTipo === 'acreditacion_externa') {
          if (destino.moduloId === origen.moduloId && destino.cicloId === origen.cicloId) {
            continue;
          }
          const key = `modulo::${destino.moduloId}::${origen.moduloId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          combinaciones.push({
            tipo: 'modulo',
            idModuloDestino: Number(destino.moduloId),
            idModuloOrigen: Number(origen.moduloId),
          });
          continue;
        }

        const key = `ciclo::${destino.moduloId}::${origen.cicloId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        combinaciones.push({
          tipo: 'ciclo',
          idModuloDestino: Number(destino.moduloId),
          idCicloOrigen: Number(origen.cicloId),
        });
      }
    }

    return combinaciones.filter(
      (item) => Number.isFinite(item.idModuloDestino)
        && item.idModuloDestino > 0
        && (
          (item.tipo === 'modulo' && Number.isFinite(item.idModuloOrigen) && item.idModuloOrigen > 0)
          || (item.tipo === 'ciclo' && Number.isFinite(item.idCicloOrigen) && item.idCicloOrigen > 0)
        )
    );
  }

  private getSelectedBusquedaModuloItems(
    side: 'izquierda' | 'derecha',
    onlyVisible = false
  ): AdminBusquedaModuloSeleccionItem[] {
    const target = side === 'izquierda' ? this.selectedBusquedaModuloIzquierda : this.selectedBusquedaModuloDerecha;
    const visibleIds = onlyVisible ? new Set(this.getBusquedaModuloVisibleModuloIds(side)) : null;
    const items: AdminBusquedaModuloSeleccionItem[] = [];
    if (side === 'izquierda' && this.filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos') {
      for (const ciclo of this.ciclosConModulos) {
        const cicloId = Number(ciclo.id);
        const selectableId = -cicloId;
        if (!Number.isFinite(cicloId) || !target.has(selectableId)) continue;
        if (visibleIds && !visibleIds.has(selectableId)) continue;
        items.push({
          origenTipo: 'ciclo',
          moduloId: null,
          moduloNombre: null,
          moduloCodigo: null,
          cicloId,
          cicloNombre: String(ciclo.nombre || '').trim().replace(/\s+/g, ' '),
          gradoNombre: ciclo.grado_nombre?.trim() || null,
          familiaNombre: ciclo.familia_nombre?.trim() || null,
        });
      }
      return items.sort((a, b) => a.cicloNombre.localeCompare(b.cicloNombre, 'es', { sensitivity: 'base' }));
    }

    for (const ciclo of this.ciclosConModulos) {
      const cicloNombre = String(ciclo.nombre || '').trim().replace(/\s+/g, ' ');
      const gradoNombre = ciclo.grado_nombre?.trim() || null;
      const familiaNombre = ciclo.familia_nombre?.trim() || null;
      for (const modulo of ciclo.modulos || []) {
        const moduloId = Number(modulo.id);
        if (!Number.isFinite(moduloId) || !target.has(moduloId)) continue;
        if (visibleIds && !visibleIds.has(moduloId)) continue;
        items.push({
          origenTipo: side === 'derecha'
            ? 'destino'
            : (this.filtroBusquedaModuloIzquierdaOrigenTipo === 'acreditaciones' ? 'acreditacion_externa' : 'modulo'),
          moduloId,
          moduloNombre: String(modulo.nombre || '').trim().replace(/\s+/g, ' '),
          moduloCodigo: (modulo.id_oficial || '').trim() || null,
          cicloId: Number(ciclo.id),
          cicloNombre,
          gradoNombre,
          familiaNombre,
        });
      }
    }
    return items.sort((a, b) => {
      const byModulo = (a.moduloNombre || '').localeCompare(b.moduloNombre || '', 'es', { sensitivity: 'base' });
      if (byModulo !== 0) return byModulo;
      return a.cicloNombre.localeCompare(b.cicloNombre, 'es', { sensitivity: 'base' });
    });
  }

  private evaluateHeaderLayout(): void {
    if (!this.isAuthenticated) {
      this.useMenuTabs = false;
      this.menuTabsOpen = false;
      return;
    }

    // On wide desktops keep tabs visible in the top bar.
    if (window.innerWidth >= 1280) {
      if (this.useMenuTabs) {
        this.useMenuTabs = false;
        this.menuTabsOpen = false;
        this.cdr.detectChanges();
      }
      return;
    }

    const container = this.headerInnerRef?.nativeElement;
    const brand = this.headerBrandRef?.nativeElement;
    const tabsMeasure = this.headerTabsMeasureRef?.nativeElement;
    const actionsMeasure = this.headerActionsMeasureRef?.nativeElement;
    if (!container || !brand || !tabsMeasure || !actionsMeasure) return;

    const availableWidth = Math.ceil(container.getBoundingClientRect().width);
    const requiredWidth =
      Math.ceil(brand.getBoundingClientRect().width) +
      Math.ceil(tabsMeasure.getBoundingClientRect().width) +
      Math.ceil(actionsMeasure.getBoundingClientRect().width) +
      56;

    const shouldUseMenu = requiredWidth > availableWidth;
    if (shouldUseMenu !== this.useMenuTabs) {
      this.useMenuTabs = shouldUseMenu;
      if (!shouldUseMenu) this.menuTabsOpen = false;
      this.cdr.detectChanges();
    }
  }

  private loadActiveTab(): void {
    if (!this.isAuthenticated) return;

    if (this.activeTab === 'formularios') {
      this.cargarFormularios(this.getFormularioEstadoBackend());
      return;
    }
    if (this.activeTab === 'modulos') {
      this.cargarCiclosModulos();
      return;
    }
    if (this.activeTab === 'convalidaciones') {
      this.cargarCiclosModulos();
      this.loadConvalidacionesGrados();
      this.loadConvalidacionesCiclos();
      return;
    }
    this.cargarAdministradores();
  }

  private getFormularioEstadoBackend(): 0 | 1 | 2 | 3 | 4 {
    if (this.formularioEstadoFiltro === 3) {
      return this.archivadasEstadoFiltro;
    }
    return this.formularioEstadoFiltro;
  }

  cargarFormularios(estadoId: 0 | 1 | 2 | 3 | 4 = this.getFormularioEstadoBackend()): void {
    if (!this.isAuthenticated) return;

    this.loading = true;
    this.error = null;

    this.convalidacionesService.getFormulariosAdmin(estadoId).subscribe({
      next: (rows) => {
        const nextFormularios = Array.isArray(rows)
          ? rows.map((row) => ({
              ...row,
              solicitudes: Array.isArray(row?.solicitudes) ? row.solicitudes : [],
              modulos_aportados: Array.isArray(row?.modulos_aportados) ? row.modulos_aportados : [],
              documentos_aportados: Array.isArray(row?.documentos_aportados) ? row.documentos_aportados : [],
            }))
          : [];
        this.reconcileDocumentoPreviews(nextFormularios);
        this.formularios = nextFormularios;
        this.syncCursoAcademicoFiltro();
        this.alumnos = this.groupByAlumno(this.formularios);
        if (!this.loadedModulos && !this.loadingModulos) {
          this.cargarCiclosModulos();
        }
        this.loading = false;
        this.cdr.detectChanges();
        queueMicrotask(() => this.restoreAllDocumentoPreviewFrames());
      },
      error: (err) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.error = `No se han podido cargar los formularios${status}.`;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  setFormularioEstadoFiltro(estado: 0 | 1 | 2 | 3): void {
    this.formularioEstadoFiltro = estado;
    if (estado === 3) {
      this.archivadasEstadoFiltro = 3;
    }
    this.openAlumnos.clear();
    this.cargarFormularios(this.getFormularioEstadoBackend());
  }

  setArchivadasEstadoFiltro(estado: 3 | 4): void {
    this.archivadasEstadoFiltro = estado;
    this.openAlumnos.clear();
    this.cargarFormularios(this.getFormularioEstadoBackend());
  }

  volverDesdeArchivadas(): void {
    this.setFormularioEstadoFiltro(1);
  }

  setCursoAcademicoFiltro(curso: string): void {
    this.cursoAcademicoFiltro = curso || '';
    this.openAlumnos.clear();
  }

  get cursosAcademicosDisponibles(): string[] {
    const cursos = new Set<string>();
    for (const formulario of this.formularios) {
      const curso = this.getCursoAcademicoFormulario(formulario);
      if (curso) {
        cursos.add(curso);
      }
    }
    return Array.from(cursos).sort((a, b) => a.localeCompare(b, 'es'));
  }

  private syncCursoAcademicoFiltro(): void {
    const cursos = this.cursosAcademicosDisponibles;
    if (cursos.length === 0) {
      this.cursoAcademicoFiltro = '';
      return;
    }
    if (!this.cursoAcademicoFiltro || !cursos.includes(this.cursoAcademicoFiltro)) {
      this.cursoAcademicoFiltro = cursos[0];
    }
  }

  private getCursoAcademicoFormulario(formulario: AdminFormulario): string | null {
    const raw = formulario.enviado_at;
    if (!raw) return null;

    const fecha = new Date(raw);
    if (Number.isNaN(fecha.getTime())) return null;

    const month = fecha.getUTCMonth() + 1;
    const year = fecha.getUTCFullYear();

    if (month >= 9) {
      return `${year}-${year + 1}`;
    }
    if (month <= 7) {
      return `${year - 1}-${year}`;
    }
    return null;
  }

  get formulariosCursoAcademicoFiltrados(): AdminFormulario[] {
    if (!this.cursoAcademicoFiltro) return [];
    return this.formularios.filter((f) => this.getCursoAcademicoFormulario(f) === this.cursoAcademicoFiltro);
  }

  countFormulariosByEstado(estado: 0 | 1 | 2 | 3): number {
    if (estado !== this.formularioEstadoFiltro) return 0;
    return this.formulariosCursoAcademicoFiltrados.length;
  }

  countFormulariosArchivadosByEstado(estado: 3 | 4): number {
    if (this.formularioEstadoFiltro !== 3 || estado !== this.archivadasEstadoFiltro) return 0;
    return this.formulariosCursoAcademicoFiltrados.length;
  }

  get formulariosFiltrados(): AdminFormulario[] {
    return this.formulariosCursoAcademicoFiltrados;
  }

  get alumnosFiltrados(): AdminAlumnoGroup[] {
    return this.groupByAlumno(this.formulariosFiltrados);
  }

  get formulariosMostrados(): AdminFormulario[] {
    return this.formulariosFiltrados;
  }

  get alumnosMostrados(): AdminAlumnoGroup[] {
    return this.groupByAlumno(this.formulariosMostrados);
  }

  trackByAlumno(_index: number, alumno: AdminAlumnoGroup): string {
    return alumno.key;
  }

  trackByFormulario(_index: number, formulario: AdminFormulario): number {
    return formulario.id;
  }

  get formulariosValidadosExportables(): AdminFormulario[] {
    return this.formulariosCursoAcademicoFiltrados.filter((f) => f.estado_id === 1);
  }

  get formulariosRechazadosExportables(): AdminFormulario[] {
    return this.formulariosCursoAcademicoFiltrados.filter((f) => f.estado_id === 2);
  }

  get exportArchiveValidadosCount(): number {
    return this.formulariosValidadosExportables.length;
  }

  get exportArchiveRechazadosCount(): number {
    return this.formulariosRechazadosExportables.length;
  }

  get canConfirmExportArchive(): boolean {
    return (this.exportArchiveValidadosSelected && this.exportArchiveValidadosCount > 0)
      || (this.exportArchiveRechazadosSelected && this.exportArchiveRechazadosCount > 0);
  }

  exportarSolicitudesConvalidacion(): void {
    if (this.formularioEstadoFiltro !== 1) return;
    this.convalidacionesService.exportarSolicitudesConvalidacionAdmin().subscribe({
      next: async (blob) => {
        const fileName = 'solicitudes_convalidacion_validadas.xlsx';
        const picker = (window as any).showSaveFilePicker;

        if (typeof picker === 'function') {
          try {
            const handle = await picker({
              suggestedName: fileName,
              types: [
                {
                  description: 'Excel Workbook',
                  accept: {
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                  },
                },
              ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            this.abrirModalArchivarTrasExportar();
            return;
          } catch (e: any) {
            // Si cancela el diálogo, no hacemos fallback de descarga automática.
            if (e?.name === 'AbortError') return;
          }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.abrirModalArchivarTrasExportar();
      },
      error: (err) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.error = `No se pudo exportar solicitudes de convalidación${status}.`;
        this.cdr.detectChanges();
      },
    });
  }

  abrirModalArchivarTrasExportar(): void {
    this.exportArchiveValidadosSelected = this.exportArchiveValidadosCount > 0;
    this.exportArchiveRechazadosSelected = this.exportArchiveRechazadosCount > 0;
    this.exportArchiveError = null;
    this.exportArchiveModalOpen = true;
    this.cdr.detectChanges();
  }

  cerrarModalArchivarTrasExportar(force = false): void {
    if (!force && this.archivandoTrasExportar) return;
    this.exportArchiveModalOpen = false;
    this.exportArchiveError = null;
    this.cdr.detectChanges();
  }

  confirmarArchivarTrasExportar(): void {
    if (!this.canConfirmExportArchive || this.archivandoTrasExportar) return;

    const actualizaciones = [
      ...(this.exportArchiveValidadosSelected
        ? this.formulariosValidadosExportables.map((f) =>
            this.convalidacionesService.actualizarEstadoFormularioAdmin(f.id, 3, this.adminId)
          )
        : []),
      ...(this.exportArchiveRechazadosSelected
        ? this.formulariosRechazadosExportables.map((f) =>
            this.convalidacionesService.actualizarEstadoFormularioAdmin(f.id, 4, this.adminId)
          )
        : []),
    ];

    if (actualizaciones.length === 0) {
      this.cerrarModalArchivarTrasExportar(true);
      return;
    }

    this.archivandoTrasExportar = true;
    this.exportArchiveError = null;
    forkJoin(actualizaciones)
      .pipe(
        finalize(() => {
          this.archivandoTrasExportar = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cerrarModalArchivarTrasExportar(true);
          this.error = null;
          this.cargarFormularios(this.getFormularioEstadoBackend());
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          const status = err?.status ? ` (HTTP ${err.status})` : '';
          this.exportArchiveError = `No se pudieron archivar los formularios seleccionados${status}.`;
          this.cdr.detectChanges();
        },
      });
  }

  abrirDocumentoAportado(path: string): void {
    if (!path) return;

    this.convalidacionesService.abrirDocumentoAdmin(path).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (err: any) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.error = `No se pudo abrir el documento${status}.`;
        this.cdr.detectChanges();
      },
    });
  }

  seleccionarDocumentoPreview(formularioId: number, path: string): void {
    if (!path || this.documentoPreviewLoading.has(formularioId)) return;
    if (
      this.documentoPreviewSelectedPaths.get(formularioId) === path
      && this.documentoPreviewObjectUrls.has(formularioId)
    ) {
      return;
    }

    this.documentoPreviewSelectedPaths.set(formularioId, path);
    this.documentoPreviewErrors.delete(formularioId);
    this.documentoPreviewLoading.add(formularioId);

    this.convalidacionesService.abrirDocumentoAdmin(path).subscribe({
      next: (blob: Blob) => {
        const previousUrl = this.documentoPreviewObjectUrls.get(formularioId);
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        const objectUrl = URL.createObjectURL(blob);
        this.documentoPreviewObjectUrls.set(formularioId, objectUrl);
        this.documentoPreviewLoading.delete(formularioId);
        this.cdr.detectChanges();
        queueMicrotask(() => this.setDocumentoPreviewFrameSrc(formularioId, objectUrl));
      },
      error: (err: any) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.documentoPreviewErrors.set(formularioId, `No se pudo cargar el documento${status}.`);
        this.documentoPreviewLoading.delete(formularioId);
        this.cdr.detectChanges();
      },
    });
  }

  hasDocumentoPreviewUrl(formularioId: number): boolean {
    return this.documentoPreviewObjectUrls.has(formularioId);
  }

  isDocumentoPreviewLoading(formularioId: number): boolean {
    return this.documentoPreviewLoading.has(formularioId);
  }

  getDocumentoPreviewError(formularioId: number): string | null {
    return this.documentoPreviewErrors.get(formularioId) ?? null;
  }

  isDocumentoPreviewSelected(formularioId: number, path: string): boolean {
    return this.documentoPreviewSelectedPaths.get(formularioId) === path;
  }

  getDocumentoDisplayName(
    documento: { descripcion?: string | null; nombre_archivo?: string | null; ruta_almacenamiento?: string | null },
    index?: number
  ): string {
    const descripcion = String(documento.descripcion || '').trim();
    if (descripcion) return descripcion;
    const nombreArchivo = String(documento.nombre_archivo || '').trim();
    if (nombreArchivo) return nombreArchivo;

    const ruta = String(documento.ruta_almacenamiento || '').trim();
    const rutaNormalizada = ruta.replace(/\\/g, '/');
    const nombreDesdeRuta = rutaNormalizada.split('/').pop()?.trim() || '';
    if (nombreDesdeRuta) return nombreDesdeRuta;

    if (typeof index === 'number') {
      return `Documento ${index + 1}`;
    }
    return 'Documento';
  }

  getDocumentoPreviewSeleccionado(
    formulario: AdminFormulario
  ): { ruta_almacenamiento: string; descripcion?: string | null; nombre_archivo: string } | null {
    const selectedPath = this.documentoPreviewSelectedPaths.get(formulario.id);
    if (!selectedPath) return null;
    return (formulario.documentos_aportados || []).find((documento) => documento.ruta_almacenamiento === selectedPath) ?? null;
  }

  abrirDocumentoPreviewSeleccionado(formulario: AdminFormulario): void {
    const documento = this.getDocumentoPreviewSeleccionado(formulario);
    if (!documento) return;
    this.abrirDocumentoAportado(documento.ruta_almacenamiento);
  }

  descargarDocumentoPreviewSeleccionado(formulario: AdminFormulario): void {
    const documento = this.getDocumentoPreviewSeleccionado(formulario);
    if (!documento) return;
    this.descargarDocumentoAportado(
      documento.ruta_almacenamiento,
      documento.descripcion || documento.nombre_archivo
    );
  }

  private clearDocumentoPreviews(): void {
    this.documentoPreviewObjectUrls.forEach((_, formularioId) => this.setDocumentoPreviewFrameSrc(formularioId, 'about:blank'));
    this.documentoPreviewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.documentoPreviewObjectUrls.clear();
    this.documentoPreviewSelectedPaths.clear();
    this.documentoPreviewLoading.clear();
    this.documentoPreviewErrors.clear();
  }

  getDocumentoPreviewFrameId(formularioId: number): string {
    return `documento-preview-${formularioId}`;
  }

  private setDocumentoPreviewFrameSrc(formularioId: number, src: string): void {
    const iframe = document.getElementById(this.getDocumentoPreviewFrameId(formularioId)) as HTMLIFrameElement | null;
    if (!iframe) return;
    if (iframe.src === src) return;
    iframe.src = src;
  }

  private restoreDocumentoPreviewFrame(formularioId: number): void {
    const objectUrl = this.documentoPreviewObjectUrls.get(formularioId);
    if (!objectUrl) return;
    this.setDocumentoPreviewFrameSrc(formularioId, objectUrl);
  }

  private restoreAllDocumentoPreviewFrames(): void {
    this.documentoPreviewObjectUrls.forEach((_, formularioId) => {
      this.restoreDocumentoPreviewFrame(formularioId);
    });
  }

  private reconcileDocumentoPreviews(formularios: AdminFormulario[]): void {
    const formulariosMap = new Map<number, AdminFormulario>();
    for (const formulario of formularios) {
      formulariosMap.set(formulario.id, formulario);
    }

    const previewIds = Array.from(this.documentoPreviewObjectUrls.keys());
    for (const formularioId of previewIds) {
      const formulario = formulariosMap.get(formularioId);
      const selectedPath = this.documentoPreviewSelectedPaths.get(formularioId);
      const shouldKeep = !!formulario
        && !!selectedPath
        && (formulario.documentos_aportados || []).some((documento) => documento.ruta_almacenamiento === selectedPath);

      if (shouldKeep) continue;

      this.setDocumentoPreviewFrameSrc(formularioId, 'about:blank');
      const objectUrl = this.documentoPreviewObjectUrls.get(formularioId);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      this.documentoPreviewObjectUrls.delete(formularioId);
      this.documentoPreviewSelectedPaths.delete(formularioId);
      this.documentoPreviewLoading.delete(formularioId);
      this.documentoPreviewErrors.delete(formularioId);
    }
  }

  descargarDocumentoAportado(path: string, fileName: string): void {
    if (!path) return;

    this.convalidacionesService.abrirDocumentoAdmin(path).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = (fileName || 'documento').trim() || 'documento';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (err: any) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.error = `No se pudo descargar el documento${status}.`;
        this.cdr.detectChanges();
      },
    });
  }

  cargarCiclosModulos(): void {
    if (!this.isAuthenticated || this.loadedModulos || this.loadingModulos) return;

    this.loadingModulos = true;
    this.errorModulos = null;

    this.convalidacionesService.getCiclosModulosAdmin().subscribe({
      next: (rows) => {
        const modalCicloId = this.modulosModalCiclo?.id ?? null;
        this.ciclosConModulos = Array.isArray(rows)
          ? rows.map((ciclo) => ({
              ...ciclo,
              modulos: Array.isArray(ciclo?.modulos) ? ciclo.modulos : [],
            }))
          : [];
        if (modalCicloId !== null) {
          this.modulosModalCiclo = this.ciclosConModulos.find((c) => c.id === modalCicloId) || null;
        }
        this.loadedModulos = true;
        this.loadingModulos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.errorModulos = `No se han podido cargar ciclos y modulos${status}.`;
        this.loadingModulos = false;
        this.cdr.detectChanges();
      },
    });
  }

  cargarConvalidaciones(force = false): void {
    if (!this.isAuthenticated || this.loadingConvalidaciones) return;
    if (!this.hasConvalidacionesFiltroAplicado) return;
    if (!force && this.loadedConvalidaciones) return;

    this.loadConvalidacionesGrados();

    this.loadingConvalidaciones = true;
    this.errorConvalidaciones = null;
    this.openConvalidaciones.clear();
    this.openConvalidacionCiclos.clear();

    this.convalidacionesService
      .getConvalidacionesAdmin(this.filtroConvalidacionesGradoId, this.filtroConvalidacionesCicloId)
      .subscribe({
        next: (rows) => {
          this.convalidaciones = Array.isArray(rows)
            ? rows.map((regla) => ({
                ...regla,
                origenes: Array.isArray(regla?.origenes) ? regla.origenes : [],
              }))
            : [];
          this.loadedConvalidaciones = true;
          this.loadingConvalidaciones = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          const status = err?.status ? ` (HTTP ${err.status})` : '';
          this.errorConvalidaciones = `No se han podido cargar las reglas de convalidacion${status}.`;
          this.loadingConvalidaciones = false;
          this.cdr.detectChanges();
        },
      });
  }

  private loadConvalidacionesGrados(): void {
    if (!this.isAuthenticated || this.loadedConvalidacionesGrados || this.loadingConvalidacionesGrados) return;
    this.loadingConvalidacionesGrados = true;
    this.catalogService.getGrados().subscribe({
      next: (rows) => {
        this.convalidacionesGrados = (Array.isArray(rows) ? rows : [])
          .map((item) => ({
            id: Number(item.id),
            nombre: String(item.nombre || '').trim().replace(/\s+/g, ' '),
          }))
          .filter((item) => Number.isFinite(item.id) && !!(item.nombre || '').trim())
          .sort((a, b) => this.compareGradosByPreferredOrder(a.nombre, b.nombre));
        this.loadedConvalidacionesGrados = true;
        this.loadingConvalidacionesGrados = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingConvalidacionesGrados = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadConvalidacionesCiclos(gradoId?: number | null): void {
    this.loadingConvalidacionesCiclos = true;
    this.catalogService.getCiclos(gradoId ?? undefined).subscribe({
      next: (rows) => {
        this.convalidacionesCiclos = (Array.isArray(rows) ? rows : [])
          .map((item) => ({
            id: Number(item.id),
            nombre: String(item.nombre || '').trim().replace(/\s+/g, ' '),
            id_oficial: item.id_oficial ?? null,
            normativa: item.normativa ?? null,
            id_familia: Number(item.id_familia),
            id_grado: Number(item.id_grado),
          }))
          .filter((item) => Number.isFinite(item.id) && !!(item.nombre || '').trim())
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        this.loadingConvalidacionesCiclos = false;
        if (
          this.filtroConvalidacionesCicloId &&
          !this.convalidacionesCiclos.some((ciclo) => Number(ciclo.id) === Number(this.filtroConvalidacionesCicloId))
        ) {
          this.filtroConvalidacionesCicloId = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.convalidacionesCiclos = [];
        this.loadingConvalidacionesCiclos = false;
        this.filtroConvalidacionesCicloId = null;
        this.cdr.detectChanges();
      },
    });
  }

  onFiltroConvalidacionesGradoChange(): void {
    this.filtroConvalidacionesCicloId = null;
    this.convalidaciones = [];
    this.openConvalidaciones.clear();
    this.openConvalidacionCiclos.clear();
    this.deletingConvalidacionCiclos.clear();
    this.cancelarEliminarConvalidacion(true);
    this.cerrarModalEditarConvalidacion(true);
    this.cerrarModalCrearConvalidacion(true);
    this.loadedConvalidaciones = false;

    this.loadConvalidacionesCiclos(this.filtroConvalidacionesGradoId);
  }

  onFiltroConvalidacionesCicloChange(): void {
    this.convalidaciones = [];
    this.openConvalidaciones.clear();
    this.openConvalidacionCiclos.clear();
    this.deletingConvalidacionCiclos.clear();
    this.cancelarEliminarConvalidacion(true);
    this.cerrarModalEditarConvalidacion(true);
    this.cerrarModalCrearConvalidacion(true);
    this.loadedConvalidaciones = false;

    const cicloSeleccionado = this.convalidacionesCiclos.find(
      (item) => Number(item.id) === Number(this.filtroConvalidacionesCicloId)
    );
    if (cicloSeleccionado && Number.isFinite(Number(cicloSeleccionado.id_grado))) {
      this.filtroConvalidacionesGradoId = Number(cicloSeleccionado.id_grado);
      this.loadConvalidacionesCiclos(this.filtroConvalidacionesGradoId);
    }

    if (!this.filtroConvalidacionesCicloId) {
      return;
    }
    this.cargarConvalidaciones(true);
  }

  limpiarFiltroConvalidaciones(): void {
    this.filtroConvalidacionesGradoId = null;
    this.filtroConvalidacionesCicloId = null;
    this.convalidaciones = [];
    this.openConvalidaciones.clear();
    this.openConvalidacionCiclos.clear();
    this.deletingConvalidacionCiclos.clear();
    this.cancelarEliminarConvalidacion(true);
    this.cerrarModalEditarConvalidacion(true);
    this.cerrarModalCrearConvalidacion(true);
    this.errorConvalidaciones = null;
    this.loadConvalidacionesCiclos();
    this.loadedConvalidaciones = false;
  }

  get hasConvalidacionesFiltroAplicado(): boolean {
    return !!this.filtroConvalidacionesCicloId;
  }

  get cicloConvalidacionesSeleccionadoNombre(): string {
    if (!this.filtroConvalidacionesCicloId) return 'seleccionado';
    const ciclo = this.convalidacionesCiclos.find(
      (item) => Number(item.id) === Number(this.filtroConvalidacionesCicloId)
    );
    return ciclo?.nombre || 'seleccionado';
  }

  cargarAdministradores(): void {
    if (!this.isAuthenticated || this.loadedAdministradores || this.loadingAdministradores) return;

    this.loadingAdministradores = true;
    this.errorAdministradores = null;

    this.convalidacionesService.getAdministradoresAdmin().subscribe({
      next: (rows) => {
        this.administradores = Array.isArray(rows) ? rows : [];
        this.loadedAdministradores = true;
        this.loadingAdministradores = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.errorAdministradores = `No se han podido cargar administradores${status}.`;
        this.loadingAdministradores = false;
        this.cdr.detectChanges();
      },
    });
  }

  get isRootAdminSession(): boolean {
    return this.adminDisplayName.trim().toLowerCase() === 'admin';
  }

  get canCrearAdministrador(): boolean {
    return this.isRootAdminSession && this.createAdminNombre.trim().length > 0 && this.createAdminPassword.length > 0;
  }

  abrirModalCrearAdministrador(): void {
    if (!this.isRootAdminSession || this.creatingAdmin) return;
    this.createAdminModalOpen = true;
    this.createAdminNombre = '';
    this.createAdminPassword = '';
    this.createAdminError = null;
  }

  cerrarModalCrearAdministrador(): void {
    if (this.creatingAdmin) return;
    this.createAdminModalOpen = false;
    this.createAdminError = null;
  }

  crearAdministrador(): void {
    if (!this.canCrearAdministrador || this.creatingAdmin) return;

    const nombre = this.createAdminNombre.trim();
    const password = this.createAdminPassword;
    this.creatingAdmin = true;
    this.createAdminError = null;

    this.convalidacionesService
      .crearAdministradorAdmin({ nombre, password })
      .pipe(
        finalize(() => {
          this.creatingAdmin = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.createAdminNombre = '';
          this.createAdminPassword = '';
          this.createAdminError = null;
          this.createAdminModalOpen = false;
          this.loadedAdministradores = false;
          this.cargarAdministradores();
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.createAdminError = err?.error?.detail || 'No se pudo crear el administrador.';
        },
      });
  }

  canGestionarAdministrador(admin: AdminUser): boolean {
    const filaAdmin = (admin?.nombre || '').trim().toLowerCase() === 'admin';
    return this.isRootAdminSession && !filaAdmin;
  }

  get canActualizarAdministrador(): boolean {
    if (!this.adminToEdit) return false;
    const nombre = this.editAdminNombre.trim();
    const password = this.editAdminPassword;
    if (!nombre) return false;
    const nombreOriginal = (this.adminToEdit.nombre || '').trim();
    const nombreCambio = nombre !== nombreOriginal;
    const passwordCambio = password.length > 0;
    return nombreCambio || passwordCambio;
  }

  abrirModalEditarAdministrador(admin: AdminUser): void {
    if (!this.canGestionarAdministrador(admin) || this.editingAdmin) return;
    this.adminToEdit = admin;
    this.editAdminNombre = admin.nombre || '';
    this.editAdminPassword = '';
    this.editAdminError = null;
    this.editAdminModalOpen = true;
  }

  cerrarModalEditarAdministrador(force = false): void {
    if (!force && this.editingAdmin) return;
    this.editAdminModalOpen = false;
    this.adminToEdit = null;
    this.editAdminNombre = '';
    this.editAdminPassword = '';
    this.editAdminError = null;
  }

  actualizarAdministrador(): void {
    if (!this.adminToEdit || !this.canActualizarAdministrador || this.editingAdmin) return;
    const adminId = Number(this.adminToEdit.id);
    if (!Number.isFinite(adminId) || adminId <= 0) return;

    const nombre = this.editAdminNombre.trim();
    const password = this.editAdminPassword;
    const payload: { nombre?: string; password?: string } = {};
    if (nombre !== (this.adminToEdit.nombre || '').trim()) {
      payload.nombre = nombre;
    }
    if (password.length > 0) {
      payload.password = password;
    }
    if (!payload.nombre && !payload.password) return;

    this.editingAdmin = true;
    this.editAdminError = null;
    this.convalidacionesService
      .actualizarAdministradorAdmin(adminId, payload)
      .pipe(
        finalize(() => {
          this.editingAdmin = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cerrarModalEditarAdministrador(true);
          this.loadedAdministradores = false;
          this.cargarAdministradores();
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.editAdminError = err?.error?.detail || 'No se pudo actualizar el administrador.';
        },
      });
  }

  abrirModalEliminarAdministrador(admin: AdminUser): void {
    if (!this.canGestionarAdministrador(admin) || this.deletingAdmin) return;
    this.adminToDelete = admin;
    this.deleteAdminError = null;
    this.deleteAdminModalOpen = true;
  }

  cerrarModalEliminarAdministrador(force = false): void {
    if (!force && this.deletingAdmin) return;
    this.deleteAdminModalOpen = false;
    this.adminToDelete = null;
    this.deleteAdminError = null;
  }

  confirmarEliminarAdministrador(): void {
    if (!this.adminToDelete || this.deletingAdmin) return;
    const adminId = Number(this.adminToDelete.id);
    if (!Number.isFinite(adminId) || adminId <= 0) return;

    this.deletingAdmin = true;
    this.deleteAdminError = null;
    this.convalidacionesService
      .eliminarAdministradorAdmin(adminId)
      .pipe(
        finalize(() => {
          this.deletingAdmin = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cerrarModalEliminarAdministrador(true);
          this.loadedAdministradores = false;
          this.cargarAdministradores();
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.deleteAdminError = err?.error?.detail || 'No se pudo eliminar el administrador.';
        },
      });
  }

  get totalModulosCatalogo(): number {
    return this.ciclosCatalogo.reduce((acc, ciclo) => acc + (ciclo.total_modulos || 0), 0);
  }

  get modulosModalActivos(): AdminCicloModulo[] {
    return (this.modulosModalCiclo?.modulos || []).filter((modulo) => !modulo.deprecated);
  }

  get modulosModalDeprecated(): AdminCicloModulo[] {
    return (this.modulosModalCiclo?.modulos || []).filter((modulo) => !!modulo.deprecated);
  }

  private isAcreditacionExternaCiclo(ciclo: AdminCicloConModulos): boolean {
    const familia = (ciclo.familia_nombre || '').trim();
    const grado = (ciclo.grado_nombre || '').trim();
    return !familia && !grado;
  }

  get ciclosCatalogo(): AdminCicloConModulos[] {
    return this.ciclosConModulos.filter((ciclo) => !this.isAcreditacionExternaCiclo(ciclo));
  }

  get ciclosAcreditacionesExternasCatalogo(): AdminCicloConModulos[] {
    return this.ciclosConModulos.filter((ciclo) => this.isAcreditacionExternaCiclo(ciclo));
  }

  get acreditacionExternaCiclo(): AdminCicloConModulos | null {
    return this.ciclosAcreditacionesExternasCatalogo[0] || null;
  }

  get modulosAcreditacionesExternas(): Array<AdminCicloModulo & { cicloNombre: string }> {
    const modulos = new Map<number, AdminCicloModulo & { cicloNombre: string }>();
    for (const ciclo of this.ciclosAcreditacionesExternasCatalogo) {
      for (const modulo of ciclo.modulos || []) {
        modulos.set(modulo.id, { ...modulo, cicloNombre: ciclo.nombre });
      }
    }
    return Array.from(modulos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  get acreditacionesExternasAgrupadas(): AdminAcreditacionExternaGroup[] {
    const orderedKeys = ['certificado_idioma', 'titulo_universitario', 'otros'];
    const labels: Record<string, string> = {
      certificado_idioma: 'Certificado de idioma',
      titulo_universitario: 'Título universitario',
      otros: 'Otros',
    };

    const grouped = new Map<string, Array<AdminCicloModulo & { cicloNombre: string }>>();
    for (const key of orderedKeys) {
      grouped.set(key, []);
    }

    for (const modulo of this.modulosAcreditacionesExternas) {
      const rawCode = (modulo.id_oficial || '').trim().toLowerCase();
      const key = orderedKeys.includes(rawCode) ? rawCode : 'otros';
      grouped.get(key)!.push(modulo);
    }

    return orderedKeys
      .map((key) => ({
        key,
        label: labels[key],
        modulos: grouped.get(key) || [],
      }))
      .filter((group) => group.modulos.length > 0);
  }

  get familiasCreateCiclo(): Array<{ id: number; nombre: string }> {
    const familias = new Map<number, string>();
    for (const ciclo of this.ciclosCatalogo) {
      if (ciclo.id_familia === null) continue;
      const nombre = (ciclo.familia_nombre || '').trim();
      if (!nombre) continue;
      familias.set(Number(ciclo.id_familia), nombre);
    }
    return Array.from(familias.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  get gradosCreateCiclo(): Array<{ id: number; nombre: string }> {
    const grados = new Map<number, string>();
    for (const ciclo of this.ciclosCatalogo) {
      if (ciclo.id_grado === null) continue;
      const nombre = (ciclo.grado_nombre || '').trim();
      if (!nombre) continue;
      grados.set(Number(ciclo.id_grado), nombre);
    }
    return Array.from(grados.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  private familiaNombre(ciclo: AdminCicloConModulos): string {
    return (ciclo.familia_nombre || '').trim() || 'Sin familia';
  }

  private gradoNombre(ciclo: AdminCicloConModulos): string {
    return (ciclo.grado_nombre || '').trim() || 'Sin grado';
  }

  get familiasFiltroModulos(): string[] {
    return Array.from(new Set(this.ciclosCatalogo.map((c) => this.familiaNombre(c))))
      .sort((a, b) => a.localeCompare(b, 'es'));
  }

  get gradosFiltroModulos(): string[] {
    const queryFamilia = this.filtroFamiliaModulos.trim().toLowerCase();
    const base = queryFamilia
      ? this.ciclosCatalogo.filter((c) => this.familiaNombre(c).toLowerCase().includes(queryFamilia))
      : this.ciclosCatalogo;
    return Array.from(new Set(base.map((c) => this.gradoNombre(c))))
      .sort((a, b) => a.localeCompare(b, 'es'));
  }

  get ciclosFiltroModulos(): AdminCicloConModulos[] {
    const queryFamilia = this.filtroFamiliaModulos.trim().toLowerCase();
    const queryGrado = this.filtroGradoModulos.trim().toLowerCase();
    let base = this.ciclosCatalogo;
    if (queryFamilia) {
      base = base.filter((c) => this.familiaNombre(c).toLowerCase().includes(queryFamilia));
    }
    if (queryGrado) {
      base = base.filter((c) => this.gradoNombre(c).toLowerCase().includes(queryGrado));
    }
    return [...base].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  get ciclosConModulosFiltrados(): AdminCicloConModulos[] {
    const queryFamilia = this.filtroFamiliaModulos.trim().toLowerCase();
    const queryGrado = this.filtroGradoModulos.trim().toLowerCase();
    const queryCiclo = this.filtroCicloModulos.trim().toLowerCase();

    return this.ciclosCatalogo.filter((ciclo) => {
      if (queryFamilia && !this.familiaNombre(ciclo).toLowerCase().includes(queryFamilia)) return false;
      if (queryGrado && !this.gradoNombre(ciclo).toLowerCase().includes(queryGrado)) return false;
      if (queryCiclo && !ciclo.nombre.toLowerCase().includes(queryCiclo)) return false;
      return true;
    });
  }

  get ciclosModulosAgrupados(): AdminFamiliaGradosGroup[] {
    const familiasMap = new Map<string, AdminFamiliaGradosGroup>();

    for (const ciclo of this.ciclosConModulosFiltrados) {
      const familiaNombre = (ciclo.familia_nombre || '').trim() || 'Sin familia';
      const familiaKey = String(ciclo.id_familia ?? `sin-familia-${familiaNombre}`);

      if (!familiasMap.has(familiaKey)) {
        familiasMap.set(familiaKey, {
          key: familiaKey,
          familiaNombre,
          familiaId: ciclo.id_familia ?? null,
          ciclos: [],
        });
      }
      const familia = familiasMap.get(familiaKey)!;
      familia.ciclos.push(ciclo);
    }

    const familias = Array.from(familiasMap.values());
    familias.sort((a, b) => a.familiaNombre.localeCompare(b.familiaNombre, 'es'));
    for (const familia of familias) {
      familia.ciclos.sort((a, b) => {
        const gradoA = (a.grado_nombre || '').trim() || 'Sin grado';
        const gradoB = (b.grado_nombre || '').trim() || 'Sin grado';
        const rankGrado = (grado: string): number => {
          const g = grado.toLowerCase();
          if (g.includes('basico')) return 1;
          if (g.includes('medio')) return 2;
          if (g.includes('superior')) return 3;
          if (g.includes('especializ')) return 4;
          if (g.includes('sin grado')) return 99;
          return 50;
        };
        const byRank = rankGrado(gradoA) - rankGrado(gradoB);
        if (byRank !== 0) return byRank;
        const byGrado = gradoA.localeCompare(gradoB, 'es');
        if (byGrado !== 0) return byGrado;
        return a.nombre.localeCompare(b.nombre, 'es');
      });
    }

    return familias;
  }

  get convalidacionesFiltradas(): AdminConvalidacionRegla[] {
    return this.convalidaciones;
  }

  get busquedaModuloIzquierdaNormalizada(): string {
    return this.normalizeSearchText(this.busquedaModuloIzquierda);
  }

  get busquedaModuloDerechaNormalizada(): string {
    return this.normalizeSearchText(this.busquedaModuloDerecha);
  }

  get gradosBusquedaModuloIzquierda(): string[] {
    return this.getBusquedaModuloGrados(this.filtroBusquedaModuloIzquierdaFamilia, this.filtroBusquedaModuloIzquierdaOrigenTipo);
  }

  get familiasBusquedaModuloIzquierda(): string[] {
    return this.getBusquedaModuloFamilias(this.filtroBusquedaModuloIzquierdaGrado, this.filtroBusquedaModuloIzquierdaOrigenTipo);
  }

  get gradosBusquedaModuloDerecha(): string[] {
    return this.getBusquedaModuloGrados(this.filtroBusquedaModuloDerechaFamilia);
  }

  get familiasBusquedaModuloDerecha(): string[] {
    return this.getBusquedaModuloFamilias(this.filtroBusquedaModuloDerechaGrado);
  }

  get resultadosBusquedaModuloIzquierda(): AdminBusquedaModuloResultado[] {
    return this.buscarModulosEnCiclos(
      this.busquedaModuloIzquierdaNormalizada,
      this.filtroBusquedaModuloIzquierdaGrado,
      this.filtroBusquedaModuloIzquierdaFamilia,
      this.filtroBusquedaModuloIzquierdaOrigenTipo
    );
  }

  get resultadosBusquedaModuloDerecha(): AdminBusquedaModuloResultado[] {
    return this.buscarModulosEnCiclos(
      this.busquedaModuloDerechaNormalizada,
      this.filtroBusquedaModuloDerechaGrado,
      this.filtroBusquedaModuloDerechaFamilia
    );
  }

  get convalidacionesAgrupadas(): AdminConvalidacionModuloAgrupado[] {
    const modulosMap = new Map<number, {
      idModuloDestino: number;
      moduloDestinoNombre: string;
      moduloDestinoCodigo: string | null;
      cicloDestinoNombre: string;
      ciclosMap: Map<string, {
        cicloOrigenNombre: string;
        esCicloCompleto: boolean;
        modulosOrigenMap: Map<string, { nombre: string; codigo: string | null }>;
        fuentesMap: Map<string, { sourceLink: string | null; sourcePage: number | null }>;
        reglas: Set<number>;
      }>;
    }>();

    for (const regla of this.convalidacionesFiltradas) {
      const moduloId = Number(regla.id_modulo_destino);
      if (!modulosMap.has(moduloId)) {
        modulosMap.set(moduloId, {
          idModuloDestino: moduloId,
          moduloDestinoNombre: regla.modulo_destino_nombre,
          moduloDestinoCodigo: regla.modulo_destino_codigo ?? null,
          cicloDestinoNombre: regla.ciclo_destino_nombre,
          ciclosMap: new Map(),
        });
      }
      const modulo = modulosMap.get(moduloId)!;
      for (const origen of regla.origenes || []) {
        const cicloOrigenNombre = (origen.ciclo_origen_nombre || '').trim() || 'Ciclo origen sin nombre';
        if (!modulo.ciclosMap.has(cicloOrigenNombre)) {
          modulo.ciclosMap.set(cicloOrigenNombre, {
            cicloOrigenNombre,
            esCicloCompleto: false,
            modulosOrigenMap: new Map<string, { nombre: string; codigo: string | null }>(),
            fuentesMap: new Map<string, { sourceLink: string | null; sourcePage: number | null }>(),
            reglas: new Set<number>(),
          });
        }
        const ciclo = modulo.ciclosMap.get(cicloOrigenNombre)!;
        if (origen.es_ciclo_completo) {
          ciclo.esCicloCompleto = true;
        }
        const moduloOrigenNombre = (origen.modulo_origen_nombre || '').trim();
        if (moduloOrigenNombre) {
          const codigo = (origen.modulo_origen_codigo || '').trim() || null;
          const moduloKey = `${moduloOrigenNombre.toLowerCase()}::${codigo || ''}`;
          ciclo.modulosOrigenMap.set(moduloKey, {
            nombre: moduloOrigenNombre,
            codigo,
          });
        }
        const sourceLink = (regla.source_link || '').trim() || null;
        const sourcePage = Number.isFinite(Number(regla.source_page)) ? Number(regla.source_page) : null;
        const fuenteKey = `${sourceLink || ''}::${sourcePage ?? ''}`;
        ciclo.fuentesMap.set(fuenteKey, { sourceLink, sourcePage });
        ciclo.reglas.add(Number(regla.id));
      }
    }

    return Array.from(modulosMap.values())
      .map((modulo) => ({
        key: modulo.idModuloDestino,
        idModuloDestino: modulo.idModuloDestino,
        moduloDestinoNombre: modulo.moduloDestinoNombre,
        moduloDestinoCodigo: modulo.moduloDestinoCodigo,
        cicloDestinoNombre: modulo.cicloDestinoNombre,
        ciclosOrigen: Array.from(modulo.ciclosMap.values())
          .map((ciclo) => ({
            key: `${modulo.idModuloDestino}::${ciclo.cicloOrigenNombre}`,
            cicloOrigenNombre: ciclo.cicloOrigenNombre,
            esCicloCompleto: ciclo.esCicloCompleto,
            totalModulosNecesarios: ciclo.modulosOrigenMap.size,
            modulosOrigen: Array.from(ciclo.modulosOrigenMap.values()).sort((a, b) => {
              const byNombre = a.nombre.localeCompare(b.nombre, 'es');
              if (byNombre !== 0) return byNombre;
              return (a.codigo || '').localeCompare(b.codigo || '', 'es');
            }),
            fuentes: Array.from(ciclo.fuentesMap.values()).sort((a, b) => {
              const byUrl = (a.sourceLink || '').localeCompare(b.sourceLink || '', 'es');
              if (byUrl !== 0) return byUrl;
              return (a.sourcePage ?? Number.MAX_SAFE_INTEGER) - (b.sourcePage ?? Number.MAX_SAFE_INTEGER);
            }),
            totalReglas: ciclo.reglas.size,
            reglaIds: Array.from(ciclo.reglas.values()).sort((a, b) => a - b),
          }))
          .sort((a, b) => a.cicloOrigenNombre.localeCompare(b.cicloOrigenNombre, 'es')),
      }))
      .sort((a, b) => a.moduloDestinoNombre.localeCompare(b.moduloDestinoNombre, 'es'));
  }

  formatBusquedaModuloMeta(resultado: AdminBusquedaModuloResultado): string {
    const grados = Array.from(
      new Set(
        resultado.ciclos
          .map((ciclo) => ciclo.gradoNombre?.trim() || '')
          .filter((item) => !!item)
      )
    );
    const familias = Array.from(
      new Set(
        resultado.ciclos
          .map((ciclo) => ciclo.familiaNombre?.trim() || '')
          .filter((item) => !!item)
      )
    );

    const meta: string[] = [];
    if (grados.length === 1) meta.push(grados[0]);
    if (familias.length === 1) meta.push(familias[0]);
    return meta.join(' · ');
  }

  formatBusquedaModuloCicloMeta(ciclo: AdminBusquedaModuloResultado['ciclos'][number]): string {
    return [
      ciclo.gradoNombre?.trim() || null,
      ciclo.familiaNombre?.trim() || null,
      ciclo.cicloCodigo?.trim() || null,
    ]
      .filter((item): item is string => !!item)
      .join(' · ');
  }

  get administradoresFiltrados(): AdminUser[] {
    const query = this.filtroAdministradores.trim().toLowerCase();
    if (!query) return this.administradores;

    return this.administradores.filter((admin) => {
      const text = `${admin.id} ${admin.nombre}`.toLowerCase();
      return text.includes(query);
    });
  }

  toggleCatalogCiclo(cicloId: number): void {
    if (this.openCatalogCiclos.has(cicloId)) {
      this.openCatalogCiclos.delete(cicloId);
      return;
    }
    this.openCatalogCiclos.add(cicloId);
  }

  isCatalogCicloOpen(cicloId: number): boolean {
    return this.openCatalogCiclos.has(cicloId);
  }

  private getBusquedaModuloGrados(familiaFiltro: string, origenTipo: AdminBusquedaOrigenTipo = 'modulos'): string[] {
    const familiaNormalizada = this.normalizeSearchText(familiaFiltro);
    const grados = new Set<string>();
    for (const ciclo of this.ciclosConModulos) {
      const esAcreditacion = this.isAcreditacionesExternasCiclo(ciclo.nombre);
      if ((origenTipo === 'modulos' || origenTipo === 'ciclos') && esAcreditacion) continue;
      if (origenTipo === 'acreditaciones' && !esAcreditacion) continue;
      const familia = (ciclo.familia_nombre || '').trim();
      const grado = (ciclo.grado_nombre || '').trim();
      if (!grado) continue;
      if (familiaNormalizada && this.normalizeSearchText(familia) !== familiaNormalizada) continue;
      grados.add(grado);
    }
    return Array.from(grados.values()).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }

  private getBusquedaModuloFamilias(gradoFiltro: string, origenTipo: AdminBusquedaOrigenTipo = 'modulos'): string[] {
    const gradoNormalizado = this.normalizeSearchText(gradoFiltro);
    const familias = new Set<string>();
    for (const ciclo of this.ciclosConModulos) {
      const esAcreditacion = this.isAcreditacionesExternasCiclo(ciclo.nombre);
      if ((origenTipo === 'modulos' || origenTipo === 'ciclos') && esAcreditacion) continue;
      if (origenTipo === 'acreditaciones' && !esAcreditacion) continue;
      const familia = (ciclo.familia_nombre || '').trim();
      const grado = (ciclo.grado_nombre || '').trim();
      if (!familia) continue;
      if (gradoNormalizado && this.normalizeSearchText(grado) !== gradoNormalizado) continue;
      familias.add(familia);
    }
    return Array.from(familias.values()).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }

  private buscarModulosEnCiclos(
    query: string,
    gradoFiltro = '',
    familiaFiltro = '',
    origenTipo: AdminBusquedaOrigenTipo = 'modulos'
  ): AdminBusquedaModuloResultado[] {
    if (!query) return [];

    const modulosMap = new Map<string, AdminBusquedaModuloResultado>();
    const gradoNormalizado = this.normalizeSearchText(gradoFiltro);
    const familiaNormalizada = this.normalizeSearchText(familiaFiltro);

    for (const ciclo of this.ciclosConModulos) {
      const esAcreditacion = this.isAcreditacionesExternasCiclo(ciclo.nombre);
      if ((origenTipo === 'modulos' || origenTipo === 'ciclos') && esAcreditacion) continue;
      if (origenTipo === 'acreditaciones' && !esAcreditacion) continue;
      const gradoNombre = ciclo.grado_nombre?.trim() || null;
      const familiaNombre = ciclo.familia_nombre?.trim() || null;
      if (gradoNormalizado && this.normalizeSearchText(gradoNombre) !== gradoNormalizado) continue;
      if (familiaNormalizada && this.normalizeSearchText(familiaNombre) !== familiaNormalizada) continue;

      const cicloInfo = {
        moduloId: 0,
        moduloNombre: '',
        moduloCodigo: null,
        cicloId: Number(ciclo.id),
        cicloNombre: String(ciclo.nombre || '').trim().replace(/\s+/g, ' '),
        cicloCodigo: (ciclo.id_oficial || '').trim() || null,
        familiaNombre,
        gradoNombre,
      };

      if (origenTipo === 'ciclos') {
        const cicloText = this.normalizeSearchText(`${cicloInfo.cicloNombre} ${cicloInfo.cicloCodigo || ''}`);
        if (!cicloText.includes(query)) continue;

        const key = `ciclo::${cicloInfo.cicloId}`;
        modulosMap.set(key, {
          key,
          nombre: cicloInfo.cicloNombre,
          codigo: cicloInfo.cicloCodigo,
          totalCiclos: 1,
          ciclos: [{
            ...cicloInfo,
            moduloId: -cicloInfo.cicloId,
            moduloNombre: '',
            moduloCodigo: null,
          }],
        });
        continue;
      }

      for (const modulo of ciclo.modulos || []) {
        const nombre = String(modulo.nombre || '').trim().replace(/\s+/g, ' ');
        const codigo = (modulo.id_oficial || '').trim() || null;
        const text = this.normalizeSearchText(`${nombre} ${codigo || ''}`);
        if (!text.includes(query)) continue;
        const moduloId = Number(modulo.id);
        if (!Number.isFinite(moduloId)) continue;

        const key = `${this.normalizeSearchText(nombre)}::${this.normalizeSearchText(codigo || '')}`;
        if (!modulosMap.has(key)) {
          modulosMap.set(key, {
            key,
            nombre,
            codigo,
            totalCiclos: 0,
            ciclos: [],
          });
        }

        const item = modulosMap.get(key)!;
        if (!item.ciclos.some((existing) => existing.moduloId === moduloId)) {
          item.ciclos.push({
            ...cicloInfo,
            moduloId,
            moduloNombre: nombre,
            moduloCodigo: codigo,
          });
        }
      }
    }

    return Array.from(modulosMap.values())
      .map((item) => ({
        ...item,
        ciclos: [...item.ciclos].sort((a, b) => a.cicloNombre.localeCompare(b.cicloNombre, 'es', { sensitivity: 'base' })),
        totalCiclos: item.ciclos.length,
      }))
      .sort((a, b) => {
        const byNombre = a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
        if (byNombre !== 0) return byNombre;
        return (a.codigo || '').localeCompare(b.codigo || '', 'es', { sensitivity: 'base' });
      });
  }

  private getBusquedaModuloVisibleModuloIds(side: 'izquierda' | 'derecha'): number[] {
    const resultados = side === 'izquierda'
      ? this.resultadosBusquedaModuloIzquierda
      : this.resultadosBusquedaModuloDerecha;
    const ids = new Set<number>();
    for (const resultado of resultados) {
      for (const ciclo of resultado.ciclos) {
        const selectableId = side === 'izquierda' && this.filtroBusquedaModuloIzquierdaOrigenTipo === 'ciclos'
          ? -Number(ciclo.cicloId)
          : Number(ciclo.moduloId);
        if (Number.isFinite(selectableId)) {
          ids.add(selectableId);
        }
      }
    }
    return Array.from(ids.values()).sort((a, b) => a - b);
  }

  private normalizeSearchText(value: string | null | undefined): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  toggleConvalidacion(idModuloDestino: number): void {
    if (this.openConvalidaciones.has(idModuloDestino)) {
      this.openConvalidaciones.delete(idModuloDestino);
      const prefix = `${idModuloDestino}::`;
      for (const key of Array.from(this.openConvalidacionCiclos.values())) {
        if (key.startsWith(prefix)) {
          this.openConvalidacionCiclos.delete(key);
        }
      }
      return;
    }
    this.openConvalidaciones.add(idModuloDestino);
  }

  isConvalidacionOpen(idModuloDestino: number): boolean {
    return this.openConvalidaciones.has(idModuloDestino);
  }

  toggleConvalidacionCiclo(cicloKey: string): void {
    if (this.openConvalidacionCiclos.has(cicloKey)) {
      this.openConvalidacionCiclos.delete(cicloKey);
      return;
    }
    this.openConvalidacionCiclos.add(cicloKey);
  }

  isConvalidacionCicloOpen(cicloKey: string): boolean {
    return this.openConvalidacionCiclos.has(cicloKey);
  }

  editarConvalidacionCiclo(
    grupo: AdminConvalidacionModuloAgrupado,
    ciclo: AdminConvalidacionCicloAgrupado,
    event: Event
  ): void {
    event.stopPropagation();
    const reglaIdSet = new Set(ciclo.reglaIds || []);
    const origenes: AdminConvalidacionOrigenEditable[] = [];
    for (const regla of this.convalidaciones) {
      if (!reglaIdSet.has(Number(regla.id))) continue;
      for (const origen of regla.origenes || []) {
        if ((origen.ciclo_origen_nombre || '').trim() !== ciclo.cicloOrigenNombre) continue;
        const itemKey = `${regla.id}::${origen.id_modulo_origen}`;
        origenes.push({
          key: itemKey,
          idConvalidacion: Number(regla.id),
          idModuloOrigen: origen.id_modulo_origen == null ? null : Number(origen.id_modulo_origen),
          moduloOrigenNombre: origen.modulo_origen_nombre,
          moduloOrigenCodigo: origen.modulo_origen_codigo ?? null,
          cicloOrigenNombre: origen.ciclo_origen_nombre,
          esCicloCompleto: !!origen.es_ciclo_completo,
        });
      }
    }

    this.editConvalidacionModuloNombre = grupo.moduloDestinoNombre;
    this.editConvalidacionModuloCodigo = grupo.moduloDestinoCodigo;
    this.editConvalidacionCicloDestinoNombre = grupo.cicloDestinoNombre;
    this.editConvalidacionCicloOrigenNombre = ciclo.cicloOrigenNombre;
    this.editConvalidacionOrigenes = origenes.sort((a, b) => {
      const byNombre = (a.moduloOrigenNombre || '').localeCompare(b.moduloOrigenNombre || '', 'es');
      if (byNombre !== 0) return byNombre;
      const byCodigo = (a.moduloOrigenCodigo || '').localeCompare(b.moduloOrigenCodigo || '', 'es');
      if (byCodigo !== 0) return byCodigo;
      return a.idConvalidacion - b.idConvalidacion;
    });
    this.editConvalidacionModalOpen = true;
  }

  cerrarModalEditarConvalidacion(force = false): void {
    if (!force && this.deletingConvalidacionOrigenes.size > 0) return;
    this.editConvalidacionModalOpen = false;
    this.editConvalidacionModuloNombre = '';
    this.editConvalidacionModuloCodigo = null;
    this.editConvalidacionCicloDestinoNombre = '';
    this.editConvalidacionCicloOrigenNombre = '';
    this.editConvalidacionOrigenes = [];
    this.deletingConvalidacionOrigenes.clear();
    this.cancelarEliminarModuloOrigenConvalidacion(true);
  }

  abrirModalCrearConvalidacion(): void {
    if (!this.filtroConvalidacionesCicloId) {
      this.errorConvalidaciones = 'Selecciona antes un ciclo destino para crear una regla.';
      return;
    }

    const cicloDestinoId = Number(this.filtroConvalidacionesCicloId);
    if (!Number.isFinite(cicloDestinoId) || cicloDestinoId <= 0) {
      this.errorConvalidaciones = 'El ciclo destino seleccionado no es válido.';
      return;
    }

    this.createConvalidacionModalOpen = true;
    this.createConvalidacionError = null;
    this.createConvalidacionDestinoModuloId = null;
    this.createConvalidacionOrigenTipo = 'modulo';
    this.createConvalidacionDestinoModulos = [];
    this.createConvalidacionCiclosOrigen = [];
    this.createConvalidacionOrigenCicloId = null;
    this.createConvalidacionOrigenCicloCompleto = false;
    this.createConvalidacionOrigenModulos = [];
    this.createConvalidacionOrigenModuloIds = [];
    this.createConvalidacionAcreditacionesExternas = [];
    this.createConvalidacionOrigenAcreditacionId = null;
    this.createConvalidacionSourceLink = '';
    this.createConvalidacionSourcePage = null;
    this.creatingConvalidacion = false;
    this.errorConvalidaciones = null;

    this.cargarModulosDestinoCrearConvalidacion(cicloDestinoId);
    this.cargarCiclosOrigenCrearConvalidacion();
    this.cargarAcreditacionesExternasCrearConvalidacion();
  }

  cerrarModalCrearConvalidacion(_force = false): void {
    this.createConvalidacionModalOpen = false;
    this.createConvalidacionDestinoModuloId = null;
    this.createConvalidacionOrigenTipo = 'modulo';
    this.createConvalidacionDestinoModulos = [];
    this.createConvalidacionCiclosOrigen = [];
    this.createConvalidacionOrigenCicloId = null;
    this.createConvalidacionOrigenCicloCompleto = false;
    this.createConvalidacionOrigenModulos = [];
    this.createConvalidacionOrigenModuloIds = [];
    this.createConvalidacionAcreditacionesExternas = [];
    this.createConvalidacionOrigenAcreditacionId = null;
    this.createConvalidacionSourceLink = '';
    this.createConvalidacionSourcePage = null;
    this.loadingCreateConvalidacionDestinoModulos = false;
    this.loadingCreateConvalidacionCiclosOrigen = false;
    this.loadingCreateConvalidacionOrigenModulos = false;
    this.loadingCreateConvalidacionAcreditacionesExternas = false;
    this.creatingConvalidacion = false;
    this.createConvalidacionError = null;
  }

  private cargarModulosDestinoCrearConvalidacion(cicloDestinoId: number): void {
    this.loadingCreateConvalidacionDestinoModulos = true;
    this.catalogService.getModulos(cicloDestinoId).subscribe({
      next: (rows) => {
        this.createConvalidacionDestinoModulos = (Array.isArray(rows) ? rows : [])
          .map((item) => ({
            id: Number(item.id),
            nombre: item.nombre,
            id_oficial: item.id_oficial ?? null,
            id_ciclo: Number(item.id_ciclo),
            numerico: Number(item.numerico ?? 1),
          }))
          .filter((item) => Number.isFinite(item.id) && !!(item.nombre || '').trim())
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        this.loadingCreateConvalidacionDestinoModulos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.createConvalidacionDestinoModulos = [];
        this.loadingCreateConvalidacionDestinoModulos = false;
        this.createConvalidacionError = 'No se pudieron cargar los módulos del ciclo destino.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarCiclosOrigenCrearConvalidacion(): void {
    this.loadingCreateConvalidacionCiclosOrigen = true;
    this.catalogService.getCiclos().subscribe({
      next: (rows) => {
        this.createConvalidacionCiclosOrigen = (Array.isArray(rows) ? rows : [])
          .map((item) => ({
            id: Number(item.id),
            nombre: item.nombre,
            id_oficial: item.id_oficial ?? null,
            normativa: item.normativa ?? null,
            id_familia: Number(item.id_familia),
            id_grado: Number(item.id_grado),
          }))
          .filter((item) => Number.isFinite(item.id) && !!(item.nombre || '').trim())
          .filter((item) => !this.isAcreditacionesExternasCiclo(item.nombre))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        this.loadingCreateConvalidacionCiclosOrigen = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.createConvalidacionCiclosOrigen = [];
        this.loadingCreateConvalidacionCiclosOrigen = false;
        this.createConvalidacionError = 'No se pudieron cargar los ciclos de formación a aportar.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarAcreditacionesExternasCrearConvalidacion(): void {
    this.loadingCreateConvalidacionAcreditacionesExternas = true;
    this.catalogService.getAcreditacionesExternas().subscribe({
      next: (rows) => {
        this.createConvalidacionAcreditacionesExternas = (Array.isArray(rows) ? rows : [])
          .map((item) => ({
            id: Number(item.id),
            nombre: String(item.nombre || '').trim().replace(/\s+/g, ' '),
            tipo: item.tipo ?? null,
          }))
          .filter((item) => Number.isFinite(item.id) && !!item.nombre)
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
        this.loadingCreateConvalidacionAcreditacionesExternas = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.createConvalidacionAcreditacionesExternas = [];
        this.loadingCreateConvalidacionAcreditacionesExternas = false;
        this.createConvalidacionError = 'No se pudieron cargar las acreditaciones externas.';
        this.cdr.detectChanges();
      },
    });
  }

  onCrearConvalidacionOrigenTipoChange(): void {
    this.createConvalidacionError = null;
    this.createConvalidacionOrigenCicloId = null;
    this.createConvalidacionOrigenCicloCompleto = this.createConvalidacionOrigenTipo === 'ciclo';
    this.createConvalidacionOrigenModulos = [];
    this.createConvalidacionOrigenModuloIds = [];
    this.createConvalidacionOrigenAcreditacionId = null;
  }

  onCrearConvalidacionOrigenCicloChange(): void {
    this.createConvalidacionOrigenCicloCompleto = this.createConvalidacionOrigenTipo === 'ciclo';
    this.createConvalidacionOrigenModuloIds = [];
    this.createConvalidacionOrigenModulos = [];
    this.createConvalidacionError = null;

    const cicloOrigenId = this.createConvalidacionOrigenCicloId ? Number(this.createConvalidacionOrigenCicloId) : null;
    if (!cicloOrigenId) return;

    this.loadingCreateConvalidacionOrigenModulos = true;
    this.catalogService.getModulos(cicloOrigenId).subscribe({
      next: (rows) => {
        this.createConvalidacionOrigenModulos = (Array.isArray(rows) ? rows : [])
          .map((item) => ({
            id: Number(item.id),
            nombre: item.nombre,
            id_oficial: item.id_oficial ?? null,
            id_ciclo: Number(item.id_ciclo),
            numerico: Number(item.numerico ?? 1),
          }))
          .filter((item) => Number.isFinite(item.id) && !!(item.nombre || '').trim())
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        if (this.createConvalidacionOrigenTipo === 'ciclo') {
          this.createConvalidacionOrigenModuloIds = this.createConvalidacionOrigenModulos
            .map((modulo) => Number(modulo.id))
            .filter((id) => Number.isFinite(id))
            .sort((a, b) => a - b);
        }
        this.loadingCreateConvalidacionOrigenModulos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.createConvalidacionOrigenModulos = [];
        this.loadingCreateConvalidacionOrigenModulos = false;
        this.createConvalidacionError = 'No se pudieron cargar los módulos del ciclo origen.';
        this.cdr.detectChanges();
      },
    });
  }

  onCrearConvalidacionOrigenCicloCompletoChange(): void {
    if (this.createConvalidacionOrigenTipo === 'ciclo') {
      this.createConvalidacionOrigenCicloCompleto = true;
    }
    if (this.createConvalidacionOrigenCicloCompleto) {
      this.createConvalidacionOrigenModuloIds = this.createConvalidacionOrigenModulos
        .map((modulo) => Number(modulo.id))
        .filter((id) => Number.isFinite(id))
        .sort((a, b) => a - b);
      return;
    }
    this.createConvalidacionOrigenModuloIds = [];
  }

  toggleCrearConvalidacionOrigenModulo(idModulo: number, selected: boolean): void {
    if (this.createConvalidacionOrigenTipo === 'ciclo' || this.createConvalidacionOrigenCicloCompleto) return;
    const id = Number(idModulo);
    if (!Number.isFinite(id)) return;

    const current = new Set(this.createConvalidacionOrigenModuloIds.map((item) => Number(item)));
    if (selected) {
      current.add(id);
    } else {
      current.delete(id);
    }
    this.createConvalidacionOrigenModuloIds = Array.from(current.values()).sort((a, b) => a - b);
  }

  get canGuardarNuevaConvalidacion(): boolean {
    if (!this.createConvalidacionDestinoModuloId) return false;
    if (this.createConvalidacionOrigenTipo === 'acreditacion_externa') {
      return !!this.createConvalidacionOrigenAcreditacionId;
    }
    if (!this.createConvalidacionOrigenCicloId) return false;
    if (this.createConvalidacionOrigenTipo === 'ciclo' || this.createConvalidacionOrigenCicloCompleto) {
      return this.createConvalidacionOrigenModulos.length > 0;
    }
    return this.createConvalidacionOrigenModuloIds.length > 0;
  }

  get createConvalidacionOrigenCicloNombreSeleccionado(): string {
    const ciclo = this.createConvalidacionCiclosOrigen.find(
      (item) => Number(item.id) === Number(this.createConvalidacionOrigenCicloId)
    );
    return ciclo?.nombre || '';
  }

  guardarNuevaConvalidacion(): void {
    if (!this.canGuardarNuevaConvalidacion) {
      this.createConvalidacionError = 'Completa la selección antes de guardar.';
      return;
    }
    if (this.creatingConvalidacion) return;

    const idModuloDestino = Number(this.createConvalidacionDestinoModuloId);
    const idCicloOrigen = this.createConvalidacionOrigenCicloId ? Number(this.createConvalidacionOrigenCicloId) : null;
    const idsOrigen = this.createConvalidacionOrigenTipo === 'acreditacion_externa'
      ? [Number(this.createConvalidacionOrigenAcreditacionId)].filter((id) => Number.isFinite(id) && id > 0)
      : this.createConvalidacionOrigenCicloCompleto
        ? this.createConvalidacionOrigenModulos
            .map((modulo) => Number(modulo.id))
            .filter((id) => Number.isFinite(id) && id > 0)
        : this.createConvalidacionOrigenModuloIds
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && id > 0);
    const idModulosOrigen = Array.from(new Set(idsOrigen)).sort((a, b) => a - b);

    if (!Number.isFinite(idModuloDestino) || idModuloDestino <= 0) {
      this.createConvalidacionError = 'No se ha podido preparar la regla con los datos seleccionados.';
      return;
    }
    if (this.createConvalidacionOrigenTipo === 'ciclo') {
      if (!Number.isFinite(idCicloOrigen) || !idCicloOrigen || idCicloOrigen <= 0) {
        this.createConvalidacionError = 'No se ha podido preparar la regla con los datos seleccionados.';
        return;
      }
    } else if (idModulosOrigen.length === 0) {
      this.createConvalidacionError = 'No se ha podido preparar la regla con los datos seleccionados.';
      return;
    }

    this.creatingConvalidacion = true;
    this.createConvalidacionError = null;
    const sourceLink = this.createConvalidacionSourceLink.trim() || null;
    const rawSourcePage = this.createConvalidacionSourcePage;
    const sourcePage = rawSourcePage === null || rawSourcePage === undefined
      ? null
      : Number(rawSourcePage);

    if (sourcePage !== null && (!Number.isInteger(sourcePage) || sourcePage <= 0)) {
      this.creatingConvalidacion = false;
      this.createConvalidacionError = 'La página debe ser un número entero mayor que 0.';
      return;
    }

    const request$ = this.createConvalidacionOrigenTipo === 'ciclo'
      ? this.convalidacionesService.crearConvalidacionCicloAdmin({
          id_modulo_destino: idModuloDestino,
          id_ciclo_origen: idCicloOrigen!,
          source_link: sourceLink,
          source_page: sourcePage,
        })
      : this.convalidacionesService.crearConvalidacionAdmin({
          id_modulo_destino: idModuloDestino,
          id_modulos_origen: idModulosOrigen,
          source_link: sourceLink,
          source_page: sourcePage,
        });

    request$
      .pipe(
        finalize(() => {
          this.creatingConvalidacion = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cerrarModalCrearConvalidacion(true);
          this.errorConvalidaciones = null;
          this.cargarConvalidaciones(true);
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.createConvalidacionError = err?.error?.detail || 'No se pudo crear la regla de convalidación.';
        },
      });
  }

  eliminarModuloOrigenConvalidacion(origen: AdminConvalidacionOrigenEditable): void {
    if (this.deletingConvalidacionOrigenes.has(origen.key)) return;
    if (origen.esCicloCompleto || origen.idModuloOrigen == null || !origen.moduloOrigenNombre) return;
    this.convalidacionOrigenToDelete = {
      key: origen.key,
      idConvalidacion: origen.idConvalidacion,
      idModuloOrigen: origen.idModuloOrigen,
      moduloOrigenNombre: origen.moduloOrigenNombre,
      moduloOrigenCodigo: origen.moduloOrigenCodigo,
    };
    this.deleteConvalidacionOrigenModalOpen = true;
  }

  cancelarEliminarModuloOrigenConvalidacion(force = false): void {
    if (!force && this.convalidacionOrigenToDelete && this.deletingConvalidacionOrigenes.has(this.convalidacionOrigenToDelete.key)) {
      return;
    }
    this.deleteConvalidacionOrigenModalOpen = false;
    this.convalidacionOrigenToDelete = null;
  }

  confirmarEliminarModuloOrigenConvalidacion(): void {
    const origen = this.convalidacionOrigenToDelete;
    if (!origen) return;
    if (this.deletingConvalidacionOrigenes.has(origen.key)) return;

    this.deletingConvalidacionOrigenes.add(origen.key);

    this.convalidacionesService
      .eliminarConvalidacionOrigenAdmin(origen.idConvalidacion, origen.idModuloOrigen)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.deletingConvalidacionOrigenes.delete(origen.key);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cancelarEliminarModuloOrigenConvalidacion(true);
          this.editConvalidacionOrigenes = this.editConvalidacionOrigenes.filter((item) => item.key !== origen.key);
          if (this.editConvalidacionOrigenes.length === 0) {
            this.cerrarModalEditarConvalidacion(true);
          }
          this.cargarConvalidaciones(true);
          this.errorConvalidaciones = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.errorConvalidaciones = 'No se pudo eliminar el módulo origen de la convalidación.';
        },
      });
  }

  eliminarConvalidacionCiclo(
    grupo: AdminConvalidacionModuloAgrupado,
    ciclo: AdminConvalidacionCicloAgrupado,
    event: Event
  ): void {
    event.stopPropagation();
    if (this.deletingConvalidacionCiclos.has(ciclo.key)) return;
    if (!ciclo.reglaIds || ciclo.reglaIds.length === 0) return;

    this.convalidacionToDeleteKey = ciclo.key;
    this.convalidacionToDeleteModuloNombre = grupo.moduloDestinoNombre;
    this.convalidacionToDeleteCicloOrigenNombre = ciclo.cicloOrigenNombre;
    this.convalidacionToDeleteReglaIds = [...ciclo.reglaIds];
    this.deleteConvalidacionModalOpen = true;
  }

  cancelarEliminarConvalidacion(force = false): void {
    if (!force && this.convalidacionToDeleteKey && this.deletingConvalidacionCiclos.has(this.convalidacionToDeleteKey)) {
      return;
    }
    this.deleteConvalidacionModalOpen = false;
    this.convalidacionToDeleteKey = '';
    this.convalidacionToDeleteModuloNombre = '';
    this.convalidacionToDeleteCicloOrigenNombre = '';
    this.convalidacionToDeleteReglaIds = [];
  }

  confirmarEliminarConvalidacion(): void {
    if (!this.convalidacionToDeleteKey || this.convalidacionToDeleteReglaIds.length === 0) return;
    const key = this.convalidacionToDeleteKey;
    if (this.deletingConvalidacionCiclos.has(key)) return;

    this.deletingConvalidacionCiclos.add(key);
    const requests = this.convalidacionToDeleteReglaIds.map((id) =>
      id < 0
        ? this.convalidacionesService.eliminarConvalidacionCicloAdmin(Math.abs(id))
        : this.convalidacionesService.eliminarConvalidacionAdmin(id)
    );
    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.deletingConvalidacionCiclos.delete(key);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cancelarEliminarConvalidacion(true);
          this.cargarConvalidaciones(true);
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.errorConvalidaciones = 'No se han podido eliminar las reglas de convalidacion seleccionadas.';
        },
      });
  }

  abrirModalModulos(ciclo: AdminCicloConModulos): void {
    this.modulosModalCiclo = ciclo;
    this.showAddModulosForm = false;
    this.modulosDraft = [{ id_oficial: '', nombre: '', numerico: 1 }];
    this.createModulosError = null;
    this.creatingModulos = false;
  }

  cerrarModalModulos(): void {
    this.modulosModalCiclo = null;
    this.showAddModulosForm = false;
    this.modulosDraft = [{ id_oficial: '', nombre: '', numerico: 1 }];
    this.createModulosError = null;
    this.creatingModulos = false;
  }

  editarCiclo(ciclo: AdminCicloConModulos): void {
    this.abrirModalModulos(ciclo);
  }

  abrirModalCrearCiclo(idFamiliaSugerida: number | null): void {
    this.createCicloModalOpen = true;
    this.createCicloError = null;
    this.createCicloNombre = '';
    this.createCicloFamiliaId = idFamiliaSugerida;
    this.createCicloGradoId = null;
  }

  cerrarModalCrearCiclo(): void {
    if (this.creatingCiclo) return;
    this.createCicloModalOpen = false;
    this.createCicloError = null;
    this.createCicloNombre = '';
    this.createCicloFamiliaId = null;
    this.createCicloGradoId = null;
  }

  abrirModalCrearAcreditacionExterna(): void {
    if (!this.acreditacionExternaCiclo) return;
    this.createAcreditacionExternaModalOpen = true;
    this.createAcreditacionExternaCodigo = 'otros';
    this.createAcreditacionExternaNombre = '';
    this.createAcreditacionExternaError = null;
    this.creatingAcreditacionExterna = false;
  }

  cerrarModalCrearAcreditacionExterna(): void {
    if (this.creatingAcreditacionExterna) return;
    this.createAcreditacionExternaModalOpen = false;
    this.createAcreditacionExternaCodigo = 'otros';
    this.createAcreditacionExternaNombre = '';
    this.createAcreditacionExternaError = null;
  }

  setCreateAcreditacionExternaCodigo(codigo: string, checked: boolean): void {
    if (!checked) return;
    this.createAcreditacionExternaCodigo = codigo;
  }

  canCreateAcreditacionExterna(): boolean {
    return !!this.acreditacionExternaCiclo && !!this.createAcreditacionExternaCodigo && this.createAcreditacionExternaNombre.trim().length > 0;
  }

  canCreateCiclo(): boolean {
    return (
      !!this.createCicloFamiliaId &&
      !!this.createCicloGradoId &&
      this.createCicloNombre.trim().length > 0
    );
  }

  crearCiclo(): void {
    const nombre = this.createCicloNombre.trim();
    if (!this.createCicloFamiliaId || !this.createCicloGradoId || !nombre || this.creatingCiclo) return;

    this.creatingCiclo = true;
    this.createCicloError = null;

    this.convalidacionesService
      .crearCicloAdmin({
        nombre,
        id_familia: Number(this.createCicloFamiliaId),
        id_grado: Number(this.createCicloGradoId),
      })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.creatingCiclo = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadedModulos = false;
          this.cargarCiclosModulos();
          this.errorModulos = null;
          this.cerrarModalCrearCiclo();
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.createCicloError = err?.error?.detail || 'No se pudo crear el ciclo.';
        },
      });
  }

  crearAcreditacionExterna(): void {
    const ciclo = this.acreditacionExternaCiclo;
    const codigo = this.createAcreditacionExternaCodigo;
    const nombre = this.createAcreditacionExternaNombre.trim();
    if (!ciclo || !codigo || !nombre || this.creatingAcreditacionExterna) return;

    this.creatingAcreditacionExterna = true;
    this.createAcreditacionExternaError = null;

    this.convalidacionesService
      .crearModulosAdmin(ciclo.id, {
        modulos: [{ id_oficial: codigo, nombre, numerico: 0 }],
      })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.creatingAcreditacionExterna = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.createAcreditacionExternaModalOpen = false;
          this.createAcreditacionExternaCodigo = 'otros';
          this.createAcreditacionExternaNombre = '';
          this.createAcreditacionExternaError = null;
          this.loadedModulos = false;
          this.cargarCiclosModulos();
          this.errorModulos = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.createAcreditacionExternaError = err?.error?.detail || 'No se pudo crear el titulo externo.';
        },
      });
  }

  toggleAddModulosForm(): void {
    this.showAddModulosForm = !this.showAddModulosForm;
    if (this.showAddModulosForm && this.modulosDraft.length === 0) {
      this.modulosDraft = [{ id_oficial: '', nombre: '', numerico: 1 }];
    }
    if (!this.showAddModulosForm) {
      this.createModulosError = null;
    }
  }

  addModuloDraftRow(): void {
    this.modulosDraft = [...this.modulosDraft, { id_oficial: '', nombre: '', numerico: 1 }];
  }

  removeModuloDraftRow(index: number): void {
    if (this.modulosDraft.length <= 1) return;
    this.modulosDraft = this.modulosDraft.filter((_, i) => i !== index);
  }

  canCreateModulos(): boolean {
    return this.modulosDraft.some((row) => row.nombre.trim().length > 0);
  }

  crearModulos(): void {
    const idCiclo = this.modulosModalCiclo?.id;
    if (!idCiclo || this.creatingModulos) return;

    const payload = this.modulosDraft
      .map((row) => ({
        id_oficial: row.id_oficial.trim() || null,
        nombre: row.nombre.trim(),
        numerico: row.numerico === 0 ? 0 : 1,
      }))
      .filter((row) => row.nombre.length > 0);

    if (payload.length === 0) {
      this.createModulosError = 'Debes añadir al menos un módulo con nombre.';
      return;
    }

    this.creatingModulos = true;
    this.createModulosError = null;
    this.convalidacionesService
      .crearModulosAdmin(idCiclo, { modulos: payload })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.creatingModulos = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.modulosDraft = [{ id_oficial: '', nombre: '', numerico: 1 }];
          this.showAddModulosForm = false;
          this.loadedModulos = false;
          this.cargarCiclosModulos();
          this.errorModulos = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.createModulosError = err?.error?.detail || 'No se pudieron crear los módulos.';
        },
      });
  }

  eliminarCiclo(ciclo: AdminCicloConModulos): void {
    this.cicloToDelete = ciclo;
    this.deleteCicloModalOpen = true;
  }

  cancelarEliminarCiclo(): void {
    if (this.deletingCiclo) return;
    this.deleteCicloModalOpen = false;
    this.cicloToDelete = null;
  }

  confirmarEliminarCiclo(): void {
    if (!this.cicloToDelete || this.deletingCiclo) return;
    const idCiclo = this.cicloToDelete.id;
    this.deletingCiclo = true;

    this.convalidacionesService
      .eliminarCicloAdmin(idCiclo)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.deletingCiclo = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.ciclosConModulos = this.ciclosConModulos.filter((c) => c.id !== idCiclo);
          if (this.modulosModalCiclo?.id === idCiclo) {
            this.modulosModalCiclo = null;
          }
          this.deleteCicloModalOpen = false;
          this.cicloToDelete = null;
          this.errorModulos = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.errorModulos = 'No se pudo eliminar el ciclo (timeout o error de red).';
        },
      });
  }

  abrirModalEliminarModulo(idModulo: number, nombreModulo: string, cicloNombre?: string, esAcreditacionExterna = false): void {
    this.moduloToDeleteId = idModulo;
    this.moduloToDeleteNombre = nombreModulo;
    this.moduloToDeleteCicloNombre = cicloNombre || this.modulosModalCiclo?.nombre || '';
    this.deleteModuloEsAcreditacionExterna = esAcreditacionExterna;
    this.deleteModuloModalOpen = true;
  }

  cancelarEliminarModulo(force = false): void {
    if (!force && this.moduloToDeleteId !== null && this.deletingModulos.has(this.moduloToDeleteId)) return;
    this.deleteModuloModalOpen = false;
    this.moduloToDeleteId = null;
    this.moduloToDeleteNombre = '';
    this.moduloToDeleteCicloNombre = '';
    this.deleteModuloEsAcreditacionExterna = false;
  }

  confirmarEliminarModulo(): void {
    if (this.moduloToDeleteId === null) return;
    this.eliminarModulo(this.moduloToDeleteId);
  }

  eliminarModulo(idModulo: number): void {
    if (this.deletingModulos.has(idModulo)) return;
    this.deletingModulos.add(idModulo);

    this.convalidacionesService
      .eliminarModuloAdmin(idModulo)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.deletingModulos.delete(idModulo);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.ciclosConModulos = this.ciclosConModulos.map((ciclo) => {
            const nextModulos = ciclo.modulos.filter((m) => m.id !== idModulo);
            if (nextModulos.length === ciclo.modulos.length) return ciclo;
            return {
              ...ciclo,
              modulos: nextModulos,
              total_modulos: nextModulos.length,
            };
          });

          const modalCicloId = this.modulosModalCiclo?.id;
          if (modalCicloId !== undefined && modalCicloId !== null) {
            const updated = this.ciclosConModulos.find((ciclo) => ciclo.id === modalCicloId) || null;
            this.modulosModalCiclo = updated;
          }

          if (this.moduloToDeleteId === idModulo) {
            this.cancelarEliminarModulo(true);
          }
          this.errorModulos = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.errorModulos = 'No se pudo eliminar el modulo (timeout o error de red).';
        },
      });
  }

  toggleAlumno(key: string): void {
    if (this.openAlumnos.has(key)) {
      this.openAlumnos.delete(key);
      return;
    }
    this.openAlumnos.add(key);
  }

  isAlumnoOpen(key: string): boolean {
    return this.openAlumnos.has(key);
  }

  toggleCiclo(formularioId: number, cicloKey: string): void {
    const key = `${formularioId}::${cicloKey}`;
    if (this.openCiclos.has(key)) {
      this.openCiclos.delete(key);
    } else {
      this.openCiclos.add(key);
    }
    this.cdr.detectChanges();
    queueMicrotask(() => this.restoreDocumentoPreviewFrame(formularioId));
  }

  isCicloOpen(formularioId: number, cicloKey: string): boolean {
    return this.openCiclos.has(`${formularioId}::${cicloKey}`);
  }

  getModulosPorCiclo(formulario: AdminFormulario): AdminCicloModulosGroup[] {
    const map = new Map<string, AdminCicloModulosGroup>();
    const modulos = formulario.modulos_aportados ?? [];

    for (const modulo of modulos) {
      const cicloNombre = modulo.ciclo_nombre?.trim() || (modulo.id_modulo ? 'Ciclo no identificado' : 'Otros no registrados');
      const key = String(modulo.ciclo_id ?? cicloNombre);
      if (!map.has(key)) {
        map.set(key, { key, cicloId: modulo.ciclo_id ?? null, cicloNombre, modulos: [] });
      }
      map.get(key)!.modulos.push({
        id: modulo.id,
        nombre: modulo.modulo_nombre || modulo.descripcion || 'Módulo sin detalle',
        codigo: modulo.modulo_codigo ?? null,
        nota: modulo.nota ?? null,
        numerico: modulo.modulo_numerico ?? null,
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      const aOtros = this.isOtrosNoRegistrados(a.cicloNombre);
      const bOtros = this.isOtrosNoRegistrados(b.cicloNombre);
      if (aOtros && !bOtros) return 1;
      if (!aOtros && bOtros) return -1;
      return a.cicloNombre.localeCompare(b.cicloNombre, 'es');
    });
  }

  getNotaMediaCiclo(ciclo: AdminCicloModulosGroup): number | null {
    if (ciclo.modulos.length <= 2) return null;
    const notas = ciclo.modulos
      .filter((m) => m.numerico !== 0)
      .map((m) => m.nota)
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    const totalModulosNumericos = ciclo.modulos.filter((m) => m.numerico !== 0).length;
    if (totalModulosNumericos === 0 || notas.length !== totalModulosNumericos) return null;
    const total = notas.reduce((acc, current) => acc + current, 0);
    return total / notas.length;
  }

  getConvalidadoPorLista(convalidadoPor: string | null | undefined): string[] {
    if (!convalidadoPor) return [];
    return convalidadoPor
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  getConvalidadoPorConNota(
    formulario: AdminFormulario,
    solicitud: { convalidadoPor?: string | null; convalidadoPorIds?: number[] | null; nota_manual?: number | null }
  ): string[] {
    const notaManual = solicitud.nota_manual;
    if (
      (!solicitud.convalidadoPor || !solicitud.convalidadoPor.trim())
      && (!solicitud.convalidadoPorIds || solicitud.convalidadoPorIds.length === 0)
      && notaManual !== null
      && notaManual !== undefined
      && Number.isFinite(notaManual)
    ) {
      return [`Nota manual: ${this.formatearNotaModulo(notaManual)}`];
    }

    const ids = solicitud.convalidadoPorIds ?? [];
    if (ids.length > 0) {
      const modulosById = this.getModulosAportadosById(formulario);
      return ids.map((id) => {
        const modulo = modulosById.get(id);
        if (!modulo) return `Módulo ${id} (sin nota)`;
        const etiqueta = this.getEtiquetaNotaModuloAdmin(modulo);
        if (!etiqueta) return `${modulo.nombre} (sin nota)`;
        return `${modulo.nombre} (${etiqueta})`;
      });
    }

    const notasPorNombre = this.getNotasPorNombreModuloFormulario(formulario);
    return this.getConvalidadoPorLista(solicitud.convalidadoPor).map((nombre) => {
      const modulo = notasPorNombre.get(this.normalizarTextoModulo(nombre));
      if (!modulo) return `${nombre} (sin nota)`;
      const etiqueta = this.getEtiquetaNotaModuloAdmin(modulo);
      if (!etiqueta) return `${nombre} (sin nota)`;
      return `${nombre} (${etiqueta})`;
    });
  }

  getNotaConvalidadaRedondeada(nota: number | null | undefined): number | null {
    if (nota === null || nota === undefined || !Number.isFinite(nota)) return null;
    return Math.floor(nota + 0.5);
  }

  private parseManualNotaInput(value: string): number | null | undefined {
    const normalized = String(value || '').trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) return undefined;
    return Math.round(parsed * 100) / 100;
  }

  private compareGradosByPreferredOrder(a: string, b: string): number {
    return this.getGradoSortRank(a) - this.getGradoSortRank(b)
      || a.localeCompare(b, 'es', { sensitivity: 'base' });
  }

  private getGradoSortRank(nombre: string): number {
    const normalized = String(nombre || '').trim().toLowerCase();
    if (normalized === 'básica' || normalized === 'basica') return 1;
    if (normalized === 'grado medio') return 2;
    if (normalized === 'grado superior') return 3;
    if (normalized === 'especialización' || normalized === 'especializacion') return 4;
    return 99;
  }

  debeMostrarDesplegableConvalidadoPor(convalidadoPor: string | null | undefined): boolean {
    return this.getConvalidadoPorLista(convalidadoPor).length > 2;
  }

  private getNotasPorNombreModuloFormulario(formulario: AdminFormulario): Map<string, { nota: number; numerico: number | null }> {
    const map = new Map<string, { nota: number; numerico: number | null }>();
    const modulos = formulario.modulos_aportados ?? [];
    for (const modulo of modulos) {
      const nombre = (modulo.modulo_nombre || modulo.descripcion || '').trim();
      if (!nombre) continue;
      const nota = modulo.nota;
      if (typeof nota !== 'number' || !Number.isFinite(nota)) continue;
      const key = this.normalizarTextoModulo(nombre);
      if (!key) continue;
      const actual = map.get(key);
      if (actual === undefined || nota > actual.nota) {
        map.set(key, { nota, numerico: modulo.modulo_numerico ?? null });
      }
    }
    return map;
  }

  private getModulosAportadosById(
    formulario: AdminFormulario
  ): Map<number, { nombre: string; nota: number | null; numerico: number | null }> {
    const map = new Map<number, { nombre: string; nota: number | null; numerico: number | null }>();
    const modulos = formulario.modulos_aportados ?? [];
    for (const modulo of modulos) {
      const idModulo = Number(modulo.id_modulo);
      if (!Number.isFinite(idModulo)) continue;
      const nombre = (modulo.modulo_nombre || modulo.descripcion || `Módulo ${idModulo}`).trim();
      const nota = typeof modulo.nota === 'number' && Number.isFinite(modulo.nota) ? modulo.nota : null;
      const numerico = modulo.modulo_numerico ?? null;
      const current = map.get(idModulo);
      if (!current || ((current.nota ?? -Infinity) < (nota ?? -Infinity))) {
        map.set(idModulo, { nombre, nota, numerico });
      }
    }
    return map;
  }

  getEtiquetaNotaModuloAdmin(modulo: { nota?: number | null; numerico?: number | null }): string | null {
    const nota = modulo.nota;
    if (nota === null || nota === undefined || !Number.isFinite(nota)) return null;
    if (modulo.numerico === 0) {
      if (nota === 2) return 'EXENTO';
      if (nota === 1) return 'APTO';
      return 'NO APTO';
    }
    return `Nota: ${this.formatearNotaModulo(nota)}`;
  }

  private normalizarTextoModulo(value: string): string {
    return (value || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private formatearNotaModulo(value: number): string {
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  getSolicitudesPorCiclo(formulario: AdminFormulario): AdminCicloSolicitudesGroup[] {
    const map = new Map<string, AdminCicloSolicitudesGroup>();
    const solicitudes = formulario.solicitudes ?? [];

    for (const solicitud of solicitudes) {
      const cicloNombre = solicitud.ciclo_nombre?.trim() || (solicitud.id_modulo_destino ? 'Ciclo no identificado' : 'Otros no registrados');
      const key = String(solicitud.ciclo_id ?? cicloNombre);
      if (!map.has(key)) {
        map.set(key, { key, cicloNombre, solicitudes: [] });
      }
      map.get(key)!.solicitudes.push({
        id: solicitud.id,
        idConvalidacion: solicitud.id_convalidacion ?? null,
        nombre: solicitud.modulo_destino || solicitud.descripcion || 'Solicitud sin detalle',
        codigo: solicitud.modulo_destino_codigo ?? null,
        esOtroNoRegistrado: !solicitud.id_modulo_destino,
        convalidadoPor: solicitud.convalidado_por ?? solicitud.convalidadoPor ?? null,
        convalidadoPorIds: this.parseConvalidadoPorIds(solicitud.convalidado_por_ids ?? solicitud.convalidadoPorIds ?? null),
        nota_manual: solicitud.nota_manual ?? null,
        nota_media_origen: solicitud.nota_media_origen ?? null,
        estadoModuloId: solicitud.estado_modulo_id ?? null,
        estadoModulo: solicitud.estado_modulo ?? null,
      });
    }

    const ordered = Array.from(map.values()).sort((a, b) => {
      const aOtros = this.isOtrosNoRegistrados(a.cicloNombre);
      const bOtros = this.isOtrosNoRegistrados(b.cicloNombre);
      if (aOtros && !bOtros) return 1;
      if (!aOtros && bOtros) return -1;
      return a.cicloNombre.localeCompare(b.cicloNombre, 'es');
    });

    // Si hay bloque "otros no registrados", lo incorporamos al ultimo bloque normal
    // para no duplicar tablas visuales.
    const normales = ordered.filter((g) => !this.isOtrosNoRegistrados(g.cicloNombre));
    const otros = ordered.filter((g) => this.isOtrosNoRegistrados(g.cicloNombre));
    if (normales.length > 0 && otros.length > 0) {
      const destino = normales[normales.length - 1];
      for (const grupoOtros of otros) {
        destino.solicitudes.push(...grupoOtros.solicitudes);
      }
      return normales;
    }

    return ordered;
  }

  private parseConvalidadoPorIds(value: string | null): number[] {
    if (!value) return [];
    return value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((id) => Number.isFinite(id));
  }

  private groupByAlumno(items: AdminFormulario[]): AdminAlumnoGroup[] {
    const map = new Map<string, AdminAlumnoGroup>();

    for (const item of items) {
      const key = String(item.id_alumno ?? item.alumno?.dni ?? item.id);
      if (!map.has(key)) {
        map.set(key, {
          key,
          nombre: item.alumno?.nombre ?? '',
          dni: item.alumno?.dni ?? '',
          email: item.alumno?.email ?? '',
          formularios: [],
        });
      }
      map.get(key)!.formularios.push(item);
    }

    const groups = Array.from(map.values());
    for (const group of groups) {
      group.formularios.sort((a, b) => b.id - a.id);
    }
    return groups.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  getInitials(nombre: string): string {
    const parts = (nombre || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AL';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  estadoLabel(formulario: AdminFormulario): string {
    if (formulario.estado_id === 3) return 'validado';
    if (formulario.estado_id === 4) return 'rechazado';
    if (formulario.estado) return formulario.estado;
    if (formulario.estado_id === 0) return 'revision';
    if (formulario.estado_id === 1) return 'validado';
    if (formulario.estado_id === 2) return 'rechazado';
    return 'desconocido';
  }

  estadoClass(estadoId: number): string {
    if (estadoId === 1) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (estadoId === 2) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (estadoId === 3 || estadoId === 4) return 'bg-slate-100 text-slate-700 border border-slate-300';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }

  getArchiveEstadoObjetivo(estadoActual: number): 3 | 4 {
    return estadoActual === 2 ? 4 : 3;
  }

  getUnarchiveEstadoObjetivo(estadoActual: number): 1 | 2 {
    return estadoActual === 4 ? 2 : 1;
  }

  canFormularioValidateReject(estadoId: number): boolean {
    return estadoId === 0;
  }

  canFormularioBackToRevision(estadoId: number): boolean {
    return estadoId === 1 || estadoId === 2;
  }

  canFormularioArchive(estadoId: number): boolean {
    return estadoId === 1 || estadoId === 2;
  }

  canFormularioDelete(_estadoId: number): boolean {
    return true;
  }

  canFormularioUnarchive(estadoId: number): boolean {
    return estadoId === 3 || estadoId === 4;
  }

  isFormularioUpdating(formularioId: number): boolean {
    return this.updatingFormularios.has(formularioId);
  }

  isFormularioDeleting(formularioId: number): boolean {
    return this.deletingFormularios.has(formularioId);
  }

  solicitarCambioEstadoFormulario(formularioId: number, alumnoNombre: string, estadoObjetivo: 0 | 1 | 2 | 3 | 4, estadoActual: number | null = null): void {
    this.confirmFormularioId = formularioId;
    this.confirmAlumnoNombre = (alumnoNombre || '').trim();
    this.confirmEstadoActual = estadoActual;
    this.confirmEstadoObjetivo = estadoObjetivo;
    this.confirmModalOpen = true;
  }

  cancelarConfirmacionFormulario(): void {
    this.confirmModalOpen = false;
    this.confirmFormularioId = null;
    this.confirmAlumnoNombre = '';
    this.confirmEstadoActual = null;
  }

  abrirModalEliminarFormulario(formulario: AdminFormulario, alumnoNombre: string): void {
    if (this.deletingFormulario || this.isFormularioDeleting(formulario.id)) return;
    this.formularioToDeleteId = formulario.id;
    this.formularioToDeleteAlumnoNombre = (alumnoNombre || formulario.alumno?.nombre || '').trim();
    this.deleteFormularioError = null;
    this.deleteFormularioModalOpen = true;
  }

  cerrarModalEliminarFormulario(force = false): void {
    if (!force && this.deletingFormulario) return;
    this.deleteFormularioModalOpen = false;
    this.formularioToDeleteId = null;
    this.formularioToDeleteAlumnoNombre = '';
    this.deleteFormularioError = null;
  }

  confirmarEliminarFormulario(): void {
    if (this.formularioToDeleteId == null || this.deletingFormulario) return;
    const formularioId = this.formularioToDeleteId;

    this.deletingFormulario = true;
    this.deleteFormularioError = null;
    this.deletingFormularios.add(formularioId);
    this.convalidacionesService
      .eliminarFormularioAdmin(formularioId)
      .pipe(
        finalize(() => {
          this.deletingFormulario = false;
          this.deletingFormularios.delete(formularioId);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cerrarModalEliminarFormulario(true);
          this.error = null;
          this.cargarFormularios(this.getFormularioEstadoBackend());
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.deleteFormularioError = err?.error?.detail || 'No se pudo eliminar el formulario.';
        },
      });
  }

  confirmarValidacionFormulario(): void {
    if (this.confirmFormularioId == null) return;
    const formularioId = this.confirmFormularioId;
    this.confirmModalOpen = false;
    this.confirmFormularioId = null;
    this.confirmAlumnoNombre = '';
    this.confirmEstadoActual = null;
    this.actualizarEstadoFormulario(formularioId, this.confirmEstadoObjetivo);
  }

  get confirmModalTitulo(): string {
    const isDesarchivar = this.confirmEstadoActual === 3 || this.confirmEstadoActual === 4;
    const accion =
      isDesarchivar
        ? 'Desarchivar'
        : this.confirmEstadoObjetivo === 2
        ? 'Rechazar'
        : (this.confirmEstadoObjetivo === 1
          ? 'Validar'
          : ((this.confirmEstadoObjetivo === 3 || this.confirmEstadoObjetivo === 4)
            ? 'Archivar'
            : 'Volver a revisión'));
    return `${accion} formulario de ${this.confirmAlumnoNombre || 'usuario'}`;
  }

  get confirmModalDescripcion(): string {
    if (this.confirmEstadoActual === 3 || this.confirmEstadoActual === 4) {
      return `¿Quieres desarchivar el formulario de ${this.confirmAlumnoNombre || 'esta persona'}?`;
    }
    if (this.confirmEstadoObjetivo === 2) {
      return '¿Quieres continuar con el rechazo del formulario?';
    }
    if (this.confirmEstadoObjetivo === 3 || this.confirmEstadoObjetivo === 4) {
      return `¿Quieres archivar el formulario de ${this.confirmAlumnoNombre || 'esta persona'}?`;
    }
    if (this.confirmEstadoObjetivo === 0) {
      return `¿Quieres volver a revisar el formulario de ${this.confirmAlumnoNombre || 'esta persona'}?`;
    }
    return '¿Quieres continuar con la validación?';
  }

  estadoModuloLabel(estadoModulo: string | null, estadoModuloId: number | null): string {
    if (estadoModuloId === 1) return 'validado';
    if (estadoModuloId === 2) return 'rechazado';
    if (estadoModuloId === 0) return 'en curso';
    if ((estadoModulo || '').toLowerCase() === 'revision') return 'en curso';
    return estadoModulo || 'en curso';
  }

  estadoModuloClass(estadoModuloId: number | null): string {
    if (estadoModuloId === 1) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (estadoModuloId === 2) return 'bg-white text-slate-600 border-slate-300';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  canSolicitudValidateReject(estadoModuloId: number | null, estadoModulo: string | null): boolean {
    if (estadoModuloId === 0 || estadoModuloId === null) return true;
    return (estadoModulo || '').toLowerCase() === 'revision';
  }

  canSolicitudBackToCurso(estadoModuloId: number | null): boolean {
    return estadoModuloId === 1 || estadoModuloId === 2;
  }

  getSolicitudesEnRevision(ciclo: AdminCicloSolicitudesGroup): AdminCicloSolicitudesGroup['solicitudes'] {
    return ciclo.solicitudes.filter((s) => this.canSolicitudValidateReject(s.estadoModuloId, s.estadoModulo));
  }

  getSolicitudesValidadas(ciclo: AdminCicloSolicitudesGroup): AdminCicloSolicitudesGroup['solicitudes'] {
    return ciclo.solicitudes.filter((s) => s.estadoModuloId === 1);
  }

  getSolicitudesRechazadas(ciclo: AdminCicloSolicitudesGroup): AdminCicloSolicitudesGroup['solicitudes'] {
    return ciclo.solicitudes.filter((s) => s.estadoModuloId === 2);
  }

  isFirstOtrosInList(items: AdminCicloSolicitudesGroup['solicitudes'], index: number): boolean {
    if (!items || index <= 0) return false;
    const current = items[index];
    const previous = items[index - 1];
    return !!current?.esOtroNoRegistrado && !previous?.esOtroNoRegistrado;
  }

  isOtrosNoRegistrados(cicloNombre: string): boolean {
    return (cicloNombre || '').trim().toLowerCase().startsWith('otros no registrados');
  }

  isSolicitudUpdating(solicitudId: number): boolean {
    return this.updatingSolicitudes.has(solicitudId);
  }

  actualizarEstadoFormulario(formularioId: number, estadoId: number): void {
    if (this.updatingFormularios.has(formularioId)) return;

    this.updatingFormularios.add(formularioId);
    this.convalidacionesService
      .actualizarEstadoFormularioAdmin(formularioId, estadoId, this.adminId)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.updatingFormularios.delete(formularioId);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.error = null;
          this.cargarFormularios(this.getFormularioEstadoBackend());
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.error = 'No se pudo actualizar el estado del formulario (timeout o error de red).';
        },
      });
  }

  actualizarEstadoSolicitud(formularioId: number, solicitudId: number, estadoModuloId: number): void {
    this.actualizarEstadoSolicitudConNota(formularioId, solicitudId, estadoModuloId, null);
  }

  solicitarValidacionSolicitud(
    formulario: AdminFormulario,
    solicitud: AdminCicloSolicitudesGroup['solicitudes'][number]
  ): void {
    if (solicitud.idConvalidacion !== null && solicitud.idConvalidacion !== undefined) {
      this.actualizarEstadoSolicitudConNota(formulario.id, solicitud.id, 1, null);
      return;
    }

    this.manualNotaFormularioId = formulario.id;
    this.manualNotaSolicitud = solicitud;
    this.manualNotaInput = solicitud.nota_manual !== null && solicitud.nota_manual !== undefined
      ? this.formatearNotaModulo(solicitud.nota_manual)
      : '';
    this.manualNotaError = null;
    this.manualNotaSubmitting = false;
    this.manualNotaModalOpen = true;
  }

  cerrarModalNotaManual(resetState = false): void {
    this.manualNotaModalOpen = false;
    this.manualNotaError = null;
    this.manualNotaSubmitting = false;
    if (resetState) {
      this.manualNotaFormularioId = null;
      this.manualNotaSolicitud = null;
      this.manualNotaInput = '';
    }
  }

  confirmarValidacionSolicitudSinNota(): void {
    if (!this.manualNotaSolicitud || this.manualNotaFormularioId === null) return;
    this.manualNotaSubmitting = true;
    this.actualizarEstadoSolicitudConNota(this.manualNotaFormularioId, this.manualNotaSolicitud.id, 1, null, true);
  }

  confirmarValidacionSolicitudConNota(): void {
    if (!this.manualNotaSolicitud || this.manualNotaFormularioId === null) return;

    const parsedNota = this.parseManualNotaInput(this.manualNotaInput);
    if (parsedNota === undefined) {
      this.manualNotaError = 'Introduce una nota válida entre 0 y 10, o deja el campo vacío.';
      return;
    }

    this.manualNotaSubmitting = true;
    this.actualizarEstadoSolicitudConNota(this.manualNotaFormularioId, this.manualNotaSolicitud.id, 1, parsedNota, true);
  }

  private actualizarEstadoSolicitudConNota(
    formularioId: number,
    solicitudId: number,
    estadoModuloId: number,
    notaManual: number | null,
    closeManualModal = false
  ): void {
    if (this.updatingSolicitudes.has(solicitudId)) return;

    this.updatingSolicitudes.add(solicitudId);
    this.convalidacionesService
      .actualizarEstadoSolicitudAdmin(solicitudId, estadoModuloId, notaManual, this.adminId)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.updatingSolicitudes.delete(solicitudId);
          this.manualNotaSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          const formulario = this.formularios.find((f) => f.id === formularioId);
          const solicitud = formulario?.solicitudes?.find((s) => s.id === solicitudId);
          if (solicitud) {
            solicitud.estado_modulo_id = updated.estado_modulo_id;
            solicitud.estado_modulo = null;
            solicitud.nota_manual = updated.nota_manual ?? notaManual;
          }
          if (formulario) {
            formulario.validado_at = new Date().toISOString();
          }
          if (closeManualModal) {
            this.cerrarModalNotaManual(true);
          }
          this.error = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          if (closeManualModal) {
            this.manualNotaError = 'No se pudo validar la solicitud (timeout o error de red).';
          }
          this.error = 'No se pudo actualizar el estado del módulo solicitado (timeout o error de red).';
        },
      });
  }

  private isAcreditacionesExternasCiclo(nombre: string | null | undefined): boolean {
    return String(nombre || '').trim().toLowerCase() === 'acreditaciones externas';
  }

  getDocumentoPage(sourcePage: number | null, _sourceLink: string | null = null): number | null {
    if (sourcePage === null || sourcePage === undefined) return null;
    const page = Math.trunc(Number(sourcePage));
    return Number.isFinite(page) && page > 0 ? page : null;
  }

  buildFuenteUrl(sourceLink: string | null, sourcePage: number | null): string {
    const base = (sourceLink || '').trim();
    if (!base) return '';

    const page = this.getDocumentoPage(sourcePage);
    if (!page) return base;

    const hashIndex = base.indexOf('#');
    const cleanBase = hashIndex >= 0 ? base.slice(0, hashIndex) : base;
    return `${cleanBase}#page=${page}`;
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('es-ES');
  }
}
