import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { FormularioEstudio, FormularioSubmission } from '../../core/models';

@Component({
  selector: 'app-convalidaciones',
  imports: [CommonModule],
  templateUrl: './convalidaciones.component.html',
  styleUrl: './convalidaciones.component.css'
})
export class ConvalidacionesComponent {
  private readonly submissionsSignal = signal<FormularioSubmission[]>([]);

  protected readonly submissions = computed(() => this.submissionsSignal());
  protected readonly hasSubmissions = computed(() => this.submissions().length > 0);
  protected readonly pendientes = computed(() =>
    this.submissions().filter((item) => this.getEstadoLabel(item) === 'A revisar')
  );
  protected readonly aprobados = computed(() =>
    this.submissions().filter((item) => this.getEstadoLabel(item) === 'Aprobado')
  );
  protected readonly pendingPageSize = signal(5);
  protected readonly approvedPageSize = signal(5);
  protected readonly pendingPage = signal(1);
  protected readonly approvedPage = signal(1);
  protected readonly pendingSort = signal<'recent' | 'old'>('recent');
  protected readonly approvedSort = signal<'recent' | 'old'>('recent');
  protected readonly pendingTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.pendientes().length / this.pendingPageSize()))
  );
  protected readonly approvedTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.aprobados().length / this.approvedPageSize()))
  );
  protected readonly pendientesPage = computed(() =>
    this.slicePage(
      this.sortByDate(this.pendientes(), this.pendingSort()),
      this.pendingPage(),
      this.pendingPageSize()
    )
  );
  protected readonly aprobadosPage = computed(() =>
    this.slicePage(
      this.sortByDate(this.aprobados(), this.approvedSort()),
      this.approvedPage(),
      this.approvedPageSize()
    )
  );

  constructor() {
    this.loadSubmissions();
  }

  protected trackById(_: number, item: FormularioSubmission): string {
    return item.id;
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected formatDate(value: string): string {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }

  protected formatEstudio(estudio: FormularioEstudio): string {
    if (this.isCatalogTipo(estudio.tipo)) {
      return [
        estudio.grado || 'Sin grado',
        estudio.familia || 'Sin familia',
        estudio.ciclo || 'Sin ciclo',
        estudio.modulo || 'Sin módulo'
      ].join(' · ');
    }
    return estudio.descripcion || 'Sin descripción';
  }

  protected isCatalogTipo(tipo: string): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  protected getEstadoLabel(item: FormularioSubmission): 'Aprobado' | 'A revisar' {
    return item.estado === 'Aprobado' ? 'Aprobado' : 'A revisar';
  }

  protected onPendingPageSizeChange(value: string): void {
    const size = Number.parseInt(value, 10);
    this.pendingPageSize.set(Number.isNaN(size) ? 5 : size);
    this.pendingPage.set(1);
    this.clearPendienteSelection();
  }

  protected onApprovedPageSizeChange(value: string): void {
    const size = Number.parseInt(value, 10);
    this.approvedPageSize.set(Number.isNaN(size) ? 5 : size);
    this.approvedPage.set(1);
  }

  protected onPendingSortChange(value: string): void {
    this.pendingSort.set(value === 'old' ? 'old' : 'recent');
    this.pendingPage.set(1);
    this.clearPendienteSelection();
  }

  protected onApprovedSortChange(value: string): void {
    this.approvedSort.set(value === 'old' ? 'old' : 'recent');
    this.approvedPage.set(1);
  }

  protected readValue(event: Event): string {
    const target = event.target as HTMLSelectElement | HTMLInputElement | null;
    return target?.value ?? '';
  }

  protected validateAllPendientes(): void {
    this.submissionsSignal.update((items) =>
      items.map((item) =>
        this.getEstadoLabel(item) === 'A revisar' ? { ...item, estado: 'Aprobado' } : item
      )
    );
    this.selectedPendientes.set(new Set());
    this.normalizePages();
  }

  protected onValidateOne(item: FormularioSubmission, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.submissionsSignal.update((items) =>
      items.map((current) =>
        current.id === item.id ? { ...current, estado: 'Aprobado' } : current
      )
    );
    this.normalizePages();
  }

  protected onReviewOne(item: FormularioSubmission, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.submissionsSignal.update((items) =>
      items.map((current) =>
        current.id === item.id ? { ...current, estado: 'A revisar' } : current
      )
    );
    this.normalizePages();
  }

  protected readonly selectedPendientes = signal(new Set<string>());

  protected togglePendienteSelection(id: string, event: Event): void {
    event.stopPropagation();
    const target = event.target as HTMLInputElement | null;
    const checked = Boolean(target?.checked);
    this.selectedPendientes.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  protected isPendienteSelected(id: string): boolean {
    return this.selectedPendientes().has(id);
  }

  protected validateSelectedPendientes(): void {
    const selected = this.selectedPendientes();
    if (!selected.size) return;
    this.submissionsSignal.update((items) =>
      items.map((item) =>
        selected.has(item.id) ? { ...item, estado: 'Aprobado' } : item
      )
    );
    this.selectedPendientes.set(new Set());
    this.normalizePages();
  }

  protected clearPendienteSelection(): void {
    this.selectedPendientes.set(new Set());
  }

  protected goPendingPrev(): void {
    this.pendingPage.update((page) => Math.max(1, page - 1));
    this.clearPendienteSelection();
  }

  protected goPendingNext(): void {
    this.pendingPage.update((page) =>
      Math.min(this.pendingTotalPages(), page + 1)
    );
    this.clearPendienteSelection();
  }

  protected goApprovedPrev(): void {
    this.approvedPage.update((page) => Math.max(1, page - 1));
  }

  protected goApprovedNext(): void {
    this.approvedPage.update((page) =>
      Math.min(this.approvedTotalPages(), page + 1)
    );
  }

  private loadSubmissions(): void {
    this.submissionsSignal.set(MOCK_SUBMISSIONS);
    this.normalizePages();
  }

  private slicePage<T>(items: T[], page: number, size: number): T[] {
    const safeSize = Math.max(1, size);
    const maxPage = Math.max(1, Math.ceil(items.length / safeSize));
    const safePage = Math.min(Math.max(1, page), maxPage);
    const start = (safePage - 1) * safeSize;
    return items.slice(start, start + safeSize);
  }

  private sortByDate(items: FormularioSubmission[], mode: 'recent' | 'old'): FormularioSubmission[] {
    const direction = mode === 'old' ? 1 : -1;
    return [...items].sort((a, b) => {
      const aTime = this.parseDate(a.createdAt);
      const bTime = this.parseDate(b.createdAt);
      return (aTime - bTime) * direction;
    });
  }

  private parseDate(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private normalizePages(): void {
    this.pendingPage.update((page) =>
      Math.min(page, this.pendingTotalPages())
    );
    this.approvedPage.update((page) =>
      Math.min(page, this.approvedTotalPages())
    );
  }
}

const MOCK_SUBMISSIONS: FormularioSubmission[] = [
  {
    id: 'mock-laura',
    createdAt: '2026-02-06T09:10:00.000Z',
    estado: 'A revisar',
    personal: {
      nif: '12345678Z',
      nombre: 'Laura',
      apellidos: 'García López',
      domicilio: 'Calle Mayor 12',
      codigoPostal: '28013',
      localidad: 'Madrid',
      provincia: 'Madrid',
      telefonoFijo: '',
      telefonoMovil: '600123456',
      email: 'laura.garcia@email.com'
    },
    academico: {
      cicloMatriculado: 'Gestión Administrativa',
      normativa: 'LOE',
      grado: 'Grado Medio',
      curso: '1º'
    },
    estudios: [
      {
        tipo: 'LOE',
        grado: 'Grado Medio',
        familia: 'Administración y Gestión',
        ciclo: 'Gestión Administrativa',
        modulo: 'Todos',
        descripcion: ''
      }
    ],
    modulos: [
      {
        nombre: 'Comunicación empresarial',
        codigo: '0001'
      }
    ],
    documentos: {
      dni: true,
      cert: true,
      acred: false,
      justif: false
    },
    fechaSolicitud: '2026-02-06',
    firma:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='120' viewBox='0 0 260 120'><path d='M10 70 Q60 30 120 60 T250 60' stroke='%231c1e39' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"
  },
  {
    id: 'mock-pablo',
    createdAt: '2026-02-01T12:20:00.000Z',
    estado: 'Aprobado',
    personal: {
      nif: '98765432X',
      nombre: 'Pablo',
      apellidos: 'Serrano Ruiz',
      domicilio: 'Av. del Mar 45',
      codigoPostal: '29001',
      localidad: 'Málaga',
      provincia: 'Málaga',
      telefonoFijo: '',
      telefonoMovil: '620998877',
      email: 'pablo.serrano@email.com'
    },
    academico: {
      cicloMatriculado: 'Desarrollo de Aplicaciones Web',
      normativa: 'LOGSE',
      grado: 'Grado Superior',
      curso: '2º'
    },
    estudios: [
      {
        tipo: 'LOGSE',
        grado: 'Grado Superior',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Desarrollo de Aplicaciones Web',
        modulo: 'Todos',
        descripcion: ''
      }
    ],
    modulos: [
      {
        nombre: 'Entornos de desarrollo',
        codigo: ''
      },
      {
        nombre: 'Bases de datos',
        codigo: ''
      }
    ],
    documentos: {
      dni: true,
      cert: true,
      acred: false,
      justif: true
    },
    fechaSolicitud: '2026-02-01',
    firma:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='120' viewBox='0 0 260 120'><path d='M12 70 Q70 20 140 55 T248 58' stroke='%231c1e39' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"
  },
  {
    id: 'mock-lucia',
    createdAt: '2026-02-05T10:45:00.000Z',
    estado: 'A revisar',
    personal: {
      nif: '34567890M',
      nombre: 'Lucía',
      apellidos: 'Martín Vega',
      domicilio: 'Calle Sol 18',
      codigoPostal: '41002',
      localidad: 'Sevilla',
      provincia: 'Sevilla',
      telefonoFijo: '',
      telefonoMovil: '650112233',
      email: 'lucia.martin@email.com'
    },
    academico: {
      cicloMatriculado: 'Atención a Personas en Situación de Dependencia',
      normativa: 'LOE',
      grado: 'Grado Medio',
      curso: '2º'
    },
    estudios: [
      {
        tipo: 'LOE',
        grado: 'Grado Medio',
        familia: 'Servicios Socioculturales y a la Comunidad',
        ciclo: 'Atención a Personas en Situación de Dependencia',
        modulo: 'Todos',
        descripcion: ''
      }
    ],
    modulos: [
      {
        nombre: 'Características y necesidades de las personas en situación de dependencia',
        codigo: '0023'
      }
    ],
    documentos: {
      dni: true,
      cert: false,
      acred: true,
      justif: false
    },
    fechaSolicitud: '2026-02-05',
    firma:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='120' viewBox='0 0 260 120'><path d='M16 72 Q70 35 130 58 T246 52' stroke='%231c1e39' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"
  },
  {
    id: 'mock-samuel',
    createdAt: '2026-02-03T16:05:00.000Z',
    estado: 'A revisar',
    personal: {
      nif: '56473829H',
      nombre: 'Samuel',
      apellidos: 'Ortega Gil',
      domicilio: 'Paseo del Río 7',
      codigoPostal: '46005',
      localidad: 'Valencia',
      provincia: 'Valencia',
      telefonoFijo: '',
      telefonoMovil: '633445566',
      email: 'samuel.ortega@email.com'
    },
    academico: {
      cicloMatriculado: 'Sistemas Microinformáticos y Redes',
      normativa: 'LOGSE',
      grado: 'Grado Medio',
      curso: '1º'
    },
    estudios: [
      {
        tipo: 'LOGSE',
        grado: 'Grado Medio',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Sistemas Microinformáticos y Redes',
        modulo: 'Todos',
        descripcion: ''
      }
    ],
    modulos: [
      {
        nombre: 'Montaje y mantenimiento de equipos',
        codigo: ''
      },
      {
        nombre: 'Redes locales',
        codigo: ''
      }
    ],
    documentos: {
      dni: true,
      cert: true,
      acred: false,
      justif: false
    },
    fechaSolicitud: '2026-02-03',
    firma:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='120' viewBox='0 0 260 120'><path d='M14 68 Q66 18 120 54 T248 64' stroke='%231c1e39' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"
  },
  {
    id: 'mock-irene',
    createdAt: '2026-01-30T09:35:00.000Z',
    estado: 'Aprobado',
    personal: {
      nif: '11223344J',
      nombre: 'Irene',
      apellidos: 'Campos Nieto',
      domicilio: 'Calle Castilla 25',
      codigoPostal: '33004',
      localidad: 'Oviedo',
      provincia: 'Asturias',
      telefonoFijo: '',
      telefonoMovil: '699221144',
      email: 'irene.campos@email.com'
    },
    academico: {
      cicloMatriculado: 'Administración y Finanzas',
      normativa: 'LOE',
      grado: 'Grado Superior',
      curso: '2º'
    },
    estudios: [
      {
        tipo: 'LOE',
        grado: 'Grado Superior',
        familia: 'Administración y Gestión',
        ciclo: 'Administración y Finanzas',
        modulo: 'Todos',
        descripcion: ''
      }
    ],
    modulos: [
      {
        nombre: 'Gestión de la documentación jurídica y empresarial',
        codigo: '0645'
      },
      {
        nombre: 'Recursos humanos y responsabilidad social corporativa',
        codigo: '0647'
      }
    ],
    documentos: {
      dni: true,
      cert: true,
      acred: false,
      justif: true
    },
    fechaSolicitud: '2026-01-30',
    firma:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='120' viewBox='0 0 260 120'><path d='M18 74 Q78 22 132 56 T244 50' stroke='%231c1e39' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"
  }
];
