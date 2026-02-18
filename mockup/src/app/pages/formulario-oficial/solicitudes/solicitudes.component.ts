import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { ManualModuleDraft, RequestedModule, SuggestedModuleOption } from '../formulario-oficial.types';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudesComponent {
  protected readonly manualModalOpen = signal(false);
  protected readonly manualModalTitleId = 'solicitudes-manual-modal-title';
  protected readonly manualModalDescriptionId = 'solicitudes-manual-modal-description';
  readonly suggestedModules = input<SuggestedModuleOption[]>([]);
  readonly selectedSuggested = input<string[]>([]);
  readonly manualDraft = input.required<ManualModuleDraft>();
  readonly canAddManual = input(false);
  readonly requestedModules = input<RequestedModule[]>([]);

  readonly toggleSuggested = output<{ value: string; checked: boolean }>();
  readonly manualDraftChange = output<{ key: keyof ManualModuleDraft; value: string }>();
  readonly addManual = output<void>();
  readonly removeRequested = output<RequestedModule>();

  // Indica si una sugerencia está actualmente seleccionada.
  protected isSuggestedSelected(value: string): boolean {
    return this.selectedSuggested().includes(value);
  }

  // Emite el cambio de estado (marcado/no marcado) de una sugerencia.
  protected handleSuggestedToggle(value: string, event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.toggleSuggested.emit({ value, checked });
  }

  // Emite cambios en el borrador de módulo manual.
  protected handleManualDraftChange(key: keyof ManualModuleDraft, event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.manualDraftChange.emit({ key, value });
  }

  // Abre el modal para agregar un módulo manual.
  protected openManualModal(): void {
    this.manualModalOpen.set(true);
  }

  // Cierra el modal de módulo manual.
  protected closeManualModal(): void {
    if (!this.manualModalOpen()) return;
    this.manualModalOpen.set(false);
  }

  // Confirma el alta del módulo manual desde el modal.
  protected confirmManualModal(): void {
    if (!this.canAddManual()) return;
    this.addManual.emit();
    this.manualModalOpen.set(false);
  }

  // Cierra el modal al pulsar Escape.
  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.manualModalOpen()) return;
    this.closeManualModal();
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

  // Devuelve el texto final del módulo solicitado con código si existe.
  protected getRequestedModuloDisplay(item: RequestedModule): string {
    const base = item.nombre.trim() || 'Sin módulo';
    const code = item.codigo?.trim();
    if (!code) return base;
    return `${base} · Código ${code}`;
  }

  // Normaliza un texto para comparaciones sin tildes y en minúsculas.
  private normalizeChipValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
