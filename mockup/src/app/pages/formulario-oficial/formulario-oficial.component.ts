import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { DbService } from '../../core/db.service';
import { CatalogRow, ConvalidacionRow } from '../../core/models';

type FilterKey = 'grado' | 'familia' | 'ciclo' | 'modulo';

type Normativa = 'LOGSE' | 'LOE' | '';

type EstudiosTipo = 'LOGSE' | 'LOE' | 'Universitarios' | 'Otros' | '';

type EstudioEntry = {
  tipo: EstudiosTipo;
  grado: string;
  familia: string;
  ciclo: string;
  modulo: string;
  descripcion: string;
};

type ManualModuleEntry = {
  id: string;
  nombre: string;
  codigo: string;
};

type RequestedModule = {
  id: string;
  source: 'suggested' | 'manual';
  nombre: string;
  codigo?: string;
};

@Component({
  selector: 'app-formulario-oficial',
  imports: [CommonModule],
  templateUrl: './formulario-oficial.component.html',
  styleUrl: './formulario-oficial.component.css'
})
export class FormularioOficialComponent implements AfterViewInit {
  @ViewChild('signatureCanvas') private signatureCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly rowsSignal = signal<ConvalidacionRow[]>([]);
  private readonly catalogRowsSignal = signal<CatalogRow[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly confirmDialog = signal(false);

  protected readonly formNif = signal('');
  protected readonly formNombre = signal('');
  protected readonly formApellidos = signal('');
  protected readonly formDomicilio = signal('');
  protected readonly formCodigoPostal = signal('');
  protected readonly formLocalidad = signal('');
  protected readonly formProvincia = signal('');
  protected readonly formTelefonoFijo = signal('');
  protected readonly formTelefonoMovil = signal('');
  protected readonly formEmail = signal('');
  protected readonly formCicloMatriculado = signal('');
  protected readonly formNormativa = signal<Normativa>('');
  protected readonly formGradoActual = signal('');
  protected readonly formCurso = signal('');

  protected readonly draftEstudio = signal<EstudioEntry>({
    tipo: '',
    descripcion: '',
    grado: '',
    familia: '',
    ciclo: '',
    modulo: 'Todos'
  });

  protected readonly formEstudios = signal<EstudioEntry[]>([]);

  protected readonly manualModuleDraft = signal({ nombre: '', codigo: '' });
  protected readonly manualModules = signal<ManualModuleEntry[]>([]);
  protected readonly selectedSuggestedModules = signal<string[]>([]);

  protected readonly docDni = signal(false);
  protected readonly docCert = signal(false);
  protected readonly docAcred = signal(false);
  protected readonly docJustif = signal(false);

  protected readonly formFecha = signal('');
  protected readonly signatureDataUrl = signal<string | null>(null);
  protected readonly signatureHasInk = signal(false);

  protected readonly suggestedModules = computed(() => this.buildSuggestedModules());
  protected readonly requestedModules = computed(() => this.buildRequestedModules());
  protected readonly canAddEstudio = computed(() => this.isEstudioEntryComplete(this.draftEstudio()));
  protected readonly canAddManualModule = computed(() => this.isManualModuleDraftValid());

  protected readonly isFormValid = computed(() => {
    const personalOk = [
      this.formNif(),
      this.formNombre(),
      this.formApellidos(),
      this.formDomicilio(),
      this.formCodigoPostal(),
      this.formLocalidad(),
      this.formProvincia(),
      this.formTelefonoMovil(),
      this.formEmail()
    ].every((value) => value.trim().length > 0);

    const academicOk = [
      this.formCicloMatriculado(),
      this.formNormativa(),
      this.formGradoActual(),
      this.formCurso()
    ].every((value) => String(value).trim().length > 0);

    const estudios = this.formEstudios();
    const estudiosOk = estudios.length > 0 && estudios.every((entry) => this.isEstudioEntryComplete(entry));

    const requiresCode = this.formNormativa() === 'LOE';
    const manualOk = this.manualModules().every(
      (row) => row.nombre.trim().length > 0 && (!requiresCode || row.codigo.trim().length > 0)
    );
    const modulosOk =
      this.selectedSuggestedModules().length + this.manualModules().length > 0 && manualOk;

    const docsOk = this.docDni() && (this.docCert() || this.docAcred() || this.docJustif());

    const signatureOk = Boolean(this.signatureDataUrl());

    const fechaOk = Boolean(this.formFecha());

    return personalOk && academicOk && estudiosOk && modulosOk && docsOk && signatureOk && fechaOk;
  });

  private drawing = false;
  private ctx?: CanvasRenderingContext2D | null;
  private strokeDrawn = false;
  private manualModuleSequence = 0;

  constructor(private readonly db: DbService) {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initSignatureCanvas();
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected trackByRequestedId(_: number, item: RequestedModule): string {
    return item.id;
  }

  protected addEstudioRow(): void {
    const entry = this.draftEstudio();
    if (!this.isEstudioEntryComplete(entry)) return;
    this.formEstudios.update((rows) => [...rows, { ...entry }]);
    this.resetDraftEstudio(entry.tipo);
  }

  protected removeEstudioRow(index: number): void {
    this.formEstudios.update((rows) => rows.filter((_, current) => current !== index));
  }

  protected updateEstudioField(key: keyof EstudioEntry, value: string): void {
    this.draftEstudio.update((row) => ({ ...row, [key]: value }));
  }

  protected onTipoChange(event: Event): void {
    const value = this.readValue(event) as EstudiosTipo;
    this.resetDraftEstudio(value);
  }

  protected onEstudioSelectChange(key: FilterKey, event: Event): void {
    const value = this.readValue(event);
    this.draftEstudio.update((row) => {
      if (key === 'grado') {
        return { ...row, grado: value, familia: '', ciclo: '', modulo: 'Todos' };
      }
      if (key === 'familia') {
        return { ...row, familia: value, ciclo: '', modulo: 'Todos' };
      }
      if (key === 'ciclo') {
        return { ...row, ciclo: value, modulo: 'Todos' };
      }
      return { ...row, modulo: value };
    });
  }

  protected addManualModule(): void {
    if (!this.isManualModuleDraftValid()) return;
    const draft = this.manualModuleDraft();
    const entry: ManualModuleEntry = {
      id: this.nextManualModuleId(),
      nombre: draft.nombre.trim(),
      codigo: draft.codigo.trim()
    };
    this.manualModules.update((rows) => [...rows, entry]);
    this.manualModuleDraft.set({ nombre: '', codigo: '' });
  }

  protected updateManualModuleDraft(key: 'nombre' | 'codigo', value: string): void {
    this.manualModuleDraft.update((draft) => ({ ...draft, [key]: value }));
  }

  protected toggleSuggestedModule(value: string, event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.selectedSuggestedModules.update((items) => {
      if (checked) {
        return items.includes(value) ? items : [...items, value];
      }
      return items.filter((item) => item !== value);
    });
  }

  protected isSuggestedSelected(value: string): boolean {
    return this.selectedSuggestedModules().includes(value);
  }

  protected removeRequestedModule(item: RequestedModule): void {
    if (item.source === 'suggested') {
      this.selectedSuggestedModules.update((items) => items.filter((entry) => entry !== item.nombre));
      return;
    }
    this.manualModules.update((rows) => rows.filter((row) => row.id !== item.id));
  }

  protected onNormativaChange(event: Event): void {
    this.formNormativa.set(this.parseNormativa(this.readValue(event)));
  }

  protected onGradoActualChange(event: Event): void {
    const value = this.readValue(event);
    this.formGradoActual.set(value);
    if (this.isCursoEspecializacion(value)) {
      this.formCurso.set('1º');
    }
  }

  protected onSignaturePointerDown(event: PointerEvent): void {
    if (!this.ctx) return;
    this.drawing = true;
    this.strokeDrawn = false;
    this.ctx.beginPath();
    this.ctx.moveTo(event.offsetX, event.offsetY);
  }

  protected onSignaturePointerMove(event: PointerEvent): void {
    if (!this.ctx || !this.drawing) return;
    this.ctx.lineTo(event.offsetX, event.offsetY);
    this.ctx.stroke();
    this.strokeDrawn = true;
    this.signatureHasInk.set(true);
  }

  protected onSignaturePointerUp(): void {
    if (!this.ctx) return;
    this.drawing = false;
    if (!this.strokeDrawn) return;
    this.signatureDataUrl.set(this.signatureCanvas?.nativeElement.toDataURL('image/png') ?? null);
  }

  protected clearSignature(): void {
    if (!this.ctx || !this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.signatureDataUrl.set(null);
    this.signatureHasInk.set(false);
  }

  protected onSignatureUpload(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.signatureDataUrl.set(result);
      this.signatureHasInk.set(Boolean(result));
      if (result) {
        this.drawSignatureImage(result);
      }
    };
    reader.readAsDataURL(file);
  }

  protected onDocToggle(key: 'dni' | 'cert' | 'acred' | 'justif', event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const checked = Boolean(target?.checked);
    switch (key) {
      case 'dni':
        this.docDni.set(checked);
        break;
      case 'cert':
        this.docCert.set(checked);
        break;
      case 'acred':
        this.docAcred.set(checked);
        break;
      case 'justif':
        this.docJustif.set(checked);
        break;
    }
  }

  protected onDocOptionChange(event: Event): void {
    const value = this.readValue(event);
    this.docCert.set(value === 'cert');
    this.docAcred.set(value === 'acred');
    this.docJustif.set(value === 'justif');
  }



  // TODO: Provisional. Simula documentación aportada hasta implementar la carga real de archivos.
  protected onDocsTodoToggle(event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.docDni.set(checked);
    this.docCert.set(false);
    this.docAcred.set(false);
    this.docJustif.set(false);
    if (checked) {
      this.docAcred.set(true);
    }
  }


  
  protected selectedDocOption(): string {
    if (this.docCert()) return 'cert';
    if (this.docAcred()) return 'acred';
    if (this.docJustif()) return 'justif';
    return '';
  }

  protected submitForm(): void {
    if (!this.isFormValid()) return;
    this.submitted.set(true);
  }

  protected requestSubmit(): void {
    if (!this.isFormValid()) return;
    this.confirmDialog.set(true);
  }

  protected cancelSubmit(): void {
    this.confirmDialog.set(false);
  }

  protected confirmSubmit(): void {
    if (!this.isFormValid()) return;
    this.submitForm();
    this.confirmDialog.set(false);
  }

  protected formatGrade(value: string | null): string {
    if (!value) return 'Sin grado';
    if (value === 'GM') return 'GM · Grado medio';
    if (value === 'GS') return 'GS · Grado superior';
    return value;
  }

  protected isCatalogTipo(tipo: EstudiosTipo): boolean {
    return tipo === 'LOGSE' || tipo === 'LOE';
  }

  protected isDescripcionRequired(tipo: EstudiosTipo): boolean {
    return tipo === 'Universitarios' || tipo === 'Otros';
  }

  protected isCursoEspecializacion(grado: string): boolean {
    return this.normalizeKey(grado) === 'curso de especializacion';
  }

  protected readValue(event: Event): string {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    return target?.value ?? '';
  }

  protected getEstudioFamiliaOptions(): string[] {
    const entry = this.draftEstudio();
    if (!entry.grado) return [];
    return this.buildFormCatalogOptions('familia', {
      grado: entry.grado,
      familia: entry.familia,
      ciclo: entry.ciclo
    });
  }

  protected getEstudioCicloOptions(): string[] {
    const entry = this.draftEstudio();
    if (!entry.grado || !entry.familia) return [];
    return this.buildFormCatalogOptions('ciclo', {
      grado: entry.grado,
      familia: entry.familia,
      ciclo: entry.ciclo
    });
  }

  protected getEstudioModuloOptions(): string[] {
    const entry = this.draftEstudio();
    if (!entry.ciclo) return [];
    return this.buildFormModuleOptions({
      grado: entry.grado,
      familia: entry.familia,
      ciclo: entry.ciclo,
      modulo: entry.modulo
    });
  }

  protected buildCatalogOptions(key: 'grado' | 'familia' | 'ciclo'): string[] {
    const rows = this.catalogRowsSignal();
    const values = new Set<string>();
    rows.forEach((row) => values.add(row[key]));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildFormCatalogOptions(
    key: 'familia' | 'ciclo',
    filters: { grado: string; familia: string; ciclo: string }
  ): string[] {
    const rows = this.catalogRowsSignal().filter((row) => {
      if (filters.grado && row.grado !== filters.grado) return false;
      if (key === 'ciclo' && filters.familia && row.familia !== filters.familia) return false;
      if (key === 'familia' && filters.grado && row.grado !== filters.grado) return false;
      return true;
    });
    const values = new Set<string>();
    rows.forEach((row) => values.add(row[key]));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildFormModuleOptions(filters: Record<FilterKey, string>): string[] {
    const rows = this.catalogRowsSignal().filter((row) => {
      if (filters.grado && row.grado !== filters.grado) return false;
      if (filters.familia && row.familia !== filters.familia) return false;
      if (filters.ciclo && row.ciclo !== filters.ciclo) return false;
      return true;
    });
    const values = new Set<string>();
    rows.forEach((row) => values.add(row.modulo));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private buildRequestedModules(): RequestedModule[] {
    const suggested = this.selectedSuggestedModules().map((value) => ({
      id: `suggested:${value}`,
      source: 'suggested' as const,
      nombre: value
    }));
    const manual = this.manualModules().map((entry) => ({
      id: entry.id,
      source: 'manual' as const,
      nombre: entry.nombre,
      codigo: entry.codigo
    }));
    return [...suggested, ...manual];
  }

  private buildSuggestedModules(): string[] {
    const values = new Set<string>();
    const estudios = this.formEstudios();

    estudios.forEach((entry) => {
      const hasFilter = Boolean(entry.grado || entry.familia || entry.ciclo || entry.modulo);
      if (!hasFilter) return;
      const filters = {
        grado: entry.grado,
        familia: entry.familia,
        ciclo: entry.ciclo,
        modulo: entry.modulo
      };
      this.rowsSignal().forEach((row) => {
        if (!this.matchesSideFilters(row, 'origen', filters)) return;
        this.splitValues(row.modulo_destino).forEach((value) => values.add(value));
      });
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  private matchesSideFilters(
    row: ConvalidacionRow,
    side: 'origen' | 'destino',
    filters: Record<FilterKey, string>
  ): boolean {
    return (['grado', 'familia', 'ciclo', 'modulo'] as FilterKey[]).every((key) => {
      const value = filters[key];
      if (!value) return true;
      if (key === 'modulo' && value === 'Todos') return true;
      const current = row[`${key}_${side}` as keyof ConvalidacionRow] as string | null;
      return this.listIncludes(current, value);
    });
  }

  private splitValues(value: string | null): string[] {
    if (!value) return [];
    return value
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private normalizeKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private listIncludes(listValue: string | null, target: string): boolean {
    if (!target) return true;
    const normalizedTarget = this.normalizeKey(target);
    return this.splitValues(listValue).some(
      (entry) => this.normalizeKey(entry) === normalizedTarget
    );
  }

  private parseNormativa(value: string): Normativa {
    if (value === 'LOGSE' || value === 'LOE') {
      return value;
    }
    return '';
  }

  private async loadData(): Promise<void> {
    try {
      this.loading.set(true);
      const [catalog, convalidaciones] = await Promise.all([
        this.db.getCatalog(),
        this.db.getConvalidaciones()
      ]);
      this.catalogRowsSignal.set(catalog);
      this.rowsSignal.set(convalidaciones);
    } catch (error) {
      console.error(error);
      this.error.set('No se pudo cargar la base de datos.');
    } finally {
      this.loading.set(false);
    }
  }

  private initSignatureCanvas(): void {
    if (!this.signatureCanvas) return;
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width));
    canvas.height = 200;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#1f2a33';

    const existing = this.signatureDataUrl();
    if (existing) {
      this.signatureHasInk.set(true);
      this.drawSignatureImage(existing);
    }
  }

  private drawSignatureImage(dataUrl: string): void {
    if (!this.ctx || !this.signatureCanvas) return;
    const img = new Image();
    img.onload = () => {
      const canvas = this.signatureCanvas?.nativeElement;
      if (!canvas || !this.ctx) return;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  }

  private resetDraftEstudio(tipo: EstudiosTipo): void {
    if (!this.isCatalogTipo(tipo)) {
      this.draftEstudio.set({
        tipo,
        descripcion: '',
        grado: '',
        familia: '',
        ciclo: '',
        modulo: ''
      });
      return;
    }
    this.draftEstudio.set({
      tipo,
      descripcion: '',
      grado: '',
      familia: '',
      ciclo: '',
      modulo: 'Todos'
    });
  }

  private isManualModuleDraftValid(): boolean {
    const draft = this.manualModuleDraft();
    const requiresCode = this.formNormativa() === 'LOE';
    return (
      draft.nombre.trim().length > 0 &&
      (!requiresCode || draft.codigo.trim().length > 0)
    );
  }

  private nextManualModuleId(): string {
    this.manualModuleSequence += 1;
    return `manual-${this.manualModuleSequence}`;
  }

  private isEstudioEntryComplete(entry: EstudioEntry): boolean {
    if (!entry.tipo) return false;
    if (this.isCatalogTipo(entry.tipo)) {
      return Boolean(entry.grado && entry.familia && entry.ciclo && entry.modulo);
    }
    return entry.descripcion.trim().length > 0;
  }

  protected previewValue(value: string, fallback: string): string {
    return value?.trim() ? value : fallback;
  }

  protected previewGrado(entry: EstudioEntry): string {
    if (!entry.grado) return 'Grado';
    return this.formatGrade(entry.grado);
  }

}
