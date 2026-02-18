import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DbService } from '../../core/db.service';
import { CatalogRow, ConvalidacionRow } from '../../core/models';
import { DatosPersonalesComponent } from './datos-personales/datos-personales.component';
import { DocumentacionComponent } from './documentacion/documentacion.component';
import { EstudiosAportadosComponent } from './estudios-aportados/estudios-aportados.component';
import { FormularioOficialDraftService } from './formulario-oficial-draft.service';
import { SolicitudesComponent } from './solicitudes/solicitudes.component';
import {
  FormularioDraftSnapshot,
  EstudioEntry,
  EstudiosTipo,
  FilterKey,
  ManualModuleEntry,
  ManualModuleDraft,
  DocumentoEntry,
  PersonalFieldKey,
  PersonalValues,
  RequestedModule,
  SuggestedModuleOption
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
export class FormularioOficialComponent implements OnDestroy {
  private readonly db = inject(DbService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly draftService = inject(FormularioOficialDraftService);
  private readonly rowsSignal = signal<ConvalidacionRow[]>([]);
  private readonly catalogRowsSignal = signal<CatalogRow[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly fechaSolicitud = signal<string | null>(null);
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
    this.restoreDraftSnapshot();
    this.applyStepFromQueryParam();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.saveDraftSnapshot();
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
    this.pruneSelectedSuggestedModules();
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
      const suggestedId = item.id.startsWith('suggested:') ? item.id.slice(10) : item.id;
      this.selectedSuggestedModules.update((items) => items.filter((entry) => entry !== suggestedId));
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

  protected addDocEntry(change: { file: File | null; titulo: string }): void {
    const file = change.file;
    const titulo = change.titulo.trim();
    if (!file || !titulo) return;
    const entry: DocumentoEntry = {
      id: this.nextDocEntryId(),
      titulo,
      fileName: file.name,
      file
    };
    this.docEntries.update((entries) => [...entries, entry]);
  }

  protected removeDocEntry(id: string): void {
    this.docEntries.update((entries) => entries.filter((entry) => entry.id !== id));
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
    this.confirmDialog.set(false);
    this.saveDraftSnapshot();
    void this.router.navigate(['/formulario-oficial/verificacion']);
  }

  protected isCatalogTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  protected formatFechaSolicitud(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private applyStepFromQueryParam(): void {
    const stepParam = this.route.snapshot.queryParamMap.get('step');
    if (!stepParam) return;
    const parsed = Number(stepParam);
    if (!Number.isInteger(parsed)) return;
    const bounded = Math.min(this.totalSteps, Math.max(1, parsed));
    this.currentStep.set(bounded);
  }

  private saveDraftSnapshot(): void {
    const snapshot: FormularioDraftSnapshot = {
      currentStep: this.currentStep(),
      personalValues: { ...this.personalValues() },
      draftEstudio: { ...this.draftEstudio() },
      formEstudios: this.formEstudios().map((entry) => ({ ...entry })),
      manualModuleDraft: { ...this.manualModuleDraft() },
      manualModules: this.manualModules().map((entry) => ({ ...entry })),
      selectedSuggestedModules: [...this.selectedSuggestedModules()],
      requestedModules: this.requestedModules().map((entry) => ({ ...entry })),
      docDniModeSingle: this.docDniModeSingle(),
      docDniFileSingle: this.docDniFileSingle(),
      docDniFileFront: this.docDniFileFront(),
      docDniFileBack: this.docDniFileBack(),
      docEntries: this.docEntries().map((entry) => ({ ...entry })),
      submitted: this.submitted(),
      fechaSolicitud: this.fechaSolicitud()
    };
    this.draftService.saveSnapshot(snapshot);
  }

  private restoreDraftSnapshot(): void {
    const snapshot = this.draftService.getSnapshot();
    if (!snapshot) return;

    this.currentStep.set(Math.min(this.totalSteps, Math.max(1, snapshot.currentStep || 1)));
    this.formNif.set(snapshot.personalValues.nif ?? '');
    this.formNombre.set(snapshot.personalValues.nombre ?? '');
    this.formApellidos.set(snapshot.personalValues.apellidos ?? '');
    this.formDomicilio.set(snapshot.personalValues.domicilio ?? '');
    this.formCodigoPostal.set(snapshot.personalValues.codigoPostal ?? '');
    this.formLocalidad.set(snapshot.personalValues.localidad ?? '');
    this.formProvincia.set(snapshot.personalValues.provincia ?? '');
    this.formTelefonoFijo.set(snapshot.personalValues.telefonoFijo ?? '');
    this.formTelefonoMovil.set(snapshot.personalValues.telefonoMovil ?? '');
    this.formEmail.set(snapshot.personalValues.email ?? '');

    this.draftEstudio.set({ ...snapshot.draftEstudio });
    this.formEstudios.set(snapshot.formEstudios.map((entry) => ({ ...entry })));
    this.manualModuleDraft.set({ ...snapshot.manualModuleDraft });
    this.manualModules.set(snapshot.manualModules.map((entry) => ({ ...entry })));
    this.selectedSuggestedModules.set([...snapshot.selectedSuggestedModules]);

    this.docDniModeSingle.set(snapshot.docDniModeSingle);
    this.docDniFileSingle.set(snapshot.docDniFileSingle);
    this.docDniFileFront.set(snapshot.docDniFileFront);
    this.docDniFileBack.set(snapshot.docDniFileBack);
    this.docEntries.set(snapshot.docEntries.map((entry) => ({ ...entry })));

    this.submitted.set(snapshot.submitted);
    this.fechaSolicitud.set(snapshot.fechaSolicitud);
    this.confirmDialog.set(false);

    this.manualModuleSequence = this.getMaxSequence(snapshot.manualModules.map((entry) => entry.id), 'manual-');
    this.docEntrySequence = this.getMaxSequence(snapshot.docEntries.map((entry) => entry.id), 'doc-');
  }

  private getMaxSequence(ids: string[], prefix: string): number {
    let max = 0;
    ids.forEach((id) => {
      if (!id.startsWith(prefix)) return;
      const parsed = Number(id.slice(prefix.length));
      if (Number.isInteger(parsed) && parsed > max) {
        max = parsed;
      }
    });
    return max;
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
    const suggestedCount = this.getValidSelectedSuggestedModuleIds().length;
    return suggestedCount + this.manualModules().length > 0 && manualOk;
  }

  private isDocsValid(): boolean {
    const hasDni = this.docDniModeSingle()
      ? Boolean(this.docDniFileSingle())
      : Boolean(this.docDniFileFront()) && Boolean(this.docDniFileBack());
    if (!hasDni) return false;
    const entries = this.docEntries();
    if (!entries.length) return false;
    return entries.every((entry) => Boolean(entry.titulo?.trim() && entry.fileName?.trim()));
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
    const fallbackContext = this.getFallbackRequestedContext();
    const suggestedLookup = new Map(this.suggestedModules().map((option) => [option.id, option]));
    const suggested: RequestedModule[] = [];
    this.selectedSuggestedModules().forEach((id) => {
      const option = suggestedLookup.get(id);
      if (!option) return;
      suggested.push({
        id: `suggested:${id}`,
        source: 'suggested' as const,
        nombre: option.nombre,
        tipo: option.tipo,
        grado: option.grado,
        familia: option.familia,
        ciclo: option.ciclo
      });
    });
    const manual = this.manualModules().map((entry) => ({
      id: entry.id,
      source: 'manual' as const,
      nombre: entry.nombre,
      codigo: entry.codigo,
      ...fallbackContext
    }));
    return [...suggested, ...manual];
  }

  private buildSuggestedModules(): SuggestedModuleOption[] {
    const options = new Map<string, SuggestedModuleOption>();
    const estudios = this.formEstudios();

    estudios.forEach((entry) => {
      if (!this.isCatalogTipo(entry.tipo)) return;
      const hasFilter = Boolean(entry.grado || entry.familia || entry.ciclo || entry.modulo);
      if (!hasFilter) return;
      const originLabel = this.formatSuggestedOrigin(entry);
      const filters = {
        grado: entry.grado,
        familia: entry.familia,
        ciclo: entry.ciclo,
        modulo: entry.modulo
      };
      this.rowsSignal().forEach((row) => {
        if (!this.matchesSideFilters(row, 'origen', filters)) return;
        const modulos = this.splitValues(row.modulo_destino);
        if (!modulos.length) return;
        const ciclos = this.splitValues(row.ciclo_destino);
        const familias = this.splitValues(row.familia_destino);
        const grados = this.splitValues(row.grado_destino);

        modulos.forEach((modulo, index) => {
          const ciclo = ciclos[index] || ciclos[0] || entry.ciclo.trim();
          const familia = familias[index] || familias[0] || entry.familia.trim();
          const grado = grados[index] || grados[0] || entry.grado.trim();
          const key = this.normalizeKey(modulo);
          const existing = options.get(key);
          if (existing) {
            if (!existing.origenes.includes(originLabel)) {
              existing.origenes = [...existing.origenes, originLabel];
            }
            return;
          }
          options.set(key, {
            id: modulo,
            nombre: modulo,
            ciclo,
            familia,
            grado,
            tipo: entry.tipo.trim(),
            origenes: [originLabel]
          });
        });
      });
    });

    return Array.from(options.values()).sort((a, b) => {
      const byCycle = a.ciclo.localeCompare(b.ciclo, 'es');
      if (byCycle !== 0) return byCycle;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  }

  private getFallbackRequestedContext(): Pick<RequestedModule, 'tipo' | 'grado' | 'familia' | 'ciclo'> {
    const estudios = this.formEstudios();
    const base = estudios.find((entry) => this.isCatalogTipo(entry.tipo)) ?? estudios[0];
    if (!base) {
      return { tipo: '', grado: '', familia: '', ciclo: '' };
    }
    return {
      tipo: base.tipo.trim(),
      grado: base.grado.trim(),
      familia: base.familia.trim(),
      ciclo: base.ciclo.trim()
    };
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

  private formatSuggestedOrigin(entry: EstudioEntry): string {
    const grado = entry.grado.trim() || 'Sin grado';
    const familia = entry.familia.trim() || 'Sin familia';
    const ciclo = entry.ciclo.trim() || 'Sin ciclo';
    const modulo = entry.modulo.trim() || 'Todos';
    return `${grado} • ${familia} • ${ciclo} • ${modulo}`;
  }

  private getValidSelectedSuggestedModuleIds(): string[] {
    const validIds = new Set(this.suggestedModules().map((option) => option.id));
    return this.selectedSuggestedModules().filter((id) => validIds.has(id));
  }

  private pruneSelectedSuggestedModules(): void {
    this.selectedSuggestedModules.update((ids) => {
      const validIds = new Set(this.suggestedModules().map((option) => option.id));
      const next = ids.filter((id) => validIds.has(id));
      return next.length === ids.length ? ids : next;
    });
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
