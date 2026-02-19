import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  FpEstudioOption,
  ManualModuleEntry,
  ManualModuleEntryDraft,
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
export class FormularioOficialComponent {
  private readonly db = inject(DbService);
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
    modulo: ''
  });

  protected readonly formEstudios = signal<EstudioEntry[]>([]);

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
  protected readonly fpEstudioOptions = computed(() => this.buildFpEstudioOptions());
  protected readonly formEstudiosModuloOptions = computed(() => {
    return this.formEstudios().map((entry) => {
      if (!this.isCatalogTipo(entry.tipo)) return [];
      return this.buildFormModuleOptions({
        grado: entry.grado,
        familia: entry.familia,
        ciclo: entry.ciclo,
        modulo: ''
      });
    });
  });
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

  // Restaura el borrador guardado y carga los datos base del formulario.
  constructor() {
    this.restoreDraftSnapshot();
    this.loadData();
  }

  // Actualiza el campo de datos personales segun la clave recibida.
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

  // Retrocede al paso anterior sin bajar del paso 1.
  protected previousStep(): void {
    if (this.currentStep() <= 1) return;
    this.currentStep.update((step) => Math.max(1, step - 1));
  }

  // Avanza al siguiente paso solo si el paso actual es valido.
  protected nextStep(): void {
    if (this.currentStep() >= this.totalSteps || !this.isStepValid(this.currentStep())) return;
    this.currentStep.update((step) => Math.min(this.totalSteps, step + 1));
  }

  // Indica si un paso ya esta completado respecto al paso actual.
  protected isStepComplete(step: number): boolean {
    return step < this.currentStep() && this.isStepValid(step);
  }

  // Valida cada paso segun sus reglas de negocio.
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

  // Agrega uno o varios estudios validados al listado desde el modal.
  protected addEstudioRows(entries: EstudioEntry[]): void {
    const validEntries = entries
      .map((entry) => ({ ...entry }))
      .filter((entry) => this.isEstudioEntryComplete(entry));
    if (!validEntries.length) return;
    this.formEstudios.update((rows) => [...rows, ...validEntries]);
    this.resetDraftEstudio('');
  }

  // Elimina un estudio por indice y depura sugerencias invalidadas.
  protected removeEstudioRow(index: number): void {
    this.formEstudios.update((rows) => rows.filter((_, current) => current !== index));
    this.pruneSelectedSuggestedModules();
  }

  // Actualiza el módulo de un estudio ya agregado en el listado.
  protected updateEstudioRowModulo(index: number, value: string): void {
    const normalizedValue = this.normalizeModuloSelection(value);
    this.formEstudios.update((rows) => {
      if (index < 0 || index >= rows.length) return rows;
      const current = rows[index];
      if (!this.isCatalogTipo(current.tipo)) return rows;
      const next = [...rows];
      next[index] = { ...current, modulo: normalizedValue };
      return next;
    });
    this.pruneSelectedSuggestedModules();
  }

  // Actualiza un campo concreto del estudio en borrador.
  protected updateEstudioField(key: keyof EstudioEntry, value: string): void {
    this.draftEstudio.update((row) => ({ ...row, [key]: value }));
  }

  // Cambia el tipo de estudio y reinicia dependencias del borrador.
  protected onTipoChange(value: EstudiosTipo): void {
    this.resetDraftEstudio(value);
  }

  // Agrega uno o varios módulos manuales al listado.
  protected addManualModuleEntries(entries: ManualModuleEntryDraft[]): void {
    const sanitized = entries
      .map((entry) => ({ nombre: entry.nombre.trim() }))
      .filter((entry) => entry.nombre.length > 0);
    if (!sanitized.length) return;

    this.manualModules.update((rows) => {
      const next = [...rows];
      sanitized.forEach((entry) => {
        const duplicate = next.some(
          (current) => this.normalizeKey(current.nombre) === this.normalizeKey(entry.nombre)
        );
        if (duplicate) return;
        next.push({
          id: this.nextManualModuleId(),
          nombre: entry.nombre
        });
      });
      return next;
    });
  }

  // Marca o desmarca un modulo sugerido seleccionado por el usuario.
  protected toggleSuggestedModule(value: string, checked: boolean): void {
    this.selectedSuggestedModules.update((items) => {
      if (checked) {
        return items.includes(value) ? items : [...items, value];
      }
      return items.filter((item) => item !== value);
    });
  }

  // Elimina una solicitud ya agregada, sugerida o manual.
  protected removeRequestedModule(item: RequestedModule): void {
    if (item.source === 'suggested') {
      const suggestedId = item.id.startsWith('suggested:') ? item.id.slice(10) : item.id;
      this.selectedSuggestedModules.update((items) => items.filter((entry) => entry !== suggestedId));
      return;
    }
    this.manualModules.update((rows) => rows.filter((row) => row.id !== item.id));
  }

  // Cambia el modo de DNI y limpia los archivos incompatibles.
  protected onDniModeChange(single: boolean): void {
    this.docDniModeSingle.set(single);
    if (single) {
      this.docDniFileFront.set(null);
      this.docDniFileBack.set(null);
    } else {
      this.docDniFileSingle.set(null);
    }
  }

  // Guarda el archivo de DNI en modo documento unico.
  protected onDniSingleChange(file: File | null): void {
    this.docDniFileSingle.set(file);
  }

  // Guarda el archivo del anverso del DNI.
  protected onDniFrontChange(file: File | null): void {
    this.docDniFileFront.set(file);
  }

  // Guarda el archivo del reverso del DNI.
  protected onDniBackChange(file: File | null): void {
    this.docDniFileBack.set(file);
  }

  // Agrega una entrada de documentacion adicional con titulo y archivo.
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

  // Elimina un documento adicional por id.
  protected removeDocEntry(id: string): void {
    this.docEntries.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  // Abre el modal de previsualizacion final cuando el formulario es valido.
  protected requestSubmit(): void {
    if (!this.isFormValid()) return;
    this.confirmDialog.set(true);
  }

  // Cierra el modal de previsualizacion final.
  protected cancelSubmit(): void {
    this.confirmDialog.set(false);
  }

  // Guarda el borrador y navega a la pantalla de verificacion final.
  protected confirmSubmit(): void {
    if (!this.isFormValid()) return;
    this.confirmDialog.set(false);
    this.saveDraftSnapshot();
    void this.router.navigate(['/formulario-oficial/verificacion']);
  }

  // Comprueba si el tipo de estudio usa catalogo oficial.
  protected isCatalogTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  // Formatea una fecha ISO al formato local visible.
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

  // Construye y guarda una copia completa del estado actual del formulario.
  private saveDraftSnapshot(): void {
    const snapshot: FormularioDraftSnapshot = {
      currentStep: this.currentStep(),
      personalValues: { ...this.personalValues() },
      draftEstudio: { ...this.draftEstudio() },
      formEstudios: this.formEstudios().map((entry) => ({ ...entry })),
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

  // Restaura en memoria el ultimo borrador disponible.
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

  // Obtiene el mayor sufijo numerico para continuar secuencias de ids.
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

  // Valida que los datos personales obligatorios esten informados.
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

  // Valida que exista al menos un estudio completo.
  private isEstudiosValid(): boolean {
    const estudios = this.formEstudios();
    return estudios.length > 0 && estudios.every((entry) => this.isEstudioEntryComplete(entry));
  }

  // Valida que exista al menos un modulo solicitado valido.
  private isModulosValid(): boolean {
    const manualOk = this.manualModules().every((row) => row.nombre.trim().length > 0);
    const suggestedCount = this.getValidSelectedSuggestedModuleIds().length;
    return suggestedCount + this.manualModules().length > 0 && manualOk;
  }

  // Valida la documentacion obligatoria de DNI y documentos adicionales.
  private isDocsValid(): boolean {
    const hasDni = this.docDniModeSingle()
      ? Boolean(this.docDniFileSingle())
      : Boolean(this.docDniFileFront()) && Boolean(this.docDniFileBack());
    if (!hasDni) return false;
    const entries = this.docEntries();
    if (!entries.length) return false;
    return entries.every((entry) => Boolean(entry.titulo?.trim() && entry.fileName?.trim()));
  }

  // Genera opciones únicas de Formación Profesional (grado + familia + ciclo) para el autocomplete.
  private buildFpEstudioOptions(): FpEstudioOption[] {
    const options = new Map<string, FpEstudioOption>();
    this.catalogRowsSignal().forEach((row) => {
      const grado = row.grado.trim();
      const familia = row.familia.trim();
      const ciclo = row.ciclo.trim();
      if (!grado || !familia || !ciclo) return;
      const id = this.normalizeKey(`${grado}|${familia}|${ciclo}`);
      if (options.has(id)) return;
      options.set(id, {
        id,
        grado,
        familia,
        ciclo
      });
    });
    return Array.from(options.values()).sort((a, b) => {
      const byCycle = a.ciclo.localeCompare(b.ciclo, 'es');
      if (byCycle !== 0) return byCycle;
      const byFamily = a.familia.localeCompare(b.familia, 'es');
      if (byFamily !== 0) return byFamily;
      return a.grado.localeCompare(b.grado, 'es');
    });
  }

  // Genera opciones de modulo filtradas por grado/familia/ciclo.
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

  // Construye la lista final de solicitudes (sugeridas + manuales).
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
        ciclo: option.ciclo,
        origenes: [...option.origenes]
      });
    });
    const manual = this.manualModules().map((entry) => ({
      id: entry.id,
      source: 'manual' as const,
      nombre: entry.nombre,
      origenes: ['Añadido manualmente'],
      ...fallbackContext
    }));
    return [...suggested, ...manual];
  }

  // Construye sugerencias de modulos a partir de estudios y convalidaciones.
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

  // Obtiene contexto por defecto para modulos manuales sin origen explicito.
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

  // Comprueba si una fila cumple los filtros del lado origen/destino.
  private matchesSideFilters(
    row: ConvalidacionRow,
    side: 'origen' | 'destino',
    filters: Record<FilterKey, string>
  ): boolean {
    return (['grado', 'familia', 'ciclo', 'modulo'] as FilterKey[]).every((key) => {
      const value = filters[key];
      if (!value) return true;
      if (key === 'modulo') {
        const selectedModulos = this.splitValues(value).filter(
          (entry) => this.normalizeKey(entry) !== 'todos'
        );
        if (!selectedModulos.length) return true;
        const current = row[`${key}_${side}` as keyof ConvalidacionRow] as string | null;
        return selectedModulos.some((modulo) => this.listIncludes(current, modulo));
      }
      const current = row[`${key}_${side}` as keyof ConvalidacionRow] as string | null;
      return this.listIncludes(current, value);
    });
  }

  // Divide un campo con valores separados por ';' en una lista limpia.
  private splitValues(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  // Normaliza texto para comparaciones insensibles a tildes y mayusculas.
  private normalizeKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Comprueba si un valor objetivo existe dentro de una lista serializada.
  private listIncludes(listValue: string | null, target: string): boolean {
    if (!target) return true;
    const normalizedTarget = this.normalizeKey(target);
    return this.splitValues(listValue).some(
      (entry) => this.normalizeKey(entry) === normalizedTarget
    );
  }

  // Formatea el estudio origen mostrado en "Sugerido por".
  private formatSuggestedOrigin(entry: EstudioEntry): string {
    const grado = entry.grado.trim() || 'Sin grado';
    const familia = entry.familia.trim() || 'Sin familia';
    const ciclo = entry.ciclo.trim() || 'Sin ciclo';
    const modulo = this.formatModuloOrigin(entry.modulo);
    return `${grado} • ${familia} • ${ciclo} • ${modulo}`;
  }

  // Normaliza la selección de módulos (incluyendo multiselección con ';').
  private normalizeModuloSelection(value: string): string {
    const unique = new Set<string>();
    this.splitValues(value).forEach((entry) => {
      if (this.normalizeKey(entry) === 'todos') return;
      const alreadyAdded = Array.from(unique).some(
        (current) => this.normalizeKey(current) === this.normalizeKey(entry)
      );
      if (!alreadyAdded) unique.add(entry);
    });
    if (!unique.size) return 'Todos';
    return Array.from(unique).join('; ');
  }

  // Formatea la selección de módulos para mostrarla en el origen de sugerencias.
  private formatModuloOrigin(value: string): string {
    const modulos = this.splitValues(value).filter((entry) => this.normalizeKey(entry) !== 'todos');
    if (!modulos.length) return 'Todos';
    if (modulos.length === 1) return modulos[0];
    return `${modulos.length} módulos`;
  }

  // Devuelve ids sugeridos seleccionados que siguen siendo validos.
  private getValidSelectedSuggestedModuleIds(): string[] {
    const validIds = new Set(this.suggestedModules().map((option) => option.id));
    return this.selectedSuggestedModules().filter((id) => validIds.has(id));
  }

  // Elimina del estado las sugerencias seleccionadas que ya no existen.
  private pruneSelectedSuggestedModules(): void {
    this.selectedSuggestedModules.update((ids) => {
      const validIds = new Set(this.suggestedModules().map((option) => option.id));
      const next = ids.filter((id) => validIds.has(id));
      return next.length === ids.length ? ids : next;
    });
  }

  // Carga catalogo y convalidaciones desde la base de datos.
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

  // Reinicia el estudio en borrador segun el tipo seleccionado.
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

  // Genera el siguiente id incremental para modulos manuales.
  private nextManualModuleId(): string {
    this.manualModuleSequence += 1;
    return `manual-${this.manualModuleSequence}`;
  }

  // Genera el siguiente id incremental para documentos adicionales.
  private nextDocEntryId(): string {
    this.docEntrySequence += 1;
    return `doc-${this.docEntrySequence}`;
  }

  // Comprueba si un estudio tiene los campos minimos requeridos.
  private isEstudioEntryComplete(entry: EstudioEntry): boolean {
    if (!entry.tipo) return false;
    if (this.isCatalogTipo(entry.tipo)) {
      const grado = entry.grado.trim();
      const familia = entry.familia.trim();
      const ciclo = entry.ciclo.trim();
      const modulo = entry.modulo.trim();
      const hasCatalogData = Boolean(grado && familia);
      const hasManualCycleOnly = !grado && !familia;
      if (hasCatalogData) {
        return Boolean(ciclo && modulo);
      }
      if (hasManualCycleOnly) {
        return Boolean(ciclo);
      }
      return false;
    }
    return entry.descripcion.trim().length > 0;
  }

}
