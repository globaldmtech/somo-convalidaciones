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

  protected isSuggestedSelected(value: string): boolean {
    return this.selectedSuggested().includes(value);
  }

  protected handleSuggestedToggle(value: string, event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.toggleSuggested.emit({ value, checked });
  }

  protected handleManualDraftChange(key: keyof ManualModuleDraft, event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.manualDraftChange.emit({ key, value });
  }

  protected openManualModal(): void {
    this.manualModalOpen.set(true);
  }

  protected closeManualModal(): void {
    if (!this.manualModalOpen()) return;
    this.manualModalOpen.set(false);
  }

  protected confirmManualModal(): void {
    if (!this.canAddManual()) return;
    this.addManual.emit();
    this.manualModalOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.manualModalOpen()) return;
    this.closeManualModal();
  }

  protected removeRequestedModule(item: RequestedModule): void {
    this.removeRequested.emit(item);
  }

  protected getRequestedTitle(item: RequestedModule): string {
    const familia = item.familia.trim();
    if (familia) return familia;
    return item.nombre.trim() || 'Sin módulo';
  }

  protected getRequestedDetail(item: RequestedModule): string {
    const parts = [item.ciclo, item.nombre]
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const base = parts.length ? parts.join(' · ') : item.nombre.trim() || 'Sin detalle';
    const code = item.codigo?.trim();
    if (!code) return base;
    return `${base} · Código ${code}`;
  }

  protected getTipoChipLabel(tipo: string): string {
    const value = tipo.trim();
    if (!value) return '—';
    if (value === 'Universitarios') return 'UNIV';
    if (value === 'Otros') return 'OTROS';
    return value;
  }

  protected getGradoChipLabel(grado: string): string {
    const key = this.normalizeChipValue(grado);
    if (!key) return '—';
    if (key === 'gb' || key.includes('basico') || key.includes('basica')) return 'GB';
    if (key === 'gm' || key.includes('medio') || key.includes('media')) return 'GM';
    if (key === 'gs' || key.includes('superior')) return 'GS';
    if (
      key === 'ce' ||
      key.includes('especializacion') ||
      key.includes('especialista')
    ) {
      return 'CE';
    }
    return '—';
  }

  private normalizeChipValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
