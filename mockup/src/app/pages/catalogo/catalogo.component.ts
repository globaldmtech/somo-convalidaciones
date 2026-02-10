import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { DbService } from '../../core/db.service';
import { CatalogRow, ConvalidacionRow } from '../../core/models';

type CatalogSide = {
  grado: string;
  familia: string;
  ciclo: string;
  modulo: string;
  rd: string;
};

type CatalogField = 'grado' | 'familia' | 'ciclo' | 'modulo';

type CatalogEntry = {
  id: string;
  origen: CatalogSide;
  destino: CatalogSide;
  page: number | null;
};

type DialogMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-catalogo',
  imports: [CommonModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css'
})
export class CatalogoComponent {
  private readonly entriesSignal = signal<CatalogEntry[]>([]);
  private readonly catalogRows = signal<CatalogRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly searchText = signal('');
  protected readonly filterGrado = signal('');
  protected readonly filterFamilia = signal('');
  protected readonly filterCiclo = signal('');
  protected readonly filterModulo = signal('');

  protected readonly pageSize = signal(5);
  protected readonly page = signal(1);

  protected readonly entries = computed(() => this.entriesSignal());
  protected readonly filtered = computed(() => this.applyFilters());
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize()))
  );
  protected readonly pagedEntries = computed(() =>
    this.slicePage(this.filtered(), this.page(), this.pageSize())
  );
  protected readonly pageOffset = computed(() => (this.page() - 1) * this.pageSize());

  protected readonly filterGradoOptions = computed(() => this.buildFilterOptions('grado'));
  protected readonly filterFamiliaOptions = computed(() => this.buildFilterOptions('familia'));
  protected readonly filterCicloOptions = computed(() => this.buildFilterOptions('ciclo'));
  protected readonly filterModuloOptions = computed(() => this.buildFilterOptions('modulo'));
  protected readonly hasFilters = computed(() =>
    Boolean(
      this.searchText().trim() ||
        this.filterGrado() ||
        this.filterFamilia() ||
        this.filterCiclo() ||
        this.filterModulo()
    )
  );

  protected readonly dialogMode = signal<DialogMode>(null);
  protected readonly draft = signal<CatalogEntry>(this.createEmptyDraft());
  protected readonly editMode = signal(false);
  protected readonly deleteDialog = signal<CatalogEntry | null>(null);
  protected readonly isDraftComplete = computed(() => {
    const draft = this.draft();
    const required = [
      draft.origen.grado,
      draft.origen.familia,
      draft.origen.ciclo,
      draft.origen.modulo,
      draft.destino.grado,
      draft.destino.familia,
      draft.destino.ciclo,
      draft.destino.modulo
    ];
    return required.every((value) => value.trim().length > 0);
  });
  constructor(private readonly db: DbService) {
    void this.loadData();
  }

  protected trackById(_: number, item: CatalogEntry): string {
    return item.id;
  }

  protected origenOptions(field: CatalogField): string[] {
    return this.buildSideOptions('origen', field);
  }

  protected destinoOptions(field: CatalogField): string[] {
    return this.buildSideOptions('destino', field);
  }

  protected getPdfLink(page: number | null): string {
    const safePage = page && page > 0 ? page : 1;
    return `/docs/BOE-A-2020-17274.pdf#page=${safePage}`;
  }

  protected displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '—';
    return value.trim() ? value : '—';
  }

  protected onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchText.set(target?.value ?? '');
    this.resetPage();
  }

  protected onSelectChange(
    field: 'grado' | 'familia' | 'ciclo' | 'modulo',
    event: Event
  ): void {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value ?? '';
    if (field === 'grado') {
      this.filterGrado.set(value);
      this.filterFamilia.set('');
      this.filterCiclo.set('');
      this.filterModulo.set('');
    }
    if (field === 'familia') {
      this.filterFamilia.set(value);
      this.filterCiclo.set('');
      this.filterModulo.set('');
    }
    if (field === 'ciclo') {
      this.filterCiclo.set(value);
      this.filterModulo.set('');
    }
    if (field === 'modulo') this.filterModulo.set(value);
    this.resetPage();
  }

  protected onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const value = Number.parseInt(target?.value ?? '5', 10);
    this.pageSize.set(Number.isNaN(value) ? 5 : value);
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.filterGrado.set('');
    this.filterFamilia.set('');
    this.filterCiclo.set('');
    this.filterModulo.set('');
    this.resetPage();
  }

  protected goPrev(): void {
    this.page.update((current) => Math.max(1, current - 1));
  }

  protected goNext(): void {
    this.page.update((current) => Math.min(this.totalPages(), current + 1));
  }

  protected openCreate(): void {
    this.dialogMode.set('create');
    this.draft.set(this.createEmptyDraft());
  }

  protected openEdit(entry: CatalogEntry): void {
    if (!this.editMode()) return;
    this.dialogMode.set('edit');
    this.draft.set(this.cloneEntry(entry));
  }

  protected closeDialog(): void {
    this.dialogMode.set(null);
  }

  protected saveDraft(): void {
    const mode = this.dialogMode();
    if (!mode) return;
    if (!this.isDraftComplete()) return;

    const draft = this.normalizeEntry(this.draft());
    if (mode === 'edit' && draft.id) {
      this.entriesSignal.update((items) =>
        items.map((item) => (item.id === draft.id ? draft : item))
      );
    } else {
      const entry = { ...draft, id: this.nextId() };
      this.entriesSignal.update((items) => [entry, ...items]);
    }

    this.dialogMode.set(null);
    this.resetPage();
  }

  protected deleteEntry(entry: CatalogEntry): void {
    if (!this.editMode()) return;
    this.entriesSignal.update((items) =>
      items.filter((item) => item.id !== entry.id)
    );
    this.resetPage();
  }

  protected requestDelete(entry: CatalogEntry): void {
    if (!this.editMode()) return;
    this.deleteDialog.set(entry);
  }

  protected cancelDelete(): void {
    this.deleteDialog.set(null);
  }

  protected confirmDelete(): void {
    const entry = this.deleteDialog();
    if (!entry) return;
    this.deleteEntry(entry);
    this.deleteDialog.set(null);
  }

  protected toggleEditMode(): void {
    this.editMode.update((value) => !value);
  }

  protected updateDraft(
    side: 'origen' | 'destino',
    field: CatalogField,
    event: Event
  ): void {
    const value = this.readValue(event);
    this.draft.update((current) => {
      const updatedSide: CatalogSide = {
        ...current[side],
        [field]: value
      };
      if (field === 'grado') {
        updatedSide.familia = '';
        updatedSide.ciclo = '';
        updatedSide.modulo = '';
      } else if (field === 'familia') {
        updatedSide.ciclo = '';
        updatedSide.modulo = '';
      } else if (field === 'ciclo') {
        updatedSide.modulo = '';
      }
      return { ...current, [side]: updatedSide };
    });
  }

  protected readValue(event: Event): string {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    return target?.value ?? '';
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [catalog, rows] = await Promise.all([
        this.db.getCatalog(),
        this.db.getConvalidaciones()
      ]);
      this.catalogRows.set(catalog);
      const entries = rows.map((row, index) => this.mapRow(row, index));
      this.entriesSignal.set(entries.length ? entries : MOCK_ENTRIES);
    } catch (error) {
      this.error.set('No se pudo cargar la base de datos. Mostrando datos de ejemplo.');
      this.entriesSignal.set(MOCK_ENTRIES);
    } finally {
      this.loading.set(false);
    }
  }

  private mapRow(row: ConvalidacionRow, index: number): CatalogEntry {
    const safe = (value: string | null) => value ?? '';
    return {
      id: `db-${index + 1}`,
      origen: {
        grado: safe(row.grado_origen),
        familia: safe(row.familia_origen),
        ciclo: safe(row.ciclo_origen),
        modulo: safe(row.modulo_origen),
        rd: safe(row.rd_origen)
      },
      destino: {
        grado: safe(row.grado_destino),
        familia: safe(row.familia_destino),
        ciclo: safe(row.ciclo_destino),
        modulo: safe(row.modulo_destino),
        rd: safe(row.rd_destino)
      },
      page: row.source_page ?? null
    };
  }

  private createEmptyDraft(): CatalogEntry {
    return {
      id: '',
      origen: {
        grado: '',
        familia: '',
        ciclo: '',
        modulo: '',
        rd: ''
      },
      destino: {
        grado: '',
        familia: '',
        ciclo: '',
        modulo: '',
        rd: ''
      },
      page: null
    };
  }

  private cloneEntry(entry: CatalogEntry): CatalogEntry {
    return {
      id: entry.id,
      origen: { ...entry.origen },
      destino: { ...entry.destino },
      page: entry.page
    };
  }

  private normalizeEntry(entry: CatalogEntry): CatalogEntry {
    const normalizeSide = (side: CatalogSide): CatalogSide => ({
      grado: side.grado.trim(),
      familia: side.familia.trim(),
      ciclo: side.ciclo.trim(),
      modulo: side.modulo.trim(),
      rd: side.rd.trim()
    });
    return {
      id: entry.id,
      origen: normalizeSide(entry.origen),
      destino: normalizeSide(entry.destino),
      page: entry.page
    };
  }

  private nextId(): string {
    return `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private applyFilters(): CatalogEntry[] {
    const search = this.searchText().trim().toLowerCase();
    const grado = this.filterGrado().trim().toLowerCase();
    const familia = this.filterFamilia().trim().toLowerCase();
    const ciclo = this.filterCiclo().trim().toLowerCase();
    const modulo = this.filterModulo().trim().toLowerCase();

    return this.entries().filter((entry) => {
      if (search && !this.matchesSearch(entry, search)) return false;
      if (grado && !this.matchesField(entry, 'grado', grado)) return false;
      if (familia && !this.matchesField(entry, 'familia', familia)) return false;
      if (ciclo && !this.matchesField(entry, 'ciclo', ciclo)) return false;
      if (modulo && !this.matchesField(entry, 'modulo', modulo)) return false;
      return true;
    });
  }

  private matchesSearch(entry: CatalogEntry, search: string): boolean {
    const values = [
      entry.origen.grado,
      entry.origen.familia,
      entry.origen.ciclo,
      entry.origen.modulo,
      entry.destino.grado,
      entry.destino.familia,
      entry.destino.ciclo,
      entry.destino.modulo
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return values.includes(search);
  }

  private matchesField(
    entry: CatalogEntry,
    field: keyof CatalogSide,
    value: string
  ): boolean {
    const candidates = [entry.origen[field], entry.destino[field]]
      .filter(Boolean)
      .map((item) => item.toLowerCase());
    return candidates.some((item) => item.includes(value));
  }

  private buildFilterOptions(field: CatalogField): string[] {
    const rows = this.catalogRows();
    const grado = this.filterGrado();
    const familia = this.filterFamilia();
    const ciclo = this.filterCiclo();

    const filtered = rows.filter((row) => {
      if (field === 'grado') return true;
      if (field === 'familia') return !grado || row.grado === grado;
      if (field === 'ciclo') {
        if (grado && row.grado !== grado) return false;
        if (familia && row.familia !== familia) return false;
        return true;
      }
      if (field === 'modulo') {
        if (grado && row.grado !== grado) return false;
        if (familia && row.familia !== familia) return false;
        if (ciclo && row.ciclo !== ciclo) return false;
        return true;
      }
      return true;
    });

    const values = new Set<string>();
    filtered.forEach((row) => values.add(row[field]));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildSideOptions(side: 'origen' | 'destino', field: CatalogField): string[] {
    const entry = this.draft()[side];
    if (field === 'grado') {
      const options = this.buildCatalogOptions('grado');
      return this.withCurrentOption(field, options, entry.grado);
    }
    if (field === 'familia') {
      if (!entry.grado) return [];
      const options = this.buildSideCatalogOptions('familia', {
        grado: entry.grado,
        familia: entry.familia,
        ciclo: entry.ciclo
      });
      return this.withCurrentOption(field, options, entry.familia);
    }
    if (field === 'ciclo') {
      if (!entry.grado || !entry.familia) return [];
      const options = this.buildSideCatalogOptions('ciclo', {
        grado: entry.grado,
        familia: entry.familia,
        ciclo: entry.ciclo
      });
      return this.withCurrentOption(field, options, entry.ciclo);
    }
    if (field === 'modulo') {
      if (!entry.ciclo) return [];
      const options = this.buildSideModuleOptions({
        grado: entry.grado,
        familia: entry.familia,
        ciclo: entry.ciclo,
        modulo: entry.modulo
      });
      return this.withCurrentOption(field, options, entry.modulo);
    }
    return [];
  }

  private buildCatalogOptions(key: 'grado' | 'familia' | 'ciclo'): string[] {
    const values = new Set<string>();
    this.catalogRows().forEach((row) => values.add(row[key]));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildSideCatalogOptions(
    key: 'familia' | 'ciclo',
    filters: { grado: string; familia: string; ciclo: string }
  ): string[] {
    const rows = this.catalogRows().filter((row) => {
      if (filters.grado && row.grado !== filters.grado) return false;
      if (key === 'ciclo' && filters.familia && row.familia !== filters.familia) return false;
      if (key === 'familia' && filters.grado && row.grado !== filters.grado) return false;
      return true;
    });
    const values = new Set<string>();
    rows.forEach((row) => values.add(row[key]));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildSideModuleOptions(filters: Record<CatalogField, string>): string[] {
    const rows = this.catalogRows().filter((row) => {
      if (filters.grado && row.grado !== filters.grado) return false;
      if (filters.familia && row.familia !== filters.familia) return false;
      if (filters.ciclo && row.ciclo !== filters.ciclo) return false;
      return true;
    });
    const values = new Set<string>();
    rows.forEach((row) => values.add(row.modulo));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private withCurrentOption(
    field: CatalogField,
    options: string[],
    currentValue: string
  ): string[] {
    if (this.dialogMode() !== 'edit') return options;
    const rawValue = currentValue ?? '';
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) return options;
    if (field === 'modulo' && trimmedValue === 'Todos') return options;
    const exists = options.some((option) => option === rawValue);
    if (exists) return options;
    return [rawValue, ...options];
  }

  private slicePage<T>(items: T[], page: number, size: number): T[] {
    const safeSize = Math.max(1, size);
    const maxPage = Math.max(1, Math.ceil(items.length / safeSize));
    const safePage = Math.min(Math.max(1, page), maxPage);
    const start = (safePage - 1) * safeSize;
    return items.slice(start, start + safeSize);
  }

  private resetPage(): void {
    this.page.set(1);
  }
}

const MOCK_ENTRIES: CatalogEntry[] = [
  {
    id: 'mock-1',
    origen: {
      grado: 'Grado Medio',
      familia: 'Administración y Gestión',
      ciclo: 'Gestión Administrativa',
      modulo: 'Comunicación empresarial',
      rd: 'RD 1631/2009'
    },
    destino: {
      grado: 'Grado Superior',
      familia: 'Administración y Gestión',
      ciclo: 'Administración y Finanzas',
      modulo: 'Gestión de la documentación jurídica y empresarial',
      rd: 'RD 1584/2011'
    },
    page: 42
  },
  {
    id: 'mock-2',
    origen: {
      grado: 'Grado Superior',
      familia: 'Informática y Comunicaciones',
      ciclo: 'Desarrollo de Aplicaciones Web',
      modulo: 'Entornos de desarrollo',
      rd: 'RD 686/2010'
    },
    destino: {
      grado: 'Grado Superior',
      familia: 'Informática y Comunicaciones',
      ciclo: 'Desarrollo de Aplicaciones Multiplataforma',
      modulo: 'Programación de servicios y procesos',
      rd: 'RD 450/2010'
    },
    page: 128
  },
  {
    id: 'mock-3',
    origen: {
      grado: 'Grado Medio',
      familia: 'Servicios Socioculturales y a la Comunidad',
      ciclo: 'Atención a Personas en Situación de Dependencia',
      modulo: 'Características y necesidades de las personas en situación de dependencia',
      rd: 'RD 1147/2011'
    },
    destino: {
      grado: 'Grado Superior',
      familia: 'Servicios Socioculturales y a la Comunidad',
      ciclo: 'Integración Social',
      modulo: 'Contexto de la intervención social',
      rd: 'RD 1074/2012'
    },
    page: 76
  }
];
