import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ManualModuleDraft, RequestedModule } from '../formulario-oficial.types';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudesComponent {
  readonly suggestedModules = input<string[]>([]);
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

  protected addManualModule(): void {
    this.addManual.emit();
  }

  protected removeRequestedModule(item: RequestedModule): void {
    this.removeRequested.emit(item);
  }
}
