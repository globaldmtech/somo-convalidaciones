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
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AdminCicloModulo,
  AdminCicloConModulos,
  AdminConvalidacionRegla,
  AdminFormulario,
  AdminUser,
  ConvalidacionesService,
} from '../services/convalidaciones.service';
import { CatalogService } from '../services/catalog.service';
import { Ciclo, Grado, Modulo } from '../models/catalog.models';
import { finalize, timeout } from 'rxjs/operators';

type AdminTab = 'formularios' | 'modulos' | 'convalidaciones' | 'administradores';

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
  modulos: Array<{ id: number; nombre: string; codigo?: string | null; nota?: number | null }>;
};

type AdminCicloSolicitudesGroup = {
  key: string;
  cicloNombre: string;
  solicitudes: Array<{
    id: number;
    nombre: string;
    codigo?: string | null;
    esOtroNoRegistrado?: boolean;
    convalidadoPor?: string | null;
    convalidadoPorIds?: number[];
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
};

type AdminConvalidacionCicloAgrupado = {
  key: string;
  cicloOrigenNombre: string;
  totalModulosNecesarios: number;
  modulosOrigen: Array<{ nombre: string; codigo: string | null }>;
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
  idModuloOrigen: number;
  moduloOrigenNombre: string;
  moduloOrigenCodigo: string | null;
  cicloOrigenNombre: string;
};

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
        <div #headerInner class="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 py-2 flex items-center justify-between gap-4 relative">
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

      <main class="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
            <div class="mb-3 flex items-start justify-between gap-3 flex-wrap">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                  [ngClass]="formularioEstadoFiltro === 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                  (click)="setFormularioEstadoFiltro(0)"
                >
                  En revisión ({{ countFormulariosByEstado(0) }})
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                  [ngClass]="formularioEstadoFiltro === 1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                  (click)="setFormularioEstadoFiltro(1)"
                >
                  Validadas ({{ countFormulariosByEstado(1) }})
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors"
                  [ngClass]="formularioEstadoFiltro === 2 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'"
                  (click)="setFormularioEstadoFiltro(2)"
                >
                  Rechazadas ({{ countFormulariosByEstado(2) }})
                </button>
              </div>
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
            </div>
            <div *ngIf="!loading && !error" class="mb-4 flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                {{ alumnosFiltrados.length }} alumnos
              </span>
              <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                {{ formulariosFiltrados.length }} formularios
              </span>
            </div>

            <div *ngIf="loading" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Cargando formularios...
            </div>
            <div *ngIf="!loading && error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ error }}
            </div>
            <div *ngIf="!loading && !error && alumnosFiltrados.length === 0" class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              No hay formularios para ese estado.
            </div>

            <div *ngIf="!loading && alumnosFiltrados.length > 0" class="space-y-4">
              <article *ngFor="let alumno of alumnosFiltrados" class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
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
                  <section *ngFor="let f of alumno.formularios" class="rounded-xl border border-slate-200 bg-white p-4">
                    <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 class="text-sm font-bold text-slate-900">Formulario #{{ f.id }}</h3>
                        <p class="text-xs text-slate-500">Enviado: {{ formatDate(f.enviado_at) }}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        <span *ngIf="f.estado_id !== 0" class="px-2.5 py-1 rounded-full text-xs font-bold" [ngClass]="estadoClass(f.estado_id)">
                          {{ estadoLabel(f) }}
                        </span>
                        <div *ngIf="canFormularioValidateReject(f.estado_id)" class="flex items-center gap-1">
                          <button
                            type="button"
                            class="inline-flex items-center justify-center w-6 h-6 rounded border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            [disabled]="isFormularioUpdating(f.id)"
                            (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, 2)"
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
                            (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, 1)"
                            title="Validar formulario"
                            aria-label="Validar formulario"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                        </div>
                        <button
                          *ngIf="canFormularioBackToRevision(f.estado_id)"
                          type="button"
                          class="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          [disabled]="isFormularioUpdating(f.id)"
                          (click)="solicitarCambioEstadoFormulario(f.id, alumno.nombre, 0)"
                          title="Volver a revisión"
                          aria-label="Volver a revisión"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 109-9m0 0H8m4 0v4"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p *ngIf="isFormularioUpdating(f.id)" class="mb-2 text-[11px] text-slate-500 text-right">Guardando estado del formulario...</p>

                    <div class="space-y-4">
                      <div class="p-1">
                        <div class="mb-2 bg-slate-100 border-l-4 border-indigo-600 px-3 py-2">
                          <p class="text-[11px] uppercase tracking-wider text-slate-500 font-bold">MÓDULOS APORTADOS</p>
                        </div>
                        <div class="space-y-2" *ngIf="getModulosPorCiclo(f).length > 0; else sinModulos">
                          <div *ngFor="let ciclo of getModulosPorCiclo(f)" class="rounded-md border border-slate-200 bg-white p-3">
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
                            <ul *ngIf="isCicloOpen(f.id, ciclo.key)" class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                              <li
                                *ngFor="let modulo of ciclo.modulos"
                                class="text-sm text-slate-700 py-1.5 border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-2"
                              >
                                <span>{{ modulo.nombre }}</span>
                                <span *ngIf="modulo.nota !== null && modulo.nota !== undefined" class="text-xs font-semibold text-indigo-700 whitespace-nowrap">
                                  Nota: {{ modulo.nota | number:'1.0-2' }}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <ng-template #sinModulos>
                          <p class="text-sm text-slate-500">Sin módulos aportados.</p>
                        </ng-template>
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
                                          (click)="actualizarEstadoSolicitud(f.id, solicitud.id, 1)"
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
                                        <ng-container *ngIf="solicitud.convalidadoPor as convalidadoPor">
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
                  <article *ngFor="let ciclo of familia.ciclos" class="rounded-xl border border-slate-200 bg-white shadow-sm p-4 h-[210px] flex flex-col">
                    <div class="mb-3">
                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                          {{ ciclo.grado_nombre || 'Sin grado' }}
                        </p>
                        <h4 class="text-sm font-bold text-slate-900 leading-5 line-clamp-2">{{ ciclo.nombre }}</h4>
                        <p class="text-xs text-slate-500 mt-1">{{ ciclo.total_modulos }} modulos</p>
                        <button
                          type="button"
                          class="mt-2 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                          (click)="abrirModalModulos(ciclo)"
                        >
                          Mostrar modulos
                        </button>
                      </div>
                    </div>

                    <div class="border-t border-slate-100 pt-3 mt-auto">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-indigo-600 transition-colors"
                          (click)="editarCiclo(ciclo)"
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
                          (click)="eliminarCiclo(ciclo)"
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

            <div *ngIf="!loadingModulos && !errorModulos && modulosVistaActiva === 'acreditaciones'" class="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <ul class="divide-y divide-slate-100">
                <li *ngFor="let modulo of modulosAcreditacionesExternas" class="px-4 py-3 flex items-start justify-between gap-3">
                  <p class="text-sm font-semibold text-slate-900 leading-5 flex-1">{{ modulo.nombre }}</p>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
            </div>
          </section>

          <section *ngIf="activeTab === 'convalidaciones'" class="space-y-4">
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
                    [disabled]="loadingConvalidacionesCiclos || !filtroConvalidacionesGradoId"
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
              Selecciona grado y ciclo destino para cargar las reglas de convalidacion.
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
                          <span class="inline-flex text-[11px] font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                            {{ ciclo.totalModulosNecesarios }} modulos
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
                      <ul class="space-y-1.5">
                        <li *ngFor="let modulo of ciclo.modulosOrigen" class="text-sm text-slate-700 leading-5">
                          <span *ngIf="modulo.codigo" class="text-slate-500">{{ modulo.codigo }} · </span>{{ modulo.nombre }}
                        </li>
                      </ul>
                    </div>
                  </article>
                </div>
              </div>
            </article>
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
            <div class="px-1">
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
                  {{ confirmEstadoObjetivo === 2 ? 'Rechazar' : (confirmEstadoObjetivo === 1 ? 'Validar' : 'Volver a revisión') }}
                </button>
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

          <div *ngIf="modulosModalCiclo" class="fixed inset-0 z-[110] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-4xl max-h-[85vh] rounded-xl bg-white border border-slate-200 shadow-xl p-5 flex flex-col overflow-hidden">
              <div class="flex items-start justify-between gap-3 shrink-0">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    {{ modulosModalCiclo.grado_nombre || 'Sin grado' }}
                  </p>
                  <h3 class="text-base font-bold text-slate-900">{{ modulosModalCiclo.nombre }}</h3>
                  <p class="text-xs text-slate-500 mt-1">
                    ID ciclo: {{ modulosModalCiclo.id }} · {{ modulosModalCiclo.total_modulos }} modulos
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
                  <div *ngFor="let item of modulosDraft; let i = index" class="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
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

                <ul class="thin-scroll space-y-2 h-full max-h-[60vh] overflow-y-auto pr-1">
                  <li
                    *ngFor="let modulo of modulosModalCiclo.modulos"
                    class="text-sm text-slate-700 leading-5 border-b border-slate-100 pb-2 flex items-start justify-between gap-3"
                  >
                    <div class="min-w-0 flex-1">
                      <span *ngIf="modulo.id_oficial" class="text-xs text-slate-500 mr-1">{{ modulo.id_oficial }}</span>
                      {{ modulo.nombre }}
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
                  <h3 class="text-base font-bold text-slate-900">
                    <span *ngIf="editConvalidacionModuloCodigo" class="text-slate-500">{{ editConvalidacionModuloCodigo }} · </span>{{ editConvalidacionModuloNombre }}
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">
                    Destino: {{ editConvalidacionCicloDestinoNombre }} · Origen: {{ editConvalidacionCicloOrigenNombre }}
                  </p>
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
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Módulos de convalidación origen</p>
                <ul class="thin-scroll space-y-2 h-full max-h-[58vh] overflow-y-auto pr-1">
                  <li
                    *ngFor="let origen of editConvalidacionOrigenes"
                    class="text-sm text-slate-700 leading-5 border-b border-slate-100 pb-2 flex items-start justify-between gap-3"
                  >
                    <div class="min-w-0 flex-1">
                      <span *ngIf="origen.moduloOrigenCodigo" class="text-xs text-slate-500 mr-1">{{ origen.moduloOrigenCodigo }}</span>
                      {{ origen.moduloOrigenNombre }}
                    </div>
                    <button
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
              </div>
            </div>
          </div>

          <div *ngIf="createConvalidacionModalOpen" class="fixed inset-0 z-[118] bg-slate-900/45 flex items-center justify-center p-4">
            <div class="w-full max-w-3xl max-h-[88vh] rounded-xl bg-white border border-slate-200 shadow-xl p-5 flex flex-col overflow-hidden">
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

              <div class="border-t border-slate-100 mt-4 pt-4 flex-1 min-h-0 overflow-hidden">
                <div class="thin-scroll h-full overflow-y-auto pr-1 space-y-5">
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
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <div class="flex items-end">
                        <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            [(ngModel)]="createConvalidacionOrigenCicloCompleto"
                            (ngModelChange)="onCrearConvalidacionOrigenCicloCompletoChange()"
                            [disabled]="!createConvalidacionOrigenCicloId"
                          />
                          Seleccionar ciclo completo
                        </label>
                      </div>
                    </div>

                    <div *ngIf="createConvalidacionOrigenCicloId" class="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Módulos origen</p>
                        <span class="text-xs text-slate-500">
                          {{ createConvalidacionOrigenCicloCompleto ? createConvalidacionOrigenModulos.length : createConvalidacionOrigenModuloIds.length }} seleccionados
                        </span>
                      </div>
                      <p
                        class="mb-2 text-xs min-h-[16px]"
                        [class.text-indigo-700]="createConvalidacionOrigenCicloCompleto"
                        [class.text-slate-500]="!createConvalidacionOrigenCicloCompleto"
                      >
                        {{ createConvalidacionOrigenCicloCompleto ? 'Ciclo completo seleccionado: se incluyen todos los módulos.' : 'Seleccione los módulos.' }}
                      </p>
                      <p *ngIf="loadingCreateConvalidacionOrigenModulos" class="text-xs text-slate-500">
                        Cargando módulos origen...
                      </p>
                      <ul *ngIf="!loadingCreateConvalidacionOrigenModulos" class="thin-scroll max-h-44 overflow-y-auto space-y-1 pr-1">
                        <li *ngFor="let modulo of createConvalidacionOrigenModulos">
                          <label class="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white">
                            <input
                              type="checkbox"
                              class="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              [checked]="createConvalidacionOrigenCicloCompleto || createConvalidacionOrigenModuloIds.includes(modulo.id)"
                              [disabled]="createConvalidacionOrigenCicloCompleto"
                              (change)="toggleCrearConvalidacionOrigenModulo(modulo.id, $any($event.target).checked)"
                            />
                            <span class="text-sm text-slate-700">
                              {{ modulo.id_oficial ? (modulo.id_oficial + ' · ') : '' }}{{ modulo.nombre }}
                            </span>
                          </label>
                        </li>
                      </ul>
                    </div>
                  </section>
                </div>
              </div>

              <p *ngIf="createConvalidacionError" class="mt-3 text-sm text-rose-700">{{ createConvalidacionError }}</p>

              <div class="mt-4 flex items-center justify-end gap-2 shrink-0">
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
        </ng-container>
      </main>
    </div>
  `,
  styles: [`
    .thin-scroll {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
    }

    .thin-scroll::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .thin-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .thin-scroll::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 9999px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }

    .thin-scroll::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8;
    }
  `],
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
  formularioEstadoFiltro: 0 | 1 | 2 = 0;
  openAlumnos = new Set<string>();
  openCiclos = new Set<string>();
  openCatalogCiclos = new Set<number>();
  openConvalidaciones = new Set<number>();
  openConvalidacionCiclos = new Set<string>();
  updatingFormularios = new Set<number>();
  updatingSolicitudes = new Set<number>();
  confirmModalOpen = false;
  confirmFormularioId: number | null = null;
  confirmAlumnoNombre = '';
  confirmEstadoObjetivo: 0 | 1 | 2 = 1;
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
  showAddModulosForm = false;
  modulosDraft: ModuloDraftRow[] = [{ id_oficial: '', nombre: '' }];
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
  createConvalidacionDestinoModulos: Modulo[] = [];
  createConvalidacionCiclosOrigen: Ciclo[] = [];
  createConvalidacionOrigenCicloId: number | null = null;
  createConvalidacionOrigenCicloCompleto = false;
  createConvalidacionOrigenModulos: Modulo[] = [];
  createConvalidacionOrigenModuloIds: number[] = [];
  loadingCreateConvalidacionDestinoModulos = false;
  loadingCreateConvalidacionCiclosOrigen = false;
  loadingCreateConvalidacionOrigenModulos = false;
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
  filtroConvalidacionesGradoId: number | null = null;
  filtroConvalidacionesCicloId: number | null = null;
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
    this.modulosDraft = [{ id_oficial: '', nombre: '' }];
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
    this.filtroConvalidacionesGradoId = null;
    this.filtroConvalidacionesCicloId = null;
    this.convalidacionesGrados = [];
    this.convalidacionesCiclos = [];
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
      this.cargarFormularios();
      return;
    }
    if (this.activeTab === 'modulos') {
      this.cargarCiclosModulos();
      return;
    }
    if (this.activeTab === 'convalidaciones') {
      this.loadConvalidacionesGrados();
      return;
    }
    this.cargarAdministradores();
  }

  cargarFormularios(): void {
    if (!this.isAuthenticated) return;

    this.loading = true;
    this.error = null;

    this.convalidacionesService.getFormulariosAdmin().subscribe({
      next: (rows) => {
        this.formularios = Array.isArray(rows)
          ? rows.map((row) => ({
              ...row,
              solicitudes: Array.isArray(row?.solicitudes) ? row.solicitudes : [],
              modulos_aportados: Array.isArray(row?.modulos_aportados) ? row.modulos_aportados : [],
            }))
          : [];
        this.alumnos = this.groupByAlumno(this.formularios);
        if (!this.loadedModulos && !this.loadingModulos) {
          this.cargarCiclosModulos();
        }
        this.loading = false;
        this.cdr.detectChanges();
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

  setFormularioEstadoFiltro(estado: 0 | 1 | 2): void {
    this.formularioEstadoFiltro = estado;
    this.openAlumnos.clear();
  }

  countFormulariosByEstado(estado: 0 | 1 | 2): number {
    return this.formularios.filter((f) => f.estado_id === estado).length;
  }

  get formulariosFiltrados(): AdminFormulario[] {
    return this.formularios.filter((f) => f.estado_id === this.formularioEstadoFiltro);
  }

  get alumnosFiltrados(): AdminAlumnoGroup[] {
    return this.groupByAlumno(this.formulariosFiltrados);
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
      },
      error: (err) => {
        if (this.handleAdminUnauthorized(err)) return;
        const status = err?.status ? ` (HTTP ${err.status})` : '';
        this.error = `No se pudo exportar solicitudes de convalidación${status}.`;
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
        this.convalidacionesGrados = Array.isArray(rows) ? rows : [];
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

  private loadConvalidacionesCiclos(gradoId: number): void {
    this.loadingConvalidacionesCiclos = true;
    this.catalogService.getCiclos(gradoId).subscribe({
      next: (rows) => {
        this.convalidacionesCiclos = Array.isArray(rows) ? rows : [];
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

    if (!this.filtroConvalidacionesGradoId) {
      this.convalidacionesCiclos = [];
      return;
    }

    this.loadConvalidacionesCiclos(Number(this.filtroConvalidacionesGradoId));
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
    if (!this.filtroConvalidacionesCicloId || !this.filtroConvalidacionesGradoId) {
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
    this.convalidacionesCiclos = [];
    this.loadedConvalidaciones = false;
  }

  get hasConvalidacionesFiltroAplicado(): boolean {
    return !!this.filtroConvalidacionesGradoId && !!this.filtroConvalidacionesCicloId;
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

  get canCrearAdministrador(): boolean {
    return this.createAdminNombre.trim().length > 0 && this.createAdminPassword.length > 0;
  }

  abrirModalCrearAdministrador(): void {
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
    const sesionAdmin = this.adminDisplayName.trim().toLowerCase() === 'admin';
    const filaAdmin = (admin?.nombre || '').trim().toLowerCase() === 'admin';
    return sesionAdmin && !filaAdmin;
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

  get modulosAcreditacionesExternas(): Array<AdminCicloModulo & { cicloNombre: string }> {
    const modulos = new Map<number, AdminCicloModulo & { cicloNombre: string }>();
    for (const ciclo of this.ciclosAcreditacionesExternasCatalogo) {
      for (const modulo of ciclo.modulos || []) {
        modulos.set(modulo.id, { ...modulo, cicloNombre: ciclo.nombre });
      }
    }
    return Array.from(modulos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
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

  get convalidacionesAgrupadas(): AdminConvalidacionModuloAgrupado[] {
    const modulosMap = new Map<number, {
      idModuloDestino: number;
      moduloDestinoNombre: string;
      moduloDestinoCodigo: string | null;
      cicloDestinoNombre: string;
      ciclosMap: Map<string, {
        cicloOrigenNombre: string;
        modulosOrigenMap: Map<string, { nombre: string; codigo: string | null }>;
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
            modulosOrigenMap: new Map<string, { nombre: string; codigo: string | null }>(),
            reglas: new Set<number>(),
          });
        }
        const ciclo = modulo.ciclosMap.get(cicloOrigenNombre)!;
        const moduloOrigenNombre = (origen.modulo_origen_nombre || '').trim();
        if (moduloOrigenNombre) {
          const codigo = (origen.modulo_origen_codigo || '').trim() || null;
          const moduloKey = `${moduloOrigenNombre.toLowerCase()}::${codigo || ''}`;
          ciclo.modulosOrigenMap.set(moduloKey, {
            nombre: moduloOrigenNombre,
            codigo,
          });
        }
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
            totalModulosNecesarios: ciclo.modulosOrigenMap.size,
            modulosOrigen: Array.from(ciclo.modulosOrigenMap.values()).sort((a, b) => {
              const byNombre = a.nombre.localeCompare(b.nombre, 'es');
              if (byNombre !== 0) return byNombre;
              return (a.codigo || '').localeCompare(b.codigo || '', 'es');
            }),
            totalReglas: ciclo.reglas.size,
            reglaIds: Array.from(ciclo.reglas.values()).sort((a, b) => a - b),
          }))
          .sort((a, b) => a.cicloOrigenNombre.localeCompare(b.cicloOrigenNombre, 'es')),
      }))
      .sort((a, b) => a.moduloDestinoNombre.localeCompare(b.moduloDestinoNombre, 'es'));
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
          idModuloOrigen: Number(origen.id_modulo_origen),
          moduloOrigenNombre: origen.modulo_origen_nombre,
          moduloOrigenCodigo: origen.modulo_origen_codigo ?? null,
          cicloOrigenNombre: origen.ciclo_origen_nombre,
        });
      }
    }

    this.editConvalidacionModuloNombre = grupo.moduloDestinoNombre;
    this.editConvalidacionModuloCodigo = grupo.moduloDestinoCodigo;
    this.editConvalidacionCicloDestinoNombre = grupo.cicloDestinoNombre;
    this.editConvalidacionCicloOrigenNombre = ciclo.cicloOrigenNombre;
    this.editConvalidacionOrigenes = origenes.sort((a, b) => {
      const byNombre = a.moduloOrigenNombre.localeCompare(b.moduloOrigenNombre, 'es');
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
    this.createConvalidacionDestinoModulos = [];
    this.createConvalidacionCiclosOrigen = [];
    this.createConvalidacionOrigenCicloId = null;
    this.createConvalidacionOrigenCicloCompleto = false;
    this.createConvalidacionOrigenModulos = [];
    this.createConvalidacionOrigenModuloIds = [];
    this.creatingConvalidacion = false;
    this.errorConvalidaciones = null;

    this.cargarModulosDestinoCrearConvalidacion(cicloDestinoId);
    this.cargarCiclosOrigenCrearConvalidacion();
  }

  cerrarModalCrearConvalidacion(_force = false): void {
    this.createConvalidacionModalOpen = false;
    this.createConvalidacionDestinoModuloId = null;
    this.createConvalidacionDestinoModulos = [];
    this.createConvalidacionCiclosOrigen = [];
    this.createConvalidacionOrigenCicloId = null;
    this.createConvalidacionOrigenCicloCompleto = false;
    this.createConvalidacionOrigenModulos = [];
    this.createConvalidacionOrigenModuloIds = [];
    this.loadingCreateConvalidacionDestinoModulos = false;
    this.loadingCreateConvalidacionCiclosOrigen = false;
    this.loadingCreateConvalidacionOrigenModulos = false;
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

  onCrearConvalidacionOrigenCicloChange(): void {
    this.createConvalidacionOrigenCicloCompleto = false;
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
          }))
          .filter((item) => Number.isFinite(item.id) && !!(item.nombre || '').trim())
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
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
    if (this.createConvalidacionOrigenCicloCompleto) return;
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
    if (!this.createConvalidacionOrigenCicloId) return false;
    if (this.createConvalidacionOrigenCicloCompleto) return this.createConvalidacionOrigenModulos.length > 0;
    return this.createConvalidacionOrigenModuloIds.length > 0;
  }

  guardarNuevaConvalidacion(): void {
    if (!this.canGuardarNuevaConvalidacion) {
      this.createConvalidacionError = 'Completa la selección antes de guardar.';
      return;
    }
    if (this.creatingConvalidacion) return;

    const idModuloDestino = Number(this.createConvalidacionDestinoModuloId);
    const idsOrigen = this.createConvalidacionOrigenCicloCompleto
      ? this.createConvalidacionOrigenModulos
          .map((modulo) => Number(modulo.id))
          .filter((id) => Number.isFinite(id) && id > 0)
      : this.createConvalidacionOrigenModuloIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0);
    const idModulosOrigen = Array.from(new Set(idsOrigen)).sort((a, b) => a - b);

    if (!Number.isFinite(idModuloDestino) || idModuloDestino <= 0 || idModulosOrigen.length === 0) {
      this.createConvalidacionError = 'No se ha podido preparar la regla con los datos seleccionados.';
      return;
    }

    this.creatingConvalidacion = true;
    this.createConvalidacionError = null;

    this.convalidacionesService
      .crearConvalidacionAdmin({
        id_modulo_destino: idModuloDestino,
        id_modulos_origen: idModulosOrigen,
        source_link: null,
        source_page: null,
      })
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
      this.convalidacionesService.eliminarConvalidacionAdmin(id)
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
    this.modulosDraft = [{ id_oficial: '', nombre: '' }];
    this.createModulosError = null;
    this.creatingModulos = false;
  }

  cerrarModalModulos(): void {
    this.modulosModalCiclo = null;
    this.showAddModulosForm = false;
    this.modulosDraft = [{ id_oficial: '', nombre: '' }];
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

  toggleAddModulosForm(): void {
    this.showAddModulosForm = !this.showAddModulosForm;
    if (this.showAddModulosForm && this.modulosDraft.length === 0) {
      this.modulosDraft = [{ id_oficial: '', nombre: '' }];
    }
    if (!this.showAddModulosForm) {
      this.createModulosError = null;
    }
  }

  addModuloDraftRow(): void {
    this.modulosDraft = [...this.modulosDraft, { id_oficial: '', nombre: '' }];
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
          this.modulosDraft = [{ id_oficial: '', nombre: '' }];
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
      return;
    }
    this.openCiclos.add(key);
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
      .map((m) => m.nota)
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    if (notas.length !== ciclo.modulos.length) return null;
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
    solicitud: { convalidadoPor?: string | null; convalidadoPorIds?: number[] | null }
  ): string[] {
    const ids = solicitud.convalidadoPorIds ?? [];
    if (ids.length > 0) {
      const modulosById = this.getModulosAportadosById(formulario);
      return ids.map((id) => {
        const modulo = modulosById.get(id);
        if (!modulo) return `Módulo ${id} (sin nota)`;
        if (modulo.nota === null || modulo.nota === undefined) return `${modulo.nombre} (sin nota)`;
        return `${modulo.nombre} (${this.formatearNotaModulo(modulo.nota)})`;
      });
    }

    const notasPorNombre = this.getNotasPorNombreModuloFormulario(formulario);
    return this.getConvalidadoPorLista(solicitud.convalidadoPor).map((nombre) => {
      const nota = notasPorNombre.get(this.normalizarTextoModulo(nombre));
      if (nota === null || nota === undefined) return `${nombre} (sin nota)`;
      return `${nombre} (${this.formatearNotaModulo(nota)})`;
    });
  }

  debeMostrarDesplegableConvalidadoPor(convalidadoPor: string | null | undefined): boolean {
    return this.getConvalidadoPorLista(convalidadoPor).length > 2;
  }

  private getNotasPorNombreModuloFormulario(formulario: AdminFormulario): Map<string, number> {
    const map = new Map<string, number>();
    const modulos = formulario.modulos_aportados ?? [];
    for (const modulo of modulos) {
      const nombre = (modulo.modulo_nombre || modulo.descripcion || '').trim();
      if (!nombre) continue;
      const nota = modulo.nota;
      if (typeof nota !== 'number' || !Number.isFinite(nota)) continue;
      const key = this.normalizarTextoModulo(nombre);
      if (!key) continue;
      const actual = map.get(key);
      if (actual === undefined || nota > actual) {
        map.set(key, nota);
      }
    }
    return map;
  }

  private getModulosAportadosById(
    formulario: AdminFormulario
  ): Map<number, { nombre: string; nota: number | null }> {
    const map = new Map<number, { nombre: string; nota: number | null }>();
    const modulos = formulario.modulos_aportados ?? [];
    for (const modulo of modulos) {
      const idModulo = Number(modulo.id_modulo);
      if (!Number.isFinite(idModulo)) continue;
      const nombre = (modulo.modulo_nombre || modulo.descripcion || `Módulo ${idModulo}`).trim();
      const nota = typeof modulo.nota === 'number' && Number.isFinite(modulo.nota) ? modulo.nota : null;
      const current = map.get(idModulo);
      if (!current || ((current.nota ?? -Infinity) < (nota ?? -Infinity))) {
        map.set(idModulo, { nombre, nota });
      }
    }
    return map;
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
        nombre: solicitud.modulo_destino || solicitud.descripcion || 'Solicitud sin detalle',
        codigo: solicitud.modulo_destino_codigo ?? null,
        esOtroNoRegistrado: !solicitud.id_modulo_destino,
        convalidadoPor: solicitud.convalidado_por ?? solicitud.convalidadoPor ?? null,
        convalidadoPorIds: this.parseConvalidadoPorIds(solicitud.convalidado_por_ids ?? solicitud.convalidadoPorIds ?? null),
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
    if (formulario.estado) return formulario.estado;
    if (formulario.estado_id === 0) return 'revision';
    if (formulario.estado_id === 1) return 'validado';
    if (formulario.estado_id === 2) return 'rechazado';
    return 'desconocido';
  }

  estadoClass(estadoId: number): string {
    if (estadoId === 1) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (estadoId === 2) return 'bg-rose-50 text-rose-700 border border-rose-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }

  canFormularioValidateReject(estadoId: number): boolean {
    return estadoId === 0;
  }

  canFormularioBackToRevision(estadoId: number): boolean {
    return estadoId === 1 || estadoId === 2;
  }

  isFormularioUpdating(formularioId: number): boolean {
    return this.updatingFormularios.has(formularioId);
  }

  solicitarCambioEstadoFormulario(formularioId: number, alumnoNombre: string, estadoObjetivo: 0 | 1 | 2): void {
    this.confirmFormularioId = formularioId;
    this.confirmAlumnoNombre = (alumnoNombre || '').trim();
    this.confirmEstadoObjetivo = estadoObjetivo;
    this.confirmModalOpen = true;
  }

  cancelarConfirmacionFormulario(): void {
    this.confirmModalOpen = false;
    this.confirmFormularioId = null;
    this.confirmAlumnoNombre = '';
  }

  confirmarValidacionFormulario(): void {
    if (this.confirmFormularioId == null) return;
    const formularioId = this.confirmFormularioId;
    this.confirmModalOpen = false;
    this.confirmFormularioId = null;
    this.confirmAlumnoNombre = '';
    this.actualizarEstadoFormulario(formularioId, this.confirmEstadoObjetivo);
  }

  get confirmModalTitulo(): string {
    const accion =
      this.confirmEstadoObjetivo === 2
        ? 'Rechazar'
        : (this.confirmEstadoObjetivo === 1 ? 'Validar' : 'Volver a revisión');
    return `${accion} formulario de ${this.confirmAlumnoNombre || 'usuario'}`;
  }

  get confirmModalDescripcion(): string {
    if (this.confirmEstadoObjetivo === 2) {
      return '¿Quieres continuar con el rechazo del formulario?';
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
        next: (updated) => {
          const formulario = this.formularios.find((f) => f.id === formularioId);
          if (formulario) {
            formulario.estado_id = updated.estado_id;
            formulario.estado = null;
            formulario.validado_at = new Date().toISOString();
          }
          this.error = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.error = 'No se pudo actualizar el estado del formulario (timeout o error de red).';
        },
      });
  }

  actualizarEstadoSolicitud(formularioId: number, solicitudId: number, estadoModuloId: number): void {
    if (this.updatingSolicitudes.has(solicitudId)) return;

    this.updatingSolicitudes.add(solicitudId);
    this.convalidacionesService
      .actualizarEstadoSolicitudAdmin(solicitudId, estadoModuloId, this.adminId)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.updatingSolicitudes.delete(solicitudId);
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
          }
          if (formulario) {
            formulario.validado_at = new Date().toISOString();
          }
          this.error = null;
        },
        error: (err) => {
          if (this.handleAdminUnauthorized(err)) return;
          this.error = 'No se pudo actualizar el estado del módulo solicitado (timeout o error de red).';
        },
      });
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('es-ES');
  }
}
