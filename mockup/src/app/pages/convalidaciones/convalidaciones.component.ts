import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { FormularioAConvalidar, FormularioEstudio, FormularioSubmission } from '../../core/models';

type ValidationDialogMode = 'one' | 'selected' | 'all';

type ValidationDialogState = {
  mode: ValidationDialogMode;
  ids: string[];
  title: string;
  message: string;
};

@Component({
  selector: 'app-convalidaciones',
  imports: [CommonModule],
  templateUrl: './convalidaciones.component.html',
  styleUrl: './convalidaciones.component.css'
})
export class ConvalidacionesComponent {
  private readonly submissionsSignal = signal<FormularioSubmission[]>([]);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly documentRef = inject(DOCUMENT);

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

  protected isCatalogTipo(tipo: string): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  protected getTipoEstudiosLabel(item: FormularioSubmission): string {
    const tipos = Array.from(
      new Set(
        item.estudios
          .map((estudio) => estudio.tipo.trim())
          .filter((tipo) => tipo.length > 0)
      )
    );
    return tipos.length ? tipos.join(' / ') : 'Sin tipo';
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

  protected requestValidatePendientes(): void {
    const selectedIds = Array.from(this.selectedPendientes());
    if (selectedIds.length) {
      const selectedMessage =
        selectedIds.length === 1
          ? 'Se validará 1 solicitud seleccionada. Pasará a estado "Aprobado".'
          : `Se validarán ${selectedIds.length} solicitudes seleccionadas. Pasarán a estado "Aprobado".`;
      this.validationDialog.set({
        mode: 'selected',
        ids: selectedIds,
        title: 'Validar seleccionados',
        message: selectedMessage
      });
      return;
    }

    const pendingIds = this.pendientes().map((item) => item.id);
    if (!pendingIds.length) return;
    const pendingMessage =
      pendingIds.length === 1
        ? 'Se validará 1 solicitud pendiente. Pasará a estado "Aprobado".'
        : `Se validarán ${pendingIds.length} solicitudes pendientes. Pasarán a estado "Aprobado".`;
    this.validationDialog.set({
      mode: 'all',
      ids: pendingIds,
      title: 'Validar todos',
      message: pendingMessage
    });
  }

  protected onValidateOne(item: FormularioSubmission, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const fullName = `${item.personal.nombre} ${item.personal.apellidos}`.trim();
    const applicant = fullName || 'este solicitante';
    this.validationDialog.set({
      mode: 'one',
      ids: [item.id],
      title: 'Validar convalidación',
      message: `Se validará la solicitud de ${applicant}. Pasará a estado "Aprobado".`
    });
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

  protected openDocumentViewer(
    url: string | null | undefined,
    item: FormularioSubmission | null = null,
    docLabel = 'Documento',
    event?: Event
  ): void {
    event?.preventDefault();
    event?.stopPropagation();
    const safeUrl = url?.trim() || 'docs/dni.pdf';
    const resolvedUrl = new URL(safeUrl, this.documentRef.baseURI).toString();
    this.documentViewerTitle.set(this.buildDocumentViewerTitle(docLabel, item));
    this.documentViewerUrl.set(
      this.sanitizer.bypassSecurityTrustResourceUrl(resolvedUrl)
    );
    this.documentViewerOpen.set(true);
  }

  protected closeDocumentViewer(): void {
    this.documentViewerOpen.set(false);
    this.documentViewerUrl.set(null);
    this.documentViewerTitle.set('Documento adjunto');
  }

  protected cancelValidation(): void {
    this.validationDialog.set(null);
  }

  protected confirmValidation(): void {
    const dialog = this.validationDialog();
    if (!dialog) return;
    this.validationDialog.set(null);
    if (!dialog.ids.length) return;
    this.applyValidation(dialog.ids);
  }

  protected readonly selectedPendientes = signal(new Set<string>());
  protected readonly validationDialog = signal<ValidationDialogState | null>(null);
  protected readonly documentViewerOpen = signal(false);
  protected readonly documentViewerUrl = signal<SafeResourceUrl | null>(null);
  protected readonly documentViewerTitle = signal('Documento adjunto');

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
      const aTime = this.parseDate(a.fechaSolicitud || a.createdAt);
      const bTime = this.parseDate(b.fechaSolicitud || b.createdAt);
      return (aTime - bTime) * direction;
    });
  }

  private parseDate(value: string): number {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  protected formatEstudio(estudio: FormularioEstudio): string {
    if (this.isCatalogTipo(estudio.tipo)) {
      const parts = [estudio.ciclo, estudio.modulo]
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      return parts.length ? parts.join(' · ') : 'Sin descripción';
    }
    const descripcion = estudio.descripcion.trim();
    return descripcion || 'Sin descripción';
  }

  protected getEstudioTitle(estudio: FormularioEstudio): string {
    if (this.isCatalogTipo(estudio.tipo)) {
      const familia = estudio.familia.trim();
      return familia || 'Sin familia';
    }
    const descripcion = estudio.descripcion.trim();
    return descripcion || 'Sin descripción';
  }

  protected formatAConvalidar(convalidacion: FormularioAConvalidar): string {
    if (this.isCatalogTipo(convalidacion.tipo)) {
      const parts = [
        convalidacion.familia,
        convalidacion.ciclo,
        convalidacion.modulo
      ]
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      return parts.length ? parts.join(' · ') : 'Sin descripción';
    }
    return convalidacion.modulo.trim() || 'Sin descripción';
  }

  protected getGradoChipLabel(grado: string): string {
    const key = this.getGradoChipKey(grado);
    if (key === 'gb') return 'GB';
    if (key === 'gm') return 'GM';
    if (key === 'gs') return 'GS';
    if (key === 'ce') return 'CE';
    return '—';
  }

  private getGradoChipKey(grado: string): 'gb' | 'gm' | 'gs' | 'ce' | 'other' {
    const normalized = this.normalizeChipValue(grado);
    if (!normalized) return 'other';
    if (normalized === 'gb' || normalized.includes('basico') || normalized.includes('basica')) {
      return 'gb';
    }
    if (normalized === 'gm' || normalized.includes('medio') || normalized.includes('media')) {
      return 'gm';
    }
    if (normalized === 'gs' || normalized.includes('superior')) {
      return 'gs';
    }
    if (
      normalized === 'ce' ||
      normalized.includes('especializacion') ||
      normalized.includes('especialista')
    ) {
      return 'ce';
    }
    return 'other';
  }

  private normalizeChipValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private applyValidation(ids: string[]): void {
    const selectedIds = new Set(ids);
    this.submissionsSignal.update((items) =>
      items.map((item) =>
        selectedIds.has(item.id) ? { ...item, estado: 'Aprobado' } : item
      )
    );
    this.selectedPendientes.update((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    this.normalizePages();
  }

  private buildDocumentViewerTitle(
    docLabel: string,
    item: FormularioSubmission | null
  ): string {
    const label = docLabel.trim() || 'Documento';
    if (!item) return label;
    const nif = item.personal.nif.trim();
    const fullName = `${item.personal.nombre} ${item.personal.apellidos}`.trim();
    return [label, nif, fullName].filter((part) => part.length > 0).join(' • ') || label;
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

const MOCK_DOCUMENT_PATH = 'docs/dni.pdf';
const MOCK_ESTUDIO_DOCUMENT_PATH = 'docs/estudio_aportado.pdf';

const MOCK_SUBMISSIONS: FormularioSubmission[] = [
  {
    id: 'mock-laura',
    createdAt: '2026-02-06T09:10:00.000Z',
    fechaSolicitud: '2026-02-06T09:10:00.000Z',
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
    a_convalidar: [
      {
        tipo: 'LOE',
        grado: 'Grado Medio',
        familia: 'Administración y Gestión',
        ciclo: 'Gestión Administrativa',
        modulo: 'Comunicación empresarial',
        codigo: '0001'
      }
    ],
    documentos: {
      dni: MOCK_DOCUMENT_PATH,
      cert: MOCK_ESTUDIO_DOCUMENT_PATH,
      acred: null,
      justif: null
    }
  },
  {
    id: 'mock-pablo',
    createdAt: '2026-02-01T12:20:00.000Z',
    fechaSolicitud: '2026-02-01T12:20:00.000Z',
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
    a_convalidar: [
      {
        tipo: 'LOGSE',
        grado: 'Grado Superior',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Desarrollo de Aplicaciones Web',
        modulo: 'Entornos de desarrollo',
        codigo: ''
      },
      {
        tipo: 'LOGSE',
        grado: 'Grado Superior',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Desarrollo de Aplicaciones Web',
        modulo: 'Bases de datos',
        codigo: ''
      }
    ],
    documentos: {
      dni: MOCK_DOCUMENT_PATH,
      cert: null,
      acred: MOCK_ESTUDIO_DOCUMENT_PATH,
      justif: null
    }
  },
  {
    id: 'mock-lucia',
    createdAt: '2026-02-05T10:45:00.000Z',
    fechaSolicitud: '2026-02-05T10:45:00.000Z',
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
    estudios: [
      {
        tipo: 'LOE',
        grado: 'Grado Básico',
        familia: 'Servicios Socioculturales y a la Comunidad',
        ciclo: 'Atención a Personas en Situación de Dependencia',
        modulo: 'Todos',
        descripcion: ''
      }
    ],
    a_convalidar: [
      {
        tipo: 'LOE',
        grado: 'Grado Básico',
        familia: 'Servicios Socioculturales y a la Comunidad',
        ciclo: 'Atención a Personas en Situación de Dependencia',
        modulo: 'Características y necesidades de las personas en situación de dependencia',
        codigo: '0023'
      }
    ],
    documentos: {
      dni: MOCK_DOCUMENT_PATH,
      cert: null,
      acred: null,
      justif: MOCK_ESTUDIO_DOCUMENT_PATH
    }
  },
  {
    id: 'mock-samuel',
    createdAt: '2026-02-03T16:05:00.000Z',
    fechaSolicitud: '2026-02-03T16:05:00.000Z',
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
    estudios: [
      {
        tipo: 'LOGSE',
        grado: 'Grado Medio',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Sistemas Microinformáticos y Redes',
        modulo: 'Todos',
        descripcion: ''
      },
      {
        tipo: 'Universitarios',
        grado: '',
        familia: '',
        ciclo: '',
        modulo: '',
        descripcion: 'Grado en Ingeniería Informática'
      }
    ],
    a_convalidar: [
      {
        tipo: 'LOGSE',
        grado: 'Grado Medio',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Sistemas Microinformáticos y Redes',
        modulo: 'Montaje y mantenimiento de equipos',
        codigo: ''
      },
      {
        tipo: 'LOGSE',
        grado: 'Grado Medio',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Sistemas Microinformáticos y Redes',
        modulo: 'Redes locales',
        codigo: ''
      },
      {
        tipo: 'LOGSE',
        grado: 'Grado Medio',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Sistemas Microinformáticos y Redes',
        modulo: 'Sistemas operativos en red',
        codigo: ''
      }
    ],
    documentos: {
      dni: MOCK_DOCUMENT_PATH,
      cert: MOCK_ESTUDIO_DOCUMENT_PATH,
      acred: null,
      justif: null
    }
  },
  {
    id: 'mock-irene',
    createdAt: '2026-01-30T09:35:00.000Z',
    fechaSolicitud: '2026-01-30T09:35:00.000Z',
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
    estudios: [
      {
        tipo: 'LOE',
        grado: 'Curso de Especialización',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Ciberseguridad en Entornos de las Tecnologías de la Información',
        modulo: 'Todos',
        descripcion: ''
      }
    ],
    a_convalidar: [
      {
        tipo: 'LOE',
        grado: 'Curso de Especialización',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Ciberseguridad en Entornos de las Tecnologías de la Información',
        modulo: 'Análisis forense informático',
        codigo: '5071'
      },
      {
        tipo: 'LOE',
        grado: 'Curso de Especialización',
        familia: 'Informática y Comunicaciones',
        ciclo: 'Ciberseguridad en Entornos de las Tecnologías de la Información',
        modulo: 'Bastionado de redes y sistemas',
        codigo: '5072'
      }
    ],
    documentos: {
      dni: MOCK_DOCUMENT_PATH,
      cert: null,
      acred: MOCK_ESTUDIO_DOCUMENT_PATH,
      justif: null
    }
  }
];
