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

  // Abre el modal para agregar un nuevo estudio.
  protected openAddEstudioModal(): void {
    this.addModalOpen.set(true);
  }

  // Cierra el modal de alta de estudios.
  protected closeAddEstudioModal(): void {
    if (!this.addModalOpen()) return;
    this.addModalOpen.set(false);
  }

  // Cierra el modal de estudios al pulsar la tecla Escape.
  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (!this.addModalOpen()) return;
    this.closeAddEstudioModal();
  }

  // Emite el cambio del tipo de estudio seleccionado.
  protected handleTipoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.tipoChange.emit(value as EstudiosTipo);
  }

  // Emite el cambio de un select dependiente del estudio.
  protected handleSelectChange(key: FilterKey, event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.selectChange.emit({ key, value });
  }

  // Emite la descripción libre para estudios no catalogados.
  protected handleDescripcionChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? '';
    this.fieldChange.emit({ key: 'descripcion', value });
  }

  // Confirma el alta del estudio en el modal.
  protected confirmAddEstudio(): void {
    if (!this.canAdd()) return;
    this.addEstudio.emit();
    this.addModalOpen.set(false);
  }

  // Solicita eliminar un estudio del listado por índice.
  protected removeEstudioAt(index: number): void {
    this.removeEstudio.emit(index);
  }

  // Comprueba si el tipo de estudio usa catálogo (LOE/LOGSE).
  protected isCatalogTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  // Indica si el tipo de estudio requiere descripción manual.
  protected isDescripcionRequired(tipo: EstudiosTipo): boolean {
    return tipo === 'Universitarios' || tipo === 'Otros';
  }

  // Devuelve un valor visible o un fallback para la previsualización.
  protected previewValue(value: string, fallback: string): string {
    return value?.trim() ? value : fallback;
  }

  // Devuelve el grado formateado para la previsualización del modal.
  protected previewGrado(entry: EstudioEntry): string {
    if (!entry.grado) return 'Grado';
    return this.formatGrade(entry.grado);
  }

  // Construye el título principal de una fila de estudio.
  protected getEstudioTitle(entry: EstudioEntry): string {
    if (this.isCatalogTipo(entry.tipo)) {
      const familia = entry.familia.trim();
      return familia || 'Sin familia';
    }
    return entry.tipo === 'Universitarios' ? 'Estudios universitarios' : 'Otros estudios';
  }

  // Construye el detalle secundario de una fila de estudio.
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

  // Devuelve la etiqueta abreviada del tipo de estudio.
  protected getEstudioChipLabel(tipo: EstudiosTipo): string {
    if (!tipo) return '—';
    if (tipo === 'Universitarios') return 'UNIV';
    if (tipo === 'Otros') return 'OTROS';
    return tipo;
  }

  // Devuelve la etiqueta abreviada del grado.
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
    if (!this.isCatalogTipo(entry.tipo)) return '—';
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
    if (this.isCatalogTipo(entry.tipo)) {
      return this.getEstudioValue(entry.modulo);
    }
    const descripcion = entry.descripcion.trim();
    return descripcion || '—';
  }

  // Normaliza texto para comparaciones de abreviaturas y chips.
  private normalizeChipValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
