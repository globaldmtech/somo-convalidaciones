import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DocumentoEntry } from '../formulario-oficial.types';

@Component({
  selector: 'app-documentacion',
  templateUrl: './documentacion.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentacionComponent {
  protected readonly additionalModalTitleId = 'add-additional-doc-modal-title';
  protected readonly additionalModalDescriptionId = 'add-additional-doc-modal-description';
  readonly docEntries = input<DocumentoEntry[]>([]);
  readonly dniModeSingle = input(true);
  readonly dniSingleAttached = input(false);
  readonly dniFrontAttached = input(false);
  readonly dniBackAttached = input(false);
  readonly dniSingleFileName = input('');
  readonly dniFrontFileName = input('');
  readonly dniBackFileName = input('');

  readonly dniModeChange = output<boolean>();
  readonly dniSingleChange = output<File | null>();
  readonly dniFrontChange = output<File | null>();
  readonly dniBackChange = output<File | null>();
  readonly addDoc = output<{ file: File | null; titulo: string }>();
  readonly removeDoc = output<string>();
  protected readonly additionalModalOpen = signal(false);
  protected readonly additionalDocTitle = signal('');
  protected readonly additionalDocFile = signal<File | null>(null);

  protected handleDniModeToggle(event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.dniModeChange.emit(checked);
  }

  protected handleDniSingleChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    this.dniSingleChange.emit(file);
    if (input) {
      input.value = '';
    }
  }

  protected handleDniSingleRemove(): void {
    this.dniSingleChange.emit(null);
  }

  protected handleDniFrontChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    this.dniFrontChange.emit(file);
    if (input) {
      input.value = '';
    }
  }

  protected handleDniFrontRemove(): void {
    this.dniFrontChange.emit(null);
  }

  protected handleDniBackChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    this.dniBackChange.emit(file);
    if (input) {
      input.value = '';
    }
  }

  protected handleDniBackRemove(): void {
    this.dniBackChange.emit(null);
  }

  protected handleAdditionalTitleChange(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.additionalDocTitle.set(value);
  }

  protected openAdditionalModal(): void {
    this.resetAdditionalDraft();
    this.additionalModalOpen.set(true);
  }

  protected closeAdditionalModal(): void {
    this.additionalModalOpen.set(false);
    this.resetAdditionalDraft();
  }

  protected canAttachAdditional(): boolean {
    return this.additionalDocTitle().trim().length > 0;
  }

  protected handleAdditionalDocAdd(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      if (input) input.value = '';
      return;
    }
    if (!this.canAttachAdditional()) {
      if (input) input.value = '';
      return;
    }
    this.additionalDocFile.set(file);
    if (input) {
      input.value = '';
    }
  }

  protected removeAdditionalDocDraft(): void {
    this.additionalDocFile.set(null);
  }

  protected canConfirmAdditionalDoc(): boolean {
    return this.canAttachAdditional() && Boolean(this.additionalDocFile());
  }

  protected confirmAdditionalDoc(): void {
    const file = this.additionalDocFile();
    const titulo = this.additionalDocTitle().trim();
    if (!file || !titulo) return;
    this.addDoc.emit({ file, titulo });
    this.closeAdditionalModal();
  }

  private resetAdditionalDraft(): void {
    this.additionalDocTitle.set('');
    this.additionalDocFile.set(null);
  }
}
