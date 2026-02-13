import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { DocumentoEntry, DocumentoTipo, EstudioEntry } from '../formulario-oficial.types';

@Component({
  selector: 'app-documentacion',
  templateUrl: './documentacion.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentacionComponent {
  readonly estudios = input<EstudioEntry[]>([]);
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
  readonly addDocForStudy = output<{ studyIndex: number; file: File | null; tipo: DocumentoTipo }>();
  readonly removeDoc = output<string>();
  readonly docTypeChange = output<{ id: string; value: DocumentoTipo }>();
  readonly docStudyToggle = output<{ id: string; studyIndex: number; checked: boolean }>();

  protected readonly selectedTipos = signal<Record<number, DocumentoTipo>>({});

  constructor() {
    effect(() => {
      const total = this.estudios().length;
      this.selectedTipos.update((current) => {
        const next = { ...current };
        Object.keys(next).forEach((key) => {
          if (Number(key) >= total) {
            delete next[key as unknown as number];
          }
        });
        return next;
      });
    });
  }

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

  protected handleGlobalTipoChange(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.selectedTipos.update((current) => {
      const next = { ...current };
      if (value) {
        next[index] = value as DocumentoTipo;
      } else {
        delete next[index];
      }
      return next;
    });
  }

  protected handleStudyDocAdd(studyIndex: number, tipo: DocumentoTipo, event: Event): void {
    if (!tipo) {
      return;
    }
    const input = event.target as HTMLInputElement | null;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    this.addDocForStudy.emit({ studyIndex, file, tipo });
    if (input) {
      input.value = '';
    }
  }

  protected getSelectedTipo(index: number): DocumentoTipo {
    return this.selectedTipos()[index] ?? '';
  }

  protected handleDocTypeChange(id: string, event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.docTypeChange.emit({ id, value: value as DocumentoTipo });
  }

  protected handleStudyToggle(id: string, studyIndex: number, event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.docStudyToggle.emit({ id, studyIndex, checked });
  }

  protected isStudyLinked(entry: DocumentoEntry, index: number): boolean {
    return entry.estudioIndices.includes(index);
  }

  protected docsForStudy(index: number): DocumentoEntry[] {
    return this.docEntries().filter((entry) => entry.estudioIndices.includes(index));
  }

  protected formatDocName(entry: DocumentoEntry): string {
    return entry.fileName?.trim() || 'Documento sin nombre';
  }

  protected formatDocTipo(tipo: DocumentoTipo): string {
    if (tipo === 'cert') return 'Certificación académica';
    if (tipo === 'acred') return 'Acreditación laboral';
    if (tipo === 'justif') return 'Documento justificativo';
    return 'Sin tipo';
  }

  protected formatEstudio(entry: EstudioEntry, index: number): string {
    const baseLabel = (() => {
      if (entry.tipo === 'Universitarios' || entry.tipo === 'Otros') {
        return entry.descripcion?.trim() || 'Estudio sin descripción';
      }
      const parts = [entry.grado, entry.ciclo, entry.modulo].filter(Boolean);
      return parts.length ? parts.join(' · ') : 'Estudio sin datos';
    })();
    const tipoLabel = entry.tipo ? `(${entry.tipo})` : '';
    return `${baseLabel} ${tipoLabel}`.trim();
  }
}
