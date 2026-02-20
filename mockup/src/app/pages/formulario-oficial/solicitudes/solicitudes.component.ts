import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import {
  ManualModuleEntryDraft,
  RequestedModule,
  SuggestedModuleOption
} from '../formulario-oficial.types';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudesComponent {
  protected readonly addModuleModalOpen = signal(false);
  protected readonly addModuleModalTitleId = 'solicitudes-add-module-modal-title';
  protected readonly addModuleModalDescriptionId = 'solicitudes-add-module-modal-description';
  protected readonly manualModuleInput = signal('');
  protected readonly queuedManualModuleEntries = signal<ManualModuleEntryDraft[]>([]);

  readonly suggestedModules = input<SuggestedModuleOption[]>([]);
  readonly selectedSuggested = input<string[]>([]);
  readonly requestedModules = input<RequestedModule[]>([]);
  readonly hasEstudiosAportados = input(false);

  readonly toggleSuggested = output<{ value: string; checked: boolean }>();
  readonly addManualModuleEntries = output<ManualModuleEntryDraft[]>();
  readonly removeRequested = output<RequestedModule>();
  protected readonly requestedSuggestedModules = computed(() =>
    this.requestedModules().filter((item) => item.source === 'suggested')
  );
  protected readonly requestedManualModules = computed(() =>
    this.requestedModules().filter((item) => item.source === 'manual')
  );
  protected readonly canQueueManualModuleFromInput = computed(
    () => this.manualModuleInput().trim().length > 0
  );
  protected readonly canConfirmAddModuleModal = computed(() => {
    return this.queuedManualModuleEntries().length > 0;
  });

  // Indica si una sugerencia está actualmente seleccionada.
  protected isSuggestedSelected(value: string): boolean {
    return this.selectedSuggested().includes(value);
  }

  // Emite el cambio de estado (marcado/no marcado) de una sugerencia.
  protected handleSuggestedToggle(value: string, event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.toggleSuggested.emit({ value, checked });
  }

  // Controla el input manual de módulo dentro del modal.
  protected handleManualModuleInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.manualModuleInput.set(value);
  }

  // Abre el modal de agregar módulo y reinicia su estado temporal.
  protected openAddModuleModal(): void {
    this.resetAddModuleModalState();
    this.addModuleModalOpen.set(true);
  }

  // Cierra el modal y limpia el estado temporal sin persistir.
  protected closeAddModuleModal(): void {
    if (!this.addModuleModalOpen()) return;
    this.resetAddModuleModalState();
    this.addModuleModalOpen.set(false);
  }

  // Añade el módulo escrito a la cola de previsualización.
  protected queueManualModuleFromInput(): void {
    if (!this.canQueueManualModuleFromInput()) return;
    const nombre = this.manualModuleInput().trim();
    this.queuedManualModuleEntries.update((entries) => [...entries, { nombre }]);
    this.manualModuleInput.set('');
  }

  // Quita un módulo manual acumulado en la previsualización del modal.
  protected removeQueuedManualModuleEntry(index: number): void {
    this.queuedManualModuleEntries.update((entries) =>
      entries.filter((_, current) => current !== index)
    );
  }

  // Confirma el alta en lote de módulos manuales desde el modal.
  protected confirmAddModuleModal(): void {
    if (!this.canConfirmAddModuleModal()) return;

    const manualToAdd = this.queuedManualModuleEntries().map((entry) => ({ ...entry }));
    if (manualToAdd.length) {
      this.addManualModuleEntries.emit(manualToAdd);
    }

    this.addModuleModalOpen.set(false);
    this.resetAddModuleModalState();
  }

  @HostListener('document:keydown.escape')
  // Cierra el modal al pulsar Escape.
  protected onEscapeKey(): void {
    if (!this.addModuleModalOpen()) return;
    this.closeAddModuleModal();
  }

  // Solicita eliminar una solicitud del listado final.
  protected removeRequestedModule(item: RequestedModule): void {
    this.removeRequested.emit(item);
  }

  // Formatea el tipo de estudio para mostrarlo en tabla.
  protected getRequestedTipoDisplay(tipo: string): string {
    const value = tipo.trim();
    if (!value) return '—';
    if (value === 'Universitarios') return 'Estudios universitarios';
    if (value === 'Otros') return 'Otros estudios';
    return value;
  }

  // Normaliza y formatea el grado para mostrarlo en texto legible.
  protected getRequestedGradoDisplay(grado: string): string {
    const value = grado.trim();
    if (!value) return '—';
    const key = this.normalizeChipValue(value);
    if (key === 'gb' || key.includes('basico') || key.includes('basica')) return 'Grado básico';
    if (key === 'gm' || key.includes('medio') || key.includes('media')) return 'Grado medio';
    if (key === 'gs' || key.includes('superior')) return 'Grado superior';
    if (key === 'ce' || key.includes('especializacion') || key.includes('especialista')) {
      return 'Curso de especialización';
    }
    return value;
  }

  // Devuelve un valor de tabla con fallback cuando está vacío.
  protected getRequestedValue(value: string): string {
    const normalized = value.trim();
    return normalized || '—';
  }

  // Devuelve el texto final del módulo solicitado.
  protected getRequestedModuloDisplay(item: RequestedModule): string {
    return item.nombre.trim() || 'Sin módulo';
  }

  // Devuelve los textos de origen de la solicitud para mostrarlos en tabla.
  protected getRequestedOrigenes(item: RequestedModule): string[] {
    const originList = (item.origenes ?? [])
      .map((origen) => origen.trim())
      .filter((origen) => origen.length > 0);
    if (originList.length) return originList;
    return item.source === 'manual' ? ['Añadido manualmente'] : ['Sin origen identificado'];
  }

  // Normaliza un texto para comparaciones sin tildes y en minúsculas.
  private normalizeChipValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // Reinicia todos los datos temporales del modal de agregar.
  private resetAddModuleModalState(): void {
    this.manualModuleInput.set('');
    this.queuedManualModuleEntries.set([]);
  }
}
