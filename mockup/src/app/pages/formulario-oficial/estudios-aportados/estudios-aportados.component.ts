import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EstudioEntry, EstudiosTipo, FilterKey } from '../formulario-oficial.types';

@Component({
  selector: 'app-estudios-aportados',
  templateUrl: './estudios-aportados.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstudiosAportadosComponent {
  readonly draft = input.required<EstudioEntry>();
  readonly estudios = input<EstudioEntry[]>([]);
  readonly canAdd = input(false);
  readonly gradoOptions = input<string[]>([]);
  readonly familiaOptions = input<string[]>([]);
  readonly cicloOptions = input<string[]>([]);
  readonly moduloOptions = input<string[]>([]);

  readonly tipoChange = output<EstudiosTipo>();
  readonly selectChange = output<{ key: FilterKey; value: string }>();
  readonly fieldChange = output<{ key: keyof EstudioEntry; value: string }>();
  readonly addEstudio = output<void>();
  readonly removeEstudio = output<number>();

  protected handleTipoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.tipoChange.emit(value as EstudiosTipo);
  }

  protected handleSelectChange(key: FilterKey, event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.selectChange.emit({ key, value });
  }

  protected handleDescripcionChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? '';
    this.fieldChange.emit({ key: 'descripcion', value });
  }

  protected addEstudioRow(): void {
    this.addEstudio.emit();
  }

  protected removeEstudioRow(index: number): void {
    this.removeEstudio.emit(index);
  }

  protected isCatalogTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  protected isDescripcionRequired(tipo: EstudiosTipo): boolean {
    return tipo === 'Universitarios' || tipo === 'Otros';
  }

  protected previewValue(value: string, fallback: string): string {
    return value?.trim() ? value : fallback;
  }

  protected previewGrado(entry: EstudioEntry): string {
    if (!entry.grado) return 'Grado';
    return this.formatGrade(entry.grado);
  }

  protected formatGrade(value: string | null): string {
    if (!value) return 'Sin grado';
    if (value === 'GM') return 'GM · Grado medio';
    if (value === 'GS') return 'GS · Grado superior';
    return value;
  }
}
