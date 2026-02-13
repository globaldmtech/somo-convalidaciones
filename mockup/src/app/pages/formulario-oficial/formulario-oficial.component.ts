import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DbService } from '../../core/db.service';
import { CatalogRow, ConvalidacionRow } from '../../core/models';
import { DatosPersonalesComponent } from './datos-personales/datos-personales.component';
import { DocumentacionComponent } from './documentacion/documentacion.component';
import { EstudiosAportadosComponent } from './estudios-aportados/estudios-aportados.component';
import { SolicitudesComponent } from './solicitudes/solicitudes.component';
import {
  EstudioEntry,
  EstudiosTipo,
  FilterKey,
  ManualModuleEntry,
  ManualModuleDraft,
  DocumentoEntry,
  DocumentoTipo,
  PersonalFieldKey,
  PersonalValues,
  RequestedModule
} from './formulario-oficial.types';

@Component({
  selector: 'app-formulario-oficial',
  imports: [
    CommonModule,
    DatosPersonalesComponent,
    EstudiosAportadosComponent,
    SolicitudesComponent,
    DocumentacionComponent
  ],
  templateUrl: './formulario-oficial.component.html',
  host: { class: 'block' },
  styleUrl: './formulario-oficial.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioOficialComponent {
  private readonly db = inject(DbService);
  private readonly rowsSignal = signal<ConvalidacionRow[]>([]);
  private readonly catalogRowsSignal = signal<CatalogRow[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly confirmDialog = signal(false);
  protected readonly steps = [
    { id: 1, label: 'Datos personales' },
    { id: 2, label: 'Estudios aportados' },
    { id: 3, label: 'Módulos solicitados' },
    { id: 4, label: 'Documentación' }
  ] as const;
  protected readonly totalSteps = this.steps.length;
  protected readonly currentStep = signal(1);

  protected readonly formNif = signal('');
  protected readonly formNombre = signal('');
  protected readonly formApellidos = signal('');
  protected readonly formDomicilio = signal('');
  protected readonly formCodigoPostal = signal('');
  protected readonly formLocalidad = signal('');
  protected readonly formProvincia = signal('');
  protected readonly formTelefonoFijo = signal('');
  protected readonly formTelefonoMovil = signal('');
  protected readonly formEmail = signal('');
  protected readonly personalValues = computed<PersonalValues>(() => ({
    nif: this.formNif(),
    nombre: this.formNombre(),
    apellidos: this.formApellidos(),
    domicilio: this.formDomicilio(),
    codigoPostal: this.formCodigoPostal(),
    localidad: this.formLocalidad(),
    provincia: this.formProvincia(),
    telefonoFijo: this.formTelefonoFijo(),
    telefonoMovil: this.formTelefonoMovil(),
    email: this.formEmail()
  }));

  protected readonly draftEstudio = signal<EstudioEntry>({
    tipo: '',
    descripcion: '',
    grado: '',
    familia: '',
    ciclo: '',
    modulo: 'Todos'
  });

  protected readonly formEstudios = signal<EstudioEntry[]>([]);

  protected readonly manualModuleDraft = signal<ManualModuleDraft>({ nombre: '', codigo: '' });
  protected readonly manualModules = signal<ManualModuleEntry[]>([]);
  protected readonly selectedSuggestedModules = signal<string[]>([]);

  protected readonly docDniModeSingle = signal(true);
  protected readonly docDniFileSingle = signal<File | null>(null);
  protected readonly docDniFileFront = signal<File | null>(null);
  protected readonly docDniFileBack = signal<File | null>(null);
  protected readonly docDniFileName = computed(() => this.docDniFileSingle()?.name ?? '');
  protected readonly docDniFrontName = computed(() => this.docDniFileFront()?.name ?? '');
  protected readonly docDniBackName = computed(() => this.docDniFileBack()?.name ?? '');
  protected readonly docDniSingleAttached = computed(() => Boolean(this.docDniFileSingle()));
  protected readonly docDniFrontAttached = computed(() => Boolean(this.docDniFileFront()));
  protected readonly docDniBackAttached = computed(() => Boolean(this.docDniFileBack()));
  protected readonly docEntries = signal<DocumentoEntry[]>([]);

  protected readonly suggestedModules = computed(() => this.buildSuggestedModules());
  protected readonly requestedModules = computed(() => this.buildRequestedModules());
  protected readonly canAddEstudio = computed(() => this.isEstudioEntryComplete(this.draftEstudio()));
  protected readonly canAddManualModule = computed(() => this.isManualModuleDraftValid());
  protected readonly gradoOptions = computed(() => this.buildCatalogOptions('grado'));
  protected readonly familiaOptions = computed(() => this.getEstudioFamiliaOptions());
  protected readonly cicloOptions = computed(() => this.getEstudioCicloOptions());
  protected readonly moduloOptions = computed(() => this.getEstudioModuloOptions());
  protected readonly currentStepValid = computed(() => this.isStepValid(this.currentStep()));
  protected readonly stepProgress = computed(() => {
    if (this.totalSteps <= 1) return 0;
    return ((this.currentStep() - 1) / (this.totalSteps - 1)) * 100;
  });

  protected readonly isFormValid = computed(() => {
    return (
      this.isPersonalValid() &&
      this.isEstudiosValid() &&
      this.isModulosValid() &&
      this.isDocsValid()
    );
  });

  private manualModuleSequence = 0;
  private docEntrySequence = 0;

  constructor() {
    this.loadData();
  }

  protected onPersonalFieldChange(change: { key: PersonalFieldKey; value: string }): void {
    switch (change.key) {
      case 'nif':
        this.formNif.set(change.value);
        break;
      case 'nombre':
        this.formNombre.set(change.value);
        break;
      case 'apellidos':
        this.formApellidos.set(change.value);
        break;
      case 'domicilio':
        this.formDomicilio.set(change.value);
        break;
      case 'codigoPostal':
        this.formCodigoPostal.set(change.value);
        break;
      case 'localidad':
        this.formLocalidad.set(change.value);
        break;
      case 'provincia':
        this.formProvincia.set(change.value);
        break;
      case 'telefonoFijo':
        this.formTelefonoFijo.set(change.value);
        break;
      case 'telefonoMovil':
        this.formTelefonoMovil.set(change.value);
        break;
      case 'email':
        this.formEmail.set(change.value);
        break;
    }
  }

  protected previousStep(): void {
    if (this.currentStep() <= 1) return;
    this.currentStep.update((step) => Math.max(1, step - 1));
  }

  protected nextStep(): void {
    if (this.currentStep() >= this.totalSteps || !this.isStepValid(this.currentStep())) return;
    this.currentStep.update((step) => Math.min(this.totalSteps, step + 1));
  }

  protected isStepComplete(step: number): boolean {
    return step < this.currentStep() && this.isStepValid(step);
  }

  protected isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.isPersonalValid();
      case 2:
        return this.isEstudiosValid();
      case 3:
        return this.isModulosValid();
      case 4:
        return this.isDocsValid();
      default:
        return false;
    }
  }

  protected addEstudioRow(): void {
    const entry = this.draftEstudio();
    if (!this.isEstudioEntryComplete(entry)) return;
    this.formEstudios.update((rows) => [...rows, { ...entry }]);
    this.resetDraftEstudio(entry.tipo);
  }

  protected removeEstudioRow(index: number): void {
    this.formEstudios.update((rows) => rows.filter((_, current) => current !== index));
    this.docEntries.update((entries) =>
      entries
        .map((entry) => {
          const normalized = entry.estudioIndices
            .filter((value) => value !== index)
            .map((value) => (value > index ? value - 1 : value));
          return { ...entry, estudioIndices: normalized };
        })
        .filter((entry) => entry.estudioIndices.length > 0)
    );
  }

  protected updateEstudioField(key: keyof EstudioEntry, value: string): void {
    this.draftEstudio.update((row) => ({ ...row, [key]: value }));
  }

  protected onTipoChange(value: EstudiosTipo): void {
    this.resetDraftEstudio(value);
  }

  protected onEstudioSelectChange(key: FilterKey, value: string): void {
    this.draftEstudio.update((row) => {
      if (key === 'grado') {
        return { ...row, grado: value, familia: '', ciclo: '', modulo: 'Todos' };
      }
      if (key === 'familia') {
        return { ...row, familia: value, ciclo: '', modulo: 'Todos' };
      }
      if (key === 'ciclo') {
        return { ...row, ciclo: value, modulo: 'Todos' };
      }
      return { ...row, modulo: value };
    });
  }

  protected addManualModule(): void {
    if (!this.isManualModuleDraftValid()) return;
    const draft = this.manualModuleDraft();
    const entry: ManualModuleEntry = {
      id: this.nextManualModuleId(),
      nombre: draft.nombre.trim(),
      codigo: draft.codigo.trim()
    };
    this.manualModules.update((rows) => [...rows, entry]);
    this.manualModuleDraft.set({ nombre: '', codigo: '' });
  }

  protected updateManualModuleDraft(key: keyof ManualModuleDraft, value: string): void {
    this.manualModuleDraft.update((draft) => ({ ...draft, [key]: value }));
  }

  protected toggleSuggestedModule(value: string, checked: boolean): void {
    this.selectedSuggestedModules.update((items) => {
      if (checked) {
        return items.includes(value) ? items : [...items, value];
      }
      return items.filter((item) => item !== value);
    });
  }

  protected removeRequestedModule(item: RequestedModule): void {
    if (item.source === 'suggested') {
      this.selectedSuggestedModules.update((items) => items.filter((entry) => entry !== item.nombre));
      return;
    }
    this.manualModules.update((rows) => rows.filter((row) => row.id !== item.id));
  }

  protected onDniModeChange(single: boolean): void {
    this.docDniModeSingle.set(single);
    if (single) {
      this.docDniFileFront.set(null);
      this.docDniFileBack.set(null);
    } else {
      this.docDniFileSingle.set(null);
    }
  }

  protected onDniSingleChange(file: File | null): void {
    this.docDniFileSingle.set(file);
  }

  protected onDniFrontChange(file: File | null): void {
    this.docDniFileFront.set(file);
  }

  protected onDniBackChange(file: File | null): void {
    this.docDniFileBack.set(file);
  }

  protected addDocEntryForStudy(
    studyIndex: number,
    file: File | null,
    tipo: DocumentoTipo
  ): void {
    if (!file) return;
    const entry: DocumentoEntry = {
      id: this.nextDocEntryId(),
      tipo,
      estudioIndices: [studyIndex],
      fileName: file.name,
      file
    };
    this.docEntries.update((entries) => [...entries, entry]);
  }

  protected removeDocEntry(id: string): void {
    this.docEntries.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  protected updateDocEntryType(id: string, value: DocumentoTipo): void {
    this.docEntries.update((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, tipo: value } : entry))
    );
  }

  protected toggleDocEntryStudy(id: string, studyIndex: number, checked: boolean): void {
    this.docEntries.update((entries) =>
      entries
        .map((entry) => {
          if (entry.id !== id) return entry;
          const next = new Set(entry.estudioIndices);
          if (checked) {
            next.add(studyIndex);
          } else {
            next.delete(studyIndex);
          }
          return { ...entry, estudioIndices: Array.from(next).sort((a, b) => a - b) };
        })
        .filter((entry) => entry.estudioIndices.length > 0)
    );
  }

  protected submitForm(): void {
    if (!this.isFormValid()) return;
    this.submitted.set(true);
  }

  protected requestSubmit(): void {
    if (!this.isFormValid()) return;
    this.confirmDialog.set(true);
  }

  protected cancelSubmit(): void {
    this.confirmDialog.set(false);
  }

  protected confirmSubmit(): void {
    if (!this.isFormValid()) return;
    this.submitForm();
    this.confirmDialog.set(false);
  }

  protected isCatalogTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  private isPersonalValid(): boolean {
    return [
      this.formNif(),
      this.formNombre(),
      this.formApellidos(),
      this.formDomicilio(),
      this.formCodigoPostal(),
      this.formLocalidad(),
      this.formProvincia(),
      this.formTelefonoMovil(),
      this.formEmail()
    ].every((value) => value.trim().length > 0);
  }

  private isEstudiosValid(): boolean {
    const estudios = this.formEstudios();
    return estudios.length > 0 && estudios.every((entry) => this.isEstudioEntryComplete(entry));
  }

  private isModulosValid(): boolean {
    const manualOk = this.manualModules().every((row) => row.nombre.trim().length > 0);
    return this.selectedSuggestedModules().length + this.manualModules().length > 0 && manualOk;
  }

  private isDocsValid(): boolean {
    const hasDni = this.docDniModeSingle()
      ? Boolean(this.docDniFileSingle())
      : Boolean(this.docDniFileFront()) && Boolean(this.docDniFileBack());
    if (!hasDni) return false;
    const entries = this.docEntries();
    if (!entries.length) return false;
    if (entries.some((entry) => !entry.tipo || !entry.fileName || entry.estudioIndices.length === 0)) {
      return false;
    }
    const totalStudies = this.formEstudios().length;
    if (!totalStudies) return false;
    const covered = new Set<number>();
    entries.forEach((entry) => entry.estudioIndices.forEach((index) => covered.add(index)));
    return covered.size >= totalStudies;
  }

  protected getEstudioFamiliaOptions(): string[] {
    const entry = this.draftEstudio();
    if (!entry.grado) return [];
    return this.buildFormCatalogOptions('familia', {
      grado: entry.grado,
      familia: entry.familia,
      ciclo: entry.ciclo
    });
  }

  protected getEstudioCicloOptions(): string[] {
    const entry = this.draftEstudio();
    if (!entry.grado || !entry.familia) return [];
    return this.buildFormCatalogOptions('ciclo', {
      grado: entry.grado,
      familia: entry.familia,
      ciclo: entry.ciclo
    });
  }

  protected getEstudioModuloOptions(): string[] {
    const entry = this.draftEstudio();
    if (!entry.ciclo) return [];
    return this.buildFormModuleOptions({
      grado: entry.grado,
      familia: entry.familia,
      ciclo: entry.ciclo,
      modulo: entry.modulo
    });
  }

  protected buildCatalogOptions(key: 'grado' | 'familia' | 'ciclo'): string[] {
    const rows = this.catalogRowsSignal();
    const values = new Set<string>();
    rows.forEach((row) => values.add(row[key]));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildFormCatalogOptions(
    key: 'familia' | 'ciclo',
    filters: { grado: string; familia: string; ciclo: string }
  ): string[] {
    const rows = this.catalogRowsSignal().filter((row) => {
      if (filters.grado && row.grado !== filters.grado) return false;
      if (key === 'ciclo' && filters.familia && row.familia !== filters.familia) return false;
      if (key === 'familia' && filters.grado && row.grado !== filters.grado) return false;
      return true;
    });
    const values = new Set<string>();
    rows.forEach((row) => values.add(row[key]));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildFormModuleOptions(filters: Record<FilterKey, string>): string[] {
    const rows = this.catalogRowsSignal().filter((row) => {
      if (filters.grado && row.grado !== filters.grado) return false;
      if (filters.familia && row.familia !== filters.familia) return false;
      if (filters.ciclo && row.ciclo !== filters.ciclo) return false;
      return true;
    });
    const values = new Set<string>();
    rows.forEach((row) => values.add(row.modulo));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildRequestedModules(): RequestedModule[] {
    const suggested = this.selectedSuggestedModules().map((value) => ({
      id: `suggested:${value}`,
      source: 'suggested' as const,
      nombre: value
    }));
    const manual = this.manualModules().map((entry) => ({
      id: entry.id,
      source: 'manual' as const,
      nombre: entry.nombre,
      codigo: entry.codigo
    }));
    return [...suggested, ...manual];
  }

  private buildSuggestedModules(): string[] {
    const values = new Set<string>();
    const estudios = this.formEstudios();

    estudios.forEach((entry) => {
      const hasFilter = Boolean(entry.grado || entry.familia || entry.ciclo || entry.modulo);
      if (!hasFilter) return;
      const filters = {
        grado: entry.grado,
        familia: entry.familia,
        ciclo: entry.ciclo,
        modulo: entry.modulo
      };
      this.rowsSignal().forEach((row) => {
        if (!this.matchesSideFilters(row, 'origen', filters)) return;
        this.splitValues(row.modulo_destino).forEach((value) => values.add(value));
      });
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private matchesSideFilters(
    row: ConvalidacionRow,
    side: 'origen' | 'destino',
    filters: Record<FilterKey, string>
  ): boolean {
    return (['grado', 'familia', 'ciclo', 'modulo'] as FilterKey[]).every((key) => {
      const value = filters[key];
      if (!value) return true;
      if (key === 'modulo' && value === 'Todos') return true;
      const current = row[`${key}_${side}` as keyof ConvalidacionRow] as string | null;
      return this.listIncludes(current, value);
    });
  }

  private splitValues(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private normalizeKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private listIncludes(listValue: string | null, target: string): boolean {
    if (!target) return true;
    const normalizedTarget = this.normalizeKey(target);
    return this.splitValues(listValue).some(
      (entry) => this.normalizeKey(entry) === normalizedTarget
    );
  }

  private async loadData(): Promise<void> {
    try {
      this.loading.set(true);
      const [catalog, convalidaciones] = await Promise.all([
        this.db.getCatalog(),
        this.db.getConvalidaciones()
      ]);
      this.catalogRowsSignal.set(catalog);
      this.rowsSignal.set(convalidaciones);
    } catch (error) {
      console.error(error);
      this.error.set('No se pudo cargar la base de datos.');
    } finally {
      this.loading.set(false);
    }
  }

  private resetDraftEstudio(tipo: EstudiosTipo): void {
    if (!this.isCatalogTipo(tipo)) {
      this.draftEstudio.set({
        tipo,
        descripcion: '',
        grado: '',
        familia: '',
        ciclo: '',
        modulo: ''
      });
      return;
    }
    this.draftEstudio.set({
      tipo,
      descripcion: '',
      grado: '',
      familia: '',
      ciclo: '',
      modulo: 'Todos'
    });
  }

  private isManualModuleDraftValid(): boolean {
    const draft = this.manualModuleDraft();
    return draft.nombre.trim().length > 0;
  }

  private nextManualModuleId(): string {
    this.manualModuleSequence += 1;
    return `manual-${this.manualModuleSequence}`;
  }

  private nextDocEntryId(): string {
    this.docEntrySequence += 1;
    return `doc-${this.docEntrySequence}`;
  }

  private isEstudioEntryComplete(entry: EstudioEntry): boolean {
    if (!entry.tipo) return false;
    if (this.isCatalogTipo(entry.tipo)) {
      return Boolean(entry.grado && entry.familia && entry.ciclo && entry.modulo);
    }
    return entry.descripcion.trim().length > 0;
  }

}
