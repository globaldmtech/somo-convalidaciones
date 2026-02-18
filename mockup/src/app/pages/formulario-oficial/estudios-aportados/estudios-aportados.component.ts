import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { EstudioEntry, EstudiosTipo, FilterKey } from '../formulario-oficial.types';

@Component({
  selector: 'app-estudios-aportados',
  templateUrl: './estudios-aportados.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstudiosAportadosComponent {
  protected readonly selectFieldClass =
    'grid gap-2 text-sm text-slate-600 min-w-0 w-full [&>select]:w-full [&>select]:min-w-0 [&>select]:max-w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:px-3 [&>select]:py-2 [&>select]:text-[0.95rem] [&>select]:text-slate-800 [&>select]:box-border [&>select]:disabled:bg-slate-100 [&>select]:disabled:text-slate-400 [&>select]:disabled:cursor-not-allowed [&>select]:disabled:border-slate-200';
  protected readonly addModalTitleId = 'estudios-add-modal-title';
  protected readonly addModalDescriptionId = 'estudios-add-modal-description';
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
  protected readonly addModalOpen = signal(false);

  protected openAddEstudioModal(): void {
    this.addModalOpen.set(true);
  }

  protected closeAddEstudioModal(): void {
    if (!this.addModalOpen()) return;
    this.addModalOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.addModalOpen()) return;
    this.closeAddEstudioModal();
  }

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

  protected confirmAddEstudio(): void {
    if (!this.canAdd()) return;
    this.addEstudio.emit();
    this.addModalOpen.set(false);
  }

  protected removeEstudioAt(index: number): void {
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

  protected getEstudioTitle(entry: EstudioEntry): string {
    if (this.isCatalogTipo(entry.tipo)) {
      const familia = entry.familia.trim();
      return familia || 'Sin familia';
    }
    return entry.tipo === 'Universitarios' ? 'Estudios universitarios' : 'Otros estudios';
  }

  protected getEstudioDetail(entry: EstudioEntry): string {
    if (this.isCatalogTipo(entry.tipo)) {
      const parts = [entry.ciclo, entry.modulo]
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      return parts.length ? parts.join(' · ') : 'Sin detalle';
    }
    const descripcion = entry.descripcion.trim();
    return descripcion || 'Sin descripción';
  }

  protected getEstudioChipLabel(tipo: EstudiosTipo): string {
    if (!tipo) return '—';
    if (tipo === 'Universitarios') return 'UNIV';
    if (tipo === 'Otros') return 'OTROS';
    return tipo;
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

  protected formatGrade(value: string | null): string {
    if (!value) return 'Sin grado';
    if (value === 'GB') return 'GB · Grado básico';
    if (value === 'GM') return 'GM · Grado medio';
    if (value === 'GS') return 'GS · Grado superior';
    if (value === 'CE') return 'CE · Curso de especialización';
    return value;
  }

  protected getEstudioTipoDisplay(entry: EstudioEntry): string {
    const tipo = entry.tipo.trim();
    if (!tipo) return '—';
    if (tipo === 'Universitarios') return 'Estudios universitarios';
    if (tipo === 'Otros') return 'Otros estudios';
    return tipo;
  }

  protected getEstudioGradoDisplay(entry: EstudioEntry): string {
    if (!this.isCatalogTipo(entry.tipo)) return '—';
    const grado = entry.grado.trim();
    return grado ? this.formatGrade(grado) : '—';
  }

  protected getEstudioValue(value: string): string {
    const normalized = value.trim();
    return normalized || '—';
  }

  protected getEstudioModuloDisplay(entry: EstudioEntry): string {
    if (this.isCatalogTipo(entry.tipo)) {
      return this.getEstudioValue(entry.modulo);
    }
    const descripcion = entry.descripcion.trim();
    return descripcion || '—';
  }

  private normalizeChipValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
