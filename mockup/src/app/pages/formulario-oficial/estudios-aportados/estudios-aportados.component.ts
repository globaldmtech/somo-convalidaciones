import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { EstudioEntry, EstudiosTipo, FpEstudioOption } from '../formulario-oficial.types';

@Component({
  selector: 'app-estudios-aportados',
  templateUrl: './estudios-aportados.component.html',
  host: {
    class: 'block',
    '(document:keydown.escape)': 'onEscapeKey()',
    '(document:click)': 'onDocumentClick($event)'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstudiosAportadosComponent {
  private static readonly SEARCH_LIMIT = 12;
  private draftSnapshotBeforeOpen: EstudioEntry | null = null;

  protected readonly selectFieldClass =
    'grid gap-2 text-sm text-slate-600 min-w-0 w-full [&>select]:w-full [&>select]:min-w-0 [&>select]:max-w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:px-3 [&>select]:py-2 [&>select]:text-[0.95rem] [&>select]:text-slate-800 [&>select]:box-border [&>select]:disabled:bg-slate-100 [&>select]:disabled:text-slate-400 [&>select]:disabled:cursor-not-allowed [&>select]:disabled:border-slate-200';
  protected readonly inputFieldClass =
    'grid gap-2 text-sm text-slate-600 min-w-0 w-full [&>input]:w-full [&>input]:min-w-0 [&>input]:max-w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:px-3 [&>input]:py-2 [&>input]:text-[0.95rem] [&>input]:text-slate-800 [&>input]:placeholder:text-slate-400 [&>input]:box-border [&>input]:disabled:bg-slate-100 [&>input]:disabled:text-slate-400 [&>input]:disabled:cursor-not-allowed [&>input]:disabled:border-slate-200';
  protected readonly addModalTitleId = 'estudios-add-modal-title';
  protected readonly addModalDescriptionId = 'estudios-add-modal-description';
  readonly draft = input.required<EstudioEntry>();
  readonly estudios = input<EstudioEntry[]>([]);
  readonly fpEstudioOptions = input<FpEstudioOption[]>([]);
  readonly moduloOptionsByEstudio = input<string[][]>([]);

  readonly tipoChange = output<EstudiosTipo>();
  readonly fieldChange = output<{ key: keyof EstudioEntry; value: string }>();
  readonly addEstudios = output<EstudioEntry[]>();
  readonly removeEstudio = output<number>();
  readonly estudioModuloChange = output<{ index: number; value: string }>();
  protected readonly addModalOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly autocompleteOpen = signal(false);
  protected readonly modalQueuedEstudios = signal<EstudioEntry[]>([]);
  protected readonly queuedFpEstudios = computed(() =>
    this.modalQueuedEstudios().filter((entry) => this.isFormacionProfesionalTipo(entry.tipo))
  );
  protected readonly queuedDescripcionEstudios = computed(() =>
    this.modalQueuedEstudios().filter((entry) => this.isUniversitarioUOtroTipo(entry.tipo))
  );
  protected readonly estudiosFpRows = computed(() =>
    this.estudios()
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => this.isFormacionProfesionalTipo(entry.tipo))
  );
  protected readonly estudiosDescripcionRows = computed(() =>
    this.estudios()
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => this.isUniversitarioUOtroTipo(entry.tipo))
  );
  protected readonly moduloPickerOpen = signal(false);
  protected readonly moduloPickerIndex = signal<number | null>(null);
  protected readonly moduloPickerSelected = signal<string[]>([]);
  protected readonly moduloPickerManualDraft = signal('');
  protected readonly filteredFpEstudioOptions = computed(() => {
    if (!this.isFpModalSelection()) return [];
    const query = this.normalizeSearchText(this.searchQuery());
    const options = this.fpEstudioOptions();
    if (!query) {
      return options.slice(0, EstudiosAportadosComponent.SEARCH_LIMIT);
    }
    return options
      .filter((option) => this.matchesFpSearch(option, query))
      .slice(0, EstudiosAportadosComponent.SEARCH_LIMIT);
  });
  protected readonly showFpAutocomplete = computed(() => {
    return (
      this.addModalOpen() &&
      this.isFpModalSelection() &&
      this.autocompleteOpen() &&
      this.searchQuery().trim().length > 0
    );
  });

  // Abre el modal para agregar un nuevo estudio.
  protected openAddEstudioModal(): void {
    const entry = this.draft();
    this.draftSnapshotBeforeOpen = { ...entry };
    this.searchQuery.set(this.isFormacionProfesionalTipo(entry.tipo) ? entry.ciclo : '');
    this.autocompleteOpen.set(false);
    this.modalQueuedEstudios.set([]);
    this.addModalOpen.set(true);
  }

  // Cierra el modal de alta de estudios. Si procede, revierte cambios no confirmados.
  protected closeAddEstudioModal(restoreDraft = true): void {
    if (!this.addModalOpen()) return;
    if (restoreDraft) {
      this.restoreDraftSnapshot();
    }
    this.autocompleteOpen.set(false);
    this.searchQuery.set('');
    this.modalQueuedEstudios.set([]);
    this.draftSnapshotBeforeOpen = null;
    this.addModalOpen.set(false);
  }

  // Cierra el modal de estudios al pulsar la tecla Escape.
  protected onEscapeKey(): void {
    if (this.moduloPickerOpen()) {
      this.closeModuloPicker();
      return;
    }
    if (!this.addModalOpen()) return;
    this.closeAddEstudioModal(true);
  }

  // Cierra el desplegable de resultados si se hace clic fuera del buscador.
  protected onDocumentClick(event: Event): void {
    if (!this.addModalOpen()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-estudio-search]')) return;
    this.autocompleteOpen.set(false);
  }

  // Emite el cambio del tipo de estudio y reinicia estados auxiliares del modal.
  protected handleTipoEstudioChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.tipoChange.emit(value as EstudiosTipo);
    this.searchQuery.set('');
    this.autocompleteOpen.set(false);
  }

  // Gestiona el input de búsqueda/descripcion según el tipo de estudio.
  protected handleSearchOrDescriptionInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    if (this.isFpModalSelection()) {
      this.searchQuery.set(value);
      this.autocompleteOpen.set(value.trim().length > 0);
      return;
    }
    if (this.isUniversitariosOtrosModalSelection()) {
      this.fieldChange.emit({ key: 'descripcion', value });
    }
  }

  // Abre el desplegable de resultados del buscador cuando procede.
  protected handleSearchOrDescriptionFocus(): void {
    if (!this.isFpModalSelection()) return;
    if (!this.searchQuery().trim()) return;
    this.autocompleteOpen.set(true);
  }

  // Indica si procede mostrar el botón para agregar un ciclo manual cuando no hay coincidencias.
  protected canAddManualFpEstudio(): boolean {
    return this.isFpModalSelection() && this.searchQuery().trim().length > 0 && !this.hasFpMatches();
  }

  // Indica si debe mostrarse el botón inline "Agregar" para el tipo activo.
  protected canAddCurrentEstudioFromInput(): boolean {
    if (this.canAddManualFpEstudio()) return true;
    if (this.isUniversitariosOtrosModalSelection()) {
      return this.draft().descripcion.trim().length > 0;
    }
    return false;
  }

  // Agrega al acumulado del modal el estudio escrito en el input según el tipo activo.
  protected addCurrentEstudioFromInput(): void {
    if (this.canAddManualFpEstudio()) {
      this.addManualFpEstudioFromSearch();
      return;
    }
    this.addManualDescripcionEstudioFromInput();
  }

  // Agrega manualmente el texto del buscador como ciclo formativo cuando no existe en catálogo.
  protected addManualFpEstudioFromSearch(): void {
    if (!this.canAddManualFpEstudio()) return;
    const ciclo = this.searchQuery().trim();
    const entry: EstudioEntry = {
      tipo: this.draft().tipo,
      descripcion: '',
      grado: '',
      familia: '',
      ciclo,
      modulo: ''
    };
    this.queueModalEstudio(entry);
    this.clearModalDraftForNextSelection();
  }

  // Selecciona una sugerencia del autocomplete y rellena el borrador de estudio.
  protected pickFpEstudioOption(option: FpEstudioOption): void {
    if (!this.isFpModalSelection()) return;
    const entry: EstudioEntry = {
      tipo: this.draft().tipo,
      descripcion: '',
      grado: option.grado,
      familia: option.familia,
      ciclo: option.ciclo,
      modulo: 'Todos'
    };
    this.queueModalEstudio(entry);
    this.clearModalDraftForNextSelection();
  }

  // Agrega manualmente un estudio universitario/u otro usando la descripción escrita.
  protected addManualDescripcionEstudioFromInput(): void {
    if (!this.isUniversitariosOtrosModalSelection()) return;
    const descripcion = this.draft().descripcion.trim();
    if (!descripcion) return;
    const entry: EstudioEntry = {
      tipo: this.draft().tipo,
      descripcion,
      grado: '',
      familia: '',
      ciclo: '',
      modulo: ''
    };
    this.queueModalEstudio(entry);
    this.clearModalDraftForNextSelection();
  }

  // Elimina una fila concreta de la previsualización acumulada del modal.
  protected removeQueuedModalEstudioEntry(entry: EstudioEntry): void {
    this.modalQueuedEstudios.update((rows) => {
      const index = rows.indexOf(entry);
      if (index < 0) return rows;
      return rows.filter((_, current) => current !== index);
    });
  }

  // Indica si el botón de agregar del modal puede enviarse.
  protected canConfirmAddModal(): boolean {
    return this.modalQueuedEstudios().length > 0;
  }

  // Confirma el alta de uno o varios estudios en el modal.
  protected confirmAddEstudio(): void {
    const entriesToAdd = this.modalQueuedEstudios().map((entry) => ({ ...entry }));
    if (!entriesToAdd.length) return;
    this.addEstudios.emit(entriesToAdd);
    this.closeAddEstudioModal(false);
  }

  // Solicita eliminar un estudio del listado por índice.
  protected removeEstudioAt(index: number): void {
    const currentPickerIndex = this.moduloPickerIndex();
    if (currentPickerIndex !== null) {
      if (currentPickerIndex === index) {
        this.closeModuloPicker();
      } else if (currentPickerIndex > index) {
        this.moduloPickerIndex.set(currentPickerIndex - 1);
      }
    }
    this.removeEstudio.emit(index);
  }

  // Devuelve las opciones de módulo disponibles para una fila concreta.
  protected getEstudioModuloOptions(index: number): string[] {
    const options = this.moduloOptionsByEstudio()[index] ?? [];
    const unique = new Set<string>();
    options.forEach((option) => {
      const normalized = option.trim();
      if (normalized) unique.add(normalized);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }

  // Devuelve un resumen compacto de módulos seleccionados para la celda de tabla.
  protected getEstudioModuloSummary(entry: EstudioEntry): string {
    if (!this.isFormacionProfesionalTipo(entry.tipo)) {
      return this.getEstudioModuloDisplay(entry);
    }
    const modulos = this.splitModuloSelection(entry.modulo);
    if (!modulos.length) {
      return this.isManualFpEstudio(entry) ? '—' : 'Todos';
    }
    if (modulos.length === 1) return '1 módulo seleccionado';
    return `${modulos.length} módulos seleccionados`;
  }

  // Abre el modal de módulos para seleccionar múltiples opciones con checkboxes.
  protected openModuloPicker(index: number): void {
    const estudio = this.estudios()[index];
    if (!estudio || !this.canEditFpEstudioModulos(estudio)) return;
    const selected = this.splitModuloSelection(estudio.modulo);
    const initialSelected = this.isTodosModuloValue(estudio.modulo)
      ? this.getEstudioModuloOptions(index)
      : selected;
    this.moduloPickerIndex.set(index);
    this.moduloPickerSelected.set(initialSelected);
    this.moduloPickerManualDraft.set('');
    this.moduloPickerOpen.set(true);
  }

  // Cierra el modal de selección de módulos sin aplicar cambios.
  protected closeModuloPicker(): void {
    this.moduloPickerOpen.set(false);
    this.moduloPickerIndex.set(null);
    this.moduloPickerSelected.set([]);
    this.moduloPickerManualDraft.set('');
  }

  // Devuelve el conjunto de opciones visibles en el modal (catálogo + selección manual previa).
  protected getModuloPickerOptions(): string[] {
    const index = this.moduloPickerIndex();
    if (index === null) return [];
    const merged = new Set<string>();
    this.getEstudioModuloOptions(index).forEach((option) => merged.add(option));
    this.moduloPickerSelected().forEach((option) => {
      const normalized = option.trim();
      if (normalized) merged.add(normalized);
    });
    return Array.from(merged).sort((a, b) => a.localeCompare(b, 'es'));
  }

  // Indica si una opción aparece marcada dentro del modal de módulos.
  protected isModuloPickerOptionChecked(option: string): boolean {
    const normalizedOption = this.normalizeSearchText(option);
    return this.moduloPickerSelected().some(
      (selected) => this.normalizeSearchText(selected) === normalizedOption
    );
  }

  // Marca todas las opciones visibles de la lista de módulos.
  protected selectAllModuloPickerOptions(): void {
    const options = this.getModuloPickerOptions();
    const manualSelected = this.moduloPickerSelected().filter((selected) => {
      return !options.some(
        (option) => this.normalizeSearchText(option) === this.normalizeSearchText(selected)
      );
    });
    this.moduloPickerSelected.set([...options, ...manualSelected]);
  }

  // Desmarca todas las opciones actualmente seleccionadas.
  protected clearModuloPickerSelection(): void {
    this.moduloPickerSelected.set([]);
  }

  // Indica si todas las opciones visibles del listado están marcadas.
  protected areAllModuloPickerOptionsSelected(): boolean {
    const options = this.getModuloPickerOptions();
    if (!options.length) return false;
    return options.every((option) => this.isModuloPickerOptionChecked(option));
  }

  // Indica si el switch de marcado total debe habilitarse.
  protected canToggleAllModuloPicker(): boolean {
    return this.getModuloPickerOptions().length > 0;
  }

  // Alterna el marcado masivo de módulos mediante un switch.
  protected toggleAllModuloPickerSwitch(): void {
    if (!this.canToggleAllModuloPicker()) return;
    if (this.areAllModuloPickerOptionsSelected()) {
      this.clearModuloPickerSelection();
      return;
    }
    this.selectAllModuloPickerOptions();
  }

  // Indica si hay selección mínima para habilitar el botón aplicar.
  protected canApplyModuloPickerSelection(): boolean {
    return this.moduloPickerSelected().length > 0;
  }

  // Marca o desmarca un módulo individual en el modal.
  protected toggleModuloPickerOption(option: string, event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    if (checked) {
      this.moduloPickerSelected.update((selected) => {
        const exists = selected.some(
          (entry) => this.normalizeSearchText(entry) === this.normalizeSearchText(option)
        );
        return exists ? selected : [...selected, option];
      });
      return;
    }
    this.moduloPickerSelected.update((selected) =>
      selected.filter((entry) => this.normalizeSearchText(entry) !== this.normalizeSearchText(option))
    );
  }

  // Actualiza el borrador para añadir un módulo manual desde el modal.
  protected handleModuloPickerManualDraftInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.moduloPickerManualDraft.set(value);
  }

  // Añade un módulo manual al conjunto seleccionado en el modal.
  protected addModuloPickerManualOption(): void {
    const value = this.moduloPickerManualDraft().trim();
    if (!value) return;
    this.moduloPickerSelected.update((selected) => {
      const exists = selected.some(
        (entry) => this.normalizeSearchText(entry) === this.normalizeSearchText(value)
      );
      return exists ? selected : [...selected, value];
    });
    this.moduloPickerManualDraft.set('');
  }

  // Aplica la selección de módulos del modal en la fila activa.
  protected applyModuloPickerSelection(): void {
    const index = this.moduloPickerIndex();
    if (index === null) return;
    const value = this.buildModuloSelectionValue(this.moduloPickerSelected(), index);
    if (!value) return;
    this.estudioModuloChange.emit({ index, value });
    this.closeModuloPicker();
  }

  // Comprueba si el tipo pertenece a Formación Profesional (LOE/LOGSE).
  protected isFormacionProfesionalTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  // Indica si el tipo requiere descripción manual (universitarios u otros).
  protected isUniversitarioUOtroTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'Universitarios' || tipo === 'Otros';
  }

  // Indica si el estudio FP procede de alta manual (sin grado ni familia).
  protected isManualFpEstudio(entry: EstudioEntry): boolean {
    if (!this.isFormacionProfesionalTipo(entry.tipo)) return false;
    return !entry.grado.trim() && !entry.familia.trim();
  }

  // Indica si una fila FP puede abrir el selector de módulos.
  protected canEditFpEstudioModulos(entry: EstudioEntry): boolean {
    return this.isFormacionProfesionalTipo(entry.tipo);
  }

  // Formatea el valor de grado para su visualización en texto largo.
  protected formatGrade(value: string | null): string {
    if (!value) return 'Sin grado';
    if (value === 'GB') return 'GB · Grado básico';
    if (value === 'GM') return 'GM · Grado medio';
    if (value === 'GS') return 'GS · Grado superior';
    if (value === 'CE') return 'CE · Curso de especialización';
    return value;
  }

  // Devuelve el texto de tipo de estudio para la tabla.
  protected getEstudioTipoDisplay(entry: EstudioEntry): string {
    const tipo = entry.tipo.trim();
    if (!tipo) return '—';
    if (tipo === 'Universitarios') return 'Estudios universitarios';
    if (tipo === 'Otros') return 'Otros estudios';
    return tipo;
  }

  // Devuelve el grado visible para la tabla de estudios.
  protected getEstudioGradoDisplay(entry: EstudioEntry): string {
    if (!this.isFormacionProfesionalTipo(entry.tipo)) return '—';
    const grado = entry.grado.trim();
    return grado ? this.formatGrade(grado) : '—';
  }

  // Devuelve un valor de texto con fallback para celdas vacías.
  protected getEstudioValue(value: string): string {
    const normalized = value.trim();
    return normalized || '—';
  }

  // Devuelve el módulo o descripción a mostrar en la última columna.
  protected getEstudioModuloDisplay(entry: EstudioEntry): string {
    if (this.isFormacionProfesionalTipo(entry.tipo)) {
      return this.getEstudioValue(entry.modulo);
    }
    const descripcion = entry.descripcion.trim();
    return descripcion || '—';
  }

  // Devuelve el valor actual del selector de tipo de estudios.
  protected getTipoEstudioSelection(): EstudiosTipo {
    return this.draft().tipo;
  }

  // Devuelve el texto del input de búsqueda o descripción.
  protected getSearchOrDescriptionValue(): string {
    if (this.isFpModalSelection()) return this.searchQuery();
    if (this.isUniversitariosOtrosModalSelection()) return this.draft().descripcion;
    return '';
  }

  // Devuelve placeholder del input de búsqueda o descripción.
  protected getSearchOrDescriptionPlaceholder(): string {
    if (this.isFpModalSelection()) {
      return 'Busca por grado, familia o ciclo';
    }
    if (this.isUniversitariosOtrosModalSelection()) {
      return 'Describe el estudio universitario u otro';
    }
    return 'Selecciona primero un tipo de estudio';
  }

  // Indica si el input de búsqueda/descripcion debe estar deshabilitado.
  protected isSearchOrDescriptionDisabled(): boolean {
    return !this.getTipoEstudioSelection();
  }

  // Indica si un resultado coincide con el estudio ya seleccionado en borrador.
  protected isFpOptionSelected(option: FpEstudioOption): boolean {
    const entry = this.draft();
    return (
      this.normalizeSearchText(entry.grado) === this.normalizeSearchText(option.grado) &&
      this.normalizeSearchText(entry.familia) === this.normalizeSearchText(option.familia) &&
      this.normalizeSearchText(entry.ciclo) === this.normalizeSearchText(option.ciclo)
    );
  }

  // Formatea la línea secundaria de cada resultado del autocomplete.
  protected getFpOptionMeta(option: FpEstudioOption): string {
    const tipo = this.draft().tipo === 'LOE' || this.draft().tipo === 'LOGSE'
      ? this.draft().tipo
      : 'LOE/LOGSE';
    return `${tipo} · ${this.formatGrade(option.grado)} · ${option.familia}`;
  }

  // Comprueba si hay resultados en el buscador actual.
  protected hasFpMatches(): boolean {
    return this.filteredFpEstudioOptions().length > 0;
  }

  // Indica si el selector principal está en modo FP.
  protected isFpModalSelection(): boolean {
    return this.isFormacionProfesionalTipo(this.draft().tipo);
  }

  // Indica si el selector principal está en modo universitarios/otros.
  protected isUniversitariosOtrosModalSelection(): boolean {
    return this.isUniversitarioUOtroTipo(this.draft().tipo);
  }

  // Comprueba si una opción de FP encaja con el término buscado.
  private matchesFpSearch(option: FpEstudioOption, query: string): boolean {
    return [option.ciclo, option.familia, option.grado]
      .map((value) => this.normalizeSearchText(value))
      .some((value) => value.includes(query));
  }

  // Recupera el borrador tal como estaba al abrir el modal.
  private restoreDraftSnapshot(): void {
    const snapshot = this.draftSnapshotBeforeOpen;
    if (!snapshot) return;

    this.tipoChange.emit(snapshot.tipo);

    this.fieldChange.emit({ key: 'grado', value: snapshot.grado });
    this.fieldChange.emit({ key: 'familia', value: snapshot.familia });
    this.fieldChange.emit({ key: 'ciclo', value: snapshot.ciclo });
    this.fieldChange.emit({ key: 'modulo', value: snapshot.modulo });
    this.fieldChange.emit({ key: 'descripcion', value: snapshot.descripcion });
  }

  // Normaliza texto para comparaciones de búsqueda.
  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Convierte el texto de módulos a una lista única sin incluir "Todos".
  private splitModuloSelection(value: string): string[] {
    if (!value) return [];
    const unique = new Set<string>();
    value
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        if (this.normalizeSearchText(entry) === 'todos') return;
        const alreadyAdded = Array.from(unique).some(
          (current) => this.normalizeSearchText(current) === this.normalizeSearchText(entry)
        );
        if (!alreadyAdded) unique.add(entry);
      });
    return Array.from(unique);
  }

  // Indica si la selección persistida representa explícitamente "Todos".
  private isTodosModuloValue(value: string): boolean {
    return this.normalizeSearchText(value) === 'todos';
  }

  // Serializa la selección de módulos del modal para persistirla en el estudio.
  private buildModuloSelectionValue(selected: string[], index: number): string {
    const unique = new Set<string>();
    selected.forEach((entry) => {
      const normalized = entry.trim();
      if (!normalized) return;
      if (this.normalizeSearchText(normalized) === 'todos') return;
      const alreadyAdded = Array.from(unique).some(
        (current) => this.normalizeSearchText(current) === this.normalizeSearchText(normalized)
      );
      if (!alreadyAdded) unique.add(normalized);
    });

    if (!unique.size) return '';

    const catalogOptions = this.getEstudioModuloOptions(index);
    if (catalogOptions.length) {
      const normalizedCatalog = new Set(
        catalogOptions.map((option) => this.normalizeSearchText(option))
      );
      const normalizedSelected = new Set(
        Array.from(unique).map((option) => this.normalizeSearchText(option))
      );
      const allCatalogSelected = Array.from(normalizedCatalog).every((option) =>
        normalizedSelected.has(option)
      );
      const hasManualSelections = Array.from(normalizedSelected).some(
        (option) => !normalizedCatalog.has(option)
      );
      if (allCatalogSelected && !hasManualSelections) {
        return 'Todos';
      }
    }

    return Array.from(unique).join('; ');
  }

  // Añade un estudio a la cola del modal evitando duplicados según su tipo.
  private queueModalEstudio(entry: EstudioEntry): void {
    this.modalQueuedEstudios.update((rows) => {
      const duplicate = rows.some((queued) => this.isSameQueuedEstudio(queued, entry));
      return duplicate ? rows : [...rows, entry];
    });
  }

  // Compara si dos estudios en cola deben considerarse duplicados.
  private isSameQueuedEstudio(first: EstudioEntry, second: EstudioEntry): boolean {
    if (this.normalizeSearchText(first.tipo) !== this.normalizeSearchText(second.tipo)) return false;
    if (this.isFormacionProfesionalTipo(first.tipo) && this.isFormacionProfesionalTipo(second.tipo)) {
      return (
        this.normalizeSearchText(first.grado) === this.normalizeSearchText(second.grado) &&
        this.normalizeSearchText(first.familia) === this.normalizeSearchText(second.familia) &&
        this.normalizeSearchText(first.ciclo) === this.normalizeSearchText(second.ciclo)
      );
    }
    if (this.isUniversitarioUOtroTipo(first.tipo) && this.isUniversitarioUOtroTipo(second.tipo)) {
      return this.normalizeSearchText(first.descripcion) === this.normalizeSearchText(second.descripcion);
    }
    return false;
  }

  // Limpia tipo e input tras agregar una fila al acumulado para permitir añadir otra.
  private clearModalDraftForNextSelection(): void {
    this.tipoChange.emit('');
    this.searchQuery.set('');
    this.autocompleteOpen.set(false);
  }
}
