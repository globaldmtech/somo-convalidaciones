import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DocumentoEntry, DocumentoTipo } from '../formulario-oficial.types';

@Component({
  selector: 'app-documentacion',
  templateUrl: './documentacion.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentacionComponent {
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
  readonly addDoc = output<{ file: File | null; tipo: DocumentoTipo }>();
  readonly removeDoc = output<string>();
  protected readonly selectedAdditionalTipo = signal<DocumentoTipo>('');

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

  protected handleAdditionalTipoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.selectedAdditionalTipo.set(value as DocumentoTipo);
  }

  protected canAttachAdditional(): boolean {
    return Boolean(this.selectedAdditionalTipo());
  }

  protected handleAdditionalDocAdd(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      if (input) input.value = '';
      return;
    }
    const tipo = this.selectedAdditionalTipo();
    if (!tipo) {
      if (input) input.value = '';
      return;
    }
    this.addDoc.emit({ file, tipo });
    this.selectedAdditionalTipo.set('');
    if (input) {
      input.value = '';
    }
  }

  protected formatDocName(entry: DocumentoEntry): string {
    return entry.fileName?.trim() || 'Documento sin nombre';
  }

  protected formatDocTipo(tipo: DocumentoTipo): string {
    if (tipo === 'cert') return 'Certificación académica oficial';
    if (tipo === 'acred') return 'Acreditación laboral';
    if (tipo === 'justif') return 'Documento justificativo';
    return 'Sin tipo';
  }
}
