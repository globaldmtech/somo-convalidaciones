import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { ConvalidacionesService } from '../../services/convalidaciones.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Grado, Ciclo, Modulo } from '../../models/catalog.models';

// ── LOE Study entry ──────────────────────────────────────────────────────────
export interface EstudioEntry {
    grado: Grado;
    ciclo: Ciclo;
    modulos: Modulo[];      // selected
    allModulos: Modulo[];   // all available for this ciclo
    allSelected: boolean;
    cicloCompleto: boolean | null;
    notaMediaCiclo: number | null;
    notasPorModulo: Record<number, number | null>;
    resultadosPorModulo: Record<number, string | null>;
}

// ── External certification ───────────────────────────────────────────────────
export interface AcreditacionExterna {
    id: number;
    nombre: string;
    tipo: string;
}

@Component({
    selector: 'app-estudios-cursados',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './estudios-cursados.component.html',
})
export class EstudiosCursadosComponent implements OnInit {

    // ── LOE catalog data ──────────────────────────────────────────────────────
    grados: Grado[] = [];
    ciclos: Ciclo[] = [];
    modulos: Modulo[] = [];

    selectedGradoId: number | null = null;
    selectedCicloId: number | null = null;
    selectedCicloCompleto: boolean | null = null;
    selectedNotaMediaCiclo = '';
    selectedModuloIds: Set<number> = new Set();
    allSelected = false;
    selectedModuloNotas = new Map<number, string>();

    loadingGrados = false;
    loadingCiclos = false;
    loadingModulos = false;

    // LOE studies added
    estudios: EstudioEntry[] = [];
    showForm = true;
    expandedStudios: Set<number> = new Set();
    editingStudios: Set<number> = new Set();
    editDraft: Map<number, Set<number>> = new Map();
    editDraftNotas: Map<number, Map<number, string>> = new Map();
    editDraftCicloCompleto: Map<number, boolean | null> = new Map();
    editDraftNotaMediaCiclo: Map<number, string> = new Map();
    pendingEstudioModalOpen = false;

    // ── Acreditaciones externas ───────────────────────────────────────────────
    acreditacionesCatalog: AcreditacionExterna[] = [];
    loadingAcreditaciones = false;
    acreditacionesAdded: AcreditacionExterna[] = [];
    selectedAcreditacionId: number | string | null = null;
    otrosTexto = '';
    showAcreditacionForm = false;
    otrosCiclosModulosInput = '';
    otrosCiclosModulosAdded: string[] = [];
    showOtrosCiclosModulosForm = false;

    get isOtrosSelected(): boolean {
        return this.selectedAcreditacionId === 'otros';
    }

    @Output() next = new EventEmitter<void>();
    @Output() prev = new EventEmitter<void>();

    constructor(
        private catalogService: CatalogService,
        private convalidacionesService: ConvalidacionesService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadGrados();
        this.loadAcreditacionesExternas();

        // Sync with service
        const estudiosRaw = this.convalidacionesService.getEstudios();
        this.estudios = estudiosRaw.map((estudio) => ({
            ...estudio,
            allSelected: Boolean(estudio.allSelected),
            cicloCompleto: typeof estudio.cicloCompleto === 'boolean' ? estudio.cicloCompleto : null,
            notaMediaCiclo: typeof estudio.notaMediaCiclo === 'number' ? estudio.notaMediaCiclo : null,
            notasPorModulo: this.migrateNotasPorModulo(estudio),
            resultadosPorModulo: this.migrateResultadosPorModulo(estudio),
        }));
        this.acreditacionesAdded = this.convalidacionesService.getAcreditaciones();
        this.otrosCiclosModulosAdded = this.convalidacionesService.getOtrosCiclosModulos();

        if (this.estudios.length > 0) {
            this.showForm = false;
        }
    }

    private syncWithService(): void {
        this.convalidacionesService.setEstudios(this.estudios);
        this.convalidacionesService.setAcreditaciones(this.acreditacionesAdded);
        this.convalidacionesService.setOtrosCiclosModulos(this.otrosCiclosModulosAdded);
    }

    loadAcreditacionesExternas(): void {
        this.loadingAcreditaciones = true;
        this.cdr.detectChanges();
        this.catalogService.getAcreditacionesExternas()
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe({
                next: (data) => {
                    this.acreditacionesCatalog = data;
                    this.loadingAcreditaciones = false;
                    this.cdr.detectChanges();
                },
                error: () => { this.loadingAcreditaciones = false; this.cdr.detectChanges(); }
            });
    }

    // ── LOE methods ───────────────────────────────────────────────────────────
    loadGrados(): void {
        this.loadingGrados = true;
        this.cdr.detectChanges();
        this.catalogService.getGrados()
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe({
                next: (data) => { this.grados = data; this.loadingGrados = false; this.cdr.detectChanges(); },
                error: () => { this.loadingGrados = false; this.cdr.detectChanges(); }
            });
    }

    onGradoChange(): void {
        this.ciclos = [];
        this.modulos = [];
        this.selectedCicloId = null;
        this.selectedCicloCompleto = null;
        this.selectedNotaMediaCiclo = '';
        this.selectedModuloIds.clear();
        this.allSelected = false;

        if (!this.selectedGradoId) return;
        this.loadingCiclos = true;
        this.cdr.detectChanges();
        this.catalogService.getCiclos(Number(this.selectedGradoId))
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe({
                next: (data) => { this.ciclos = data; this.loadingCiclos = false; this.cdr.detectChanges(); },
                error: () => { this.loadingCiclos = false; this.cdr.detectChanges(); }
            });
    }

    onCicloChange(): void {
        this.modulos = [];
        this.selectedModuloIds.clear();
        this.selectedModuloNotas.clear();
        this.allSelected = false;
        this.selectedCicloCompleto = null;
        this.selectedNotaMediaCiclo = '';

        if (!this.selectedCicloId) return;
        this.loadingModulos = true;
        this.cdr.detectChanges();
        this.catalogService.getModulos(Number(this.selectedCicloId))
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe({
                next: (data) => { this.modulos = data; this.loadingModulos = false; this.cdr.detectChanges(); },
                error: () => { this.loadingModulos = false; this.cdr.detectChanges(); }
            });
    }

    toggleModulo(id: number): void {
        if (this.selectedModuloIds.has(id)) {
            this.selectedModuloIds.delete(id);
            this.selectedModuloNotas.delete(id);
        } else {
            this.selectedModuloIds.add(id);
            if (!this.selectedModuloNotas.has(id)) {
                this.selectedModuloNotas.set(id, '');
            }
        }
        this.allSelected = this.modulosActivos.length > 0
            && this.modulosActivos.every((modulo) => this.selectedModuloIds.has(modulo.id));
    }

    toggleAll(): void {
        if (this.allSelected) {
            this.modulosActivos.forEach((modulo) => {
                this.selectedModuloIds.delete(modulo.id);
                this.selectedModuloNotas.delete(modulo.id);
            });
            this.allSelected = false;
        } else {
            this.modulosActivos.forEach(m => {
                this.selectedModuloIds.add(m.id);
                if (!this.selectedModuloNotas.has(m.id)) {
                    this.selectedModuloNotas.set(m.id, '');
                }
            });
            this.allSelected = this.modulosActivos.length > 0;
        }
    }

    isModuloSelected(id: number): boolean {
        return this.selectedModuloIds.has(id);
    }

    addEstudio(): void {
        const grado = this.grados.find(g => g.id === Number(this.selectedGradoId));
        const ciclo = this.ciclos.find(c => c.id === Number(this.selectedCicloId));
        const selectedModulos = this.modulos.filter(m => this.selectedModuloIds.has(m.id));

        if (!grado || !ciclo || selectedModulos.length === 0 || !this.canAddEstudio()) return;

        const esCicloCompleto = selectedModulos.length === this.modulos.length && this.modulos.length > 0;
        const notaMediaCiclo = this.selectedCicloCompleto ? this.parseNotaNumerica(this.selectedNotaMediaCiclo) : null;
        const notasPorModulo: Record<number, number | null> = {};
        const resultadosPorModulo: Record<number, string | null> = {};
        for (const modulo of selectedModulos) {
            const rawValue = this.selectedModuloNotas.get(modulo.id) || '';
            notasPorModulo[modulo.id] = this.parseNotaByModulo(modulo, rawValue);
            resultadosPorModulo[modulo.id] = this.parseResultadoByModulo(modulo, rawValue);
        }

        this.estudios.push({
            grado,
            ciclo,
            modulos: selectedModulos,
            allModulos: [...this.modulos],
            allSelected: esCicloCompleto,
            cicloCompleto: this.selectedCicloCompleto,
            notaMediaCiclo,
            notasPorModulo,
            resultadosPorModulo,
        });

        this.syncWithService();

        this.selectedGradoId = null;
        this.selectedCicloId = null;
        this.selectedCicloCompleto = null;
        this.selectedNotaMediaCiclo = '';
        this.selectedModuloIds.clear();
        this.selectedModuloNotas.clear();
        this.ciclos = [];
        this.modulos = [];
        this.allSelected = false;
        this.showForm = false;
        this.cdr.detectChanges();
    }

    removeEstudio(index: number): void {
        this.estudios.splice(index, 1);
        this.expandedStudios.delete(index);
        this.syncWithService();
        if (this.estudios.length === 0) {
            this.showForm = true;
        }
        this.cdr.detectChanges();
    }

    // ── Edit mode for saved LOE studies ───────────────────────────────────────
    startEdit(index: number): void {
        const estudio = this.estudios[index];
        const draft = new Set(estudio.modulos.map(m => m.id));
        const notas = new Map<number, string>();
        for (const modulo of estudio.modulos) {
            notas.set(modulo.id, this.getStoredInputValue(estudio, modulo));
        }
        this.editDraft.set(index, draft);
        this.editDraftNotas.set(index, notas);
        this.editDraftCicloCompleto.set(index, estudio.cicloCompleto);
        this.editDraftNotaMediaCiclo.set(
            index,
            estudio.cicloCompleto === true && estudio.notaMediaCiclo !== null ? String(estudio.notaMediaCiclo) : ''
        );
        this.editingStudios.add(index);
        this.cdr.detectChanges();
    }

    cancelEdit(index: number): void {
        this.editDraft.delete(index);
        this.editDraftNotas.delete(index);
        this.editDraftCicloCompleto.delete(index);
        this.editDraftNotaMediaCiclo.delete(index);
        this.editingStudios.delete(index);
        this.cdr.detectChanges();
    }

    saveEdit(index: number): void {
        const draft = this.editDraft.get(index);
        const draftNotas = this.editDraftNotas.get(index);
        const draftCicloCompleto = this.editDraftCicloCompleto.get(index);
        const draftNotaMediaCiclo = this.editDraftNotaMediaCiclo.get(index) || '';
        if (!draft || !draftNotas || !this.canSaveEdit(index)) return;
        this.estudios[index].modulos = this.estudios[index].allModulos.filter(m => draft.has(m.id));
        const estudio = this.estudios[index];
        const esCicloCompleto = estudio.modulos.length > 0 && estudio.modulos.length === estudio.allModulos.length;
        estudio.allSelected = esCicloCompleto;
        estudio.cicloCompleto = draftCicloCompleto ?? null;
        const nextNotas: Record<number, number | null> = {};
        const nextResultados: Record<number, string | null> = {};
        for (const modulo of estudio.modulos) {
            const rawValue = draftNotas.get(modulo.id) || '';
            nextNotas[modulo.id] = this.parseNotaByModulo(modulo, rawValue);
            nextResultados[modulo.id] = this.parseResultadoByModulo(modulo, rawValue);
        }
        estudio.notasPorModulo = nextNotas;
        estudio.resultadosPorModulo = nextResultados;
        estudio.notaMediaCiclo = estudio.cicloCompleto === true ? this.parseNotaNumerica(draftNotaMediaCiclo) : null;
        this.editDraft.delete(index);
        this.editDraftNotas.delete(index);
        this.editDraftCicloCompleto.delete(index);
        this.editDraftNotaMediaCiclo.delete(index);
        this.editingStudios.delete(index);
        this.syncWithService();
        this.cdr.detectChanges();
    }

    toggleDraftModulo(index: number, moduloId: number): void {
        const draft = this.editDraft.get(index);
        const notas = this.editDraftNotas.get(index);
        if (!draft || !notas) return;
        if (draft.has(moduloId)) {
            draft.delete(moduloId);
            notas.delete(moduloId);
        } else {
            draft.add(moduloId);
            if (!notas.has(moduloId)) {
                const modulo = this.estudios[index].allModulos.find((item) => item.id === moduloId);
                if (!modulo) return;
                notas.set(moduloId, this.getStoredInputValue(this.estudios[index], modulo));
            }
        }
        this.cdr.detectChanges();
    }

    isDraftModuloSelected(index: number, moduloId: number): boolean {
        return this.editDraft.get(index)?.has(moduloId) ?? false;
    }

    getDraftNotaModulo(index: number, moduloId: number): string {
        return this.editDraftNotas.get(index)?.get(moduloId) || '';
    }

    setDraftNotaModulo(index: number, moduloId: number, value: string): void {
        const notas = this.editDraftNotas.get(index);
        if (!notas) return;
        notas.set(moduloId, value);
    }

    getDraftNotaMediaCiclo(index: number): string {
        return this.editDraftNotaMediaCiclo.get(index) || '';
    }

    setDraftNotaMediaCiclo(index: number, value: string): void {
        this.editDraftNotaMediaCiclo.set(index, value);
    }

    getDraftCicloCompleto(index: number): boolean | null {
        return this.editDraftCicloCompleto.get(index) ?? null;
    }

    setDraftCicloCompleto(index: number, value: boolean | null): void {
        this.editDraftCicloCompleto.set(index, value);
        if (value !== true) {
            this.editDraftNotaMediaCiclo.set(index, '');
        }
    }

    canSaveEdit(index: number): boolean {
        const draft = this.editDraft.get(index);
        const notas = this.editDraftNotas.get(index);
        if (!draft || !notas || draft.size === 0) return false;
        if (this.getDraftCicloCompleto(index) === null) return false;
        if (this.getDraftCicloCompleto(index) === true && this.parseNotaNumerica(this.getDraftNotaMediaCiclo(index)) === null) {
            return false;
        }
        for (const moduloId of draft.values()) {
            const modulo = this.estudios[index].allModulos.find((item) => item.id === moduloId);
            if (!modulo) return false;
            if (this.parseNotaByModulo(modulo, notas.get(moduloId) || '') === null) return false;
        }
        return true;
    }

    isEditing(index: number): boolean {
        return this.editingStudios.has(index);
    }

    toggleExpand(index: number): void {
        if (this.expandedStudios.has(index)) {
            this.expandedStudios.delete(index);
        } else {
            this.expandedStudios.add(index);
        }
        this.cdr.detectChanges();
    }

    isExpanded(index: number): boolean {
        return this.expandedStudios.has(index);
    }

    canAddEstudio(): boolean {
        if (!this.selectedGradoId || !this.selectedCicloId || this.selectedCicloCompleto === null || this.selectedModuloIds.size === 0) return false;
        if (this.selectedCicloCompleto && this.parseNotaNumerica(this.selectedNotaMediaCiclo) === null) return false;
        for (const moduloId of this.selectedModuloIds.values()) {
            const modulo = this.modulos.find((item) => item.id === moduloId);
            if (!modulo) return false;
            if (this.parseNotaByModulo(modulo, this.selectedModuloNotas.get(moduloId) || '') === null) {
                return false;
            }
        }
        return true;
    }

    canProceed(): boolean {
        return this.estudios.length > 0 || this.acreditacionesAdded.length > 0 || this.otrosCiclosModulosAdded.length > 0;
    }

    hasUnsavedEstudioDraft(): boolean {
        if (this.showForm) {
            if (this.selectedGradoId !== null) return true;
            if (this.selectedCicloId !== null) return true;
            if (this.selectedCicloCompleto !== null) return true;
            if (this.selectedNotaMediaCiclo.trim()) return true;
            if (this.selectedModuloIds.size > 0) return true;
            if (this.selectedModuloNotas.size > 0) return true;
        }

        if (this.showAcreditacionForm) {
            if (this.selectedAcreditacionId !== null && this.selectedAcreditacionId !== '') return true;
            if (this.otrosTexto.trim()) return true;
        }

        if (this.showOtrosCiclosModulosForm && this.otrosCiclosModulosInput.trim()) {
            return true;
        }

        return false;
    }

    get totalModulos(): number {
        return this.estudios.reduce((acc, e) => acc + e.modulos.length, 0);
    }

    get progresoPaso2Texto(): string {
        const partes: string[] = [];
        if (this.estudios.length > 0) {
            partes.push(`${this.estudios.length} estudio${this.estudios.length !== 1 ? 's' : ''}`);
        }
        if (this.acreditacionesAdded.length > 0) {
            partes.push(`${this.acreditacionesAdded.length} acreditación${this.acreditacionesAdded.length !== 1 ? 'es' : ''} externa${this.acreditacionesAdded.length !== 1 ? 's' : ''}`);
        }
        if (this.otrosCiclosModulosAdded.length > 0) {
            partes.push(`${this.otrosCiclosModulosAdded.length} otro${this.otrosCiclosModulosAdded.length !== 1 ? 's' : ''}`);
        }
        return partes.length > 0 ? partes.join(' · ') : 'Añade formación para continuar';
    }

    get mensajeBloqueoPaso2(): string {
        if (this.canProceed()) return '';
        return 'Tienes que añadir un estudio para poder continuar con el formulario.';
    }

    onNext(): void {
        if (!this.canProceed()) return;
        if (this.hasUnsavedEstudioDraft()) {
            this.pendingEstudioModalOpen = true;
            this.cdr.detectChanges();
            return;
        }
        this.next.emit();
    }

    cerrarPendingEstudioModal(): void {
        this.pendingEstudioModalOpen = false;
        this.cdr.detectChanges();
    }

    continuarSinGuardarEstudio(): void {
        this.pendingEstudioModalOpen = false;
        this.next.emit();
    }

    // ── Acreditaciones externas methods ───────────────────────────────────────
    get tiposAcreditacion(): string[] {
        return [...new Set(this.acreditacionesCatalog.map(a => a.tipo))];
    }

    acreditacionesPorTipo(tipo: string): AcreditacionExterna[] {
        return this.acreditacionesCatalog.filter(
            a => a.tipo === tipo && !this.acreditacionesAdded.find(x => x.id === a.id)
        );
    }

    tipoLabel(tipo: string): string {
        const labels: Record<string, string> = {
            certificado_idioma: 'Certificado de idioma',
            titulo_universitario: 'Título universitario',
            otros: 'Otros',
        };
        return labels[tipo] ?? tipo;
    }

    addAcreditacion(): void {
        if (this.isOtrosSelected) {
            const texto = this.otrosTexto.trim();
            if (!texto) return;
            this.acreditacionesAdded.push({ id: Date.now(), nombre: texto, tipo: 'otros' });
            this.otrosTexto = '';
        } else {
            const found = this.acreditacionesCatalog.find(a => a.id === Number(this.selectedAcreditacionId));
            if (!found) return;
            this.acreditacionesAdded.push(found);
        }
        this.syncWithService();
        this.selectedAcreditacionId = null;
        this.showAcreditacionForm = false;
        this.cdr.detectChanges();
    }

    removeAcreditacion(index: number): void {
        this.acreditacionesAdded.splice(index, 1);
        this.syncWithService();
        this.cdr.detectChanges();
    }

    addOtroCicloOModulo(): void {
        const value = this.otrosCiclosModulosInput.trim();
        if (!value) return;
        this.otrosCiclosModulosAdded.push(value);
        this.otrosCiclosModulosInput = '';
        this.showOtrosCiclosModulosForm = false;
        this.syncWithService();
        this.cdr.detectChanges();
    }

    removeOtroCicloOModulo(index: number): void {
        this.otrosCiclosModulosAdded.splice(index, 1);
        this.syncWithService();
        this.cdr.detectChanges();
    }

    get selectedModulosConNota(): Modulo[] {
        return this.modulos.filter((m) => this.selectedModuloIds.has(m.id));
    }

    get modulosActivos(): Modulo[] {
        return this.modulos.filter((modulo) => !modulo.deprecated);
    }

    get modulosObsoletos(): Modulo[] {
        return this.modulos.filter((modulo) => !!modulo.deprecated);
    }

    getEditModulosActivos(index: number): Modulo[] {
        return (this.estudios[index]?.allModulos || []).filter((modulo) => !modulo.deprecated);
    }

    getEditModulosObsoletos(index: number): Modulo[] {
        return (this.estudios[index]?.allModulos || []).filter((modulo) => !!modulo.deprecated);
    }

    getNotaModuloSeleccionado(moduloId: number): string {
        return this.selectedModuloNotas.get(moduloId) || '';
    }

    setNotaModuloSeleccionado(moduloId: number, value: string): void {
        this.selectedModuloNotas.set(moduloId, value);
    }

    isSelectedNotaMediaCicloValida(): boolean {
        if (this.selectedCicloCompleto !== true) return true;
        return this.parseNotaNumerica(this.selectedNotaMediaCiclo) !== null;
    }

    showSelectedNotaMediaCicloError(): boolean {
        return this.selectedCicloCompleto === true
            && this.selectedNotaMediaCiclo.trim().length > 0
            && !this.isSelectedNotaMediaCicloValida();
    }

    showSelectedModuloError(modulo: Modulo): boolean {
        const value = this.getNotaModuloSeleccionado(modulo.id);
        return value.trim().length > 0 && this.parseNotaByModulo(modulo, value) === null;
    }

    showDraftNotaMediaCicloError(index: number): boolean {
        const value = this.getDraftNotaMediaCiclo(index);
        return this.getDraftCicloCompleto(index) === true
            && value.trim().length > 0
            && this.parseNotaNumerica(value) === null;
    }

    showDraftModuloError(index: number, modulo: Modulo): boolean {
        const value = this.getDraftNotaModulo(index, modulo.id);
        return value.trim().length > 0 && this.parseNotaByModulo(modulo, value) === null;
    }

    getModuloErrorMessage(modulo: Modulo): string {
        return this.isModuloNumerico(modulo)
            ? 'Introduce una nota válida entre 0 y 10.'
            : 'Selecciona un estado valido.';
    }

    isModuloNumerico(modulo: Modulo): boolean {
        return modulo.numerico !== 0;
    }

    notaModuloEstudio(estudio: EstudioEntry, moduloId: number): number | null {
        const nota = estudio.notasPorModulo?.[moduloId];
        return typeof nota === 'number' ? nota : null;
    }

    resultadoModuloEstudio(estudio: EstudioEntry, moduloId: number): string | null {
        const value = estudio.resultadosPorModulo?.[moduloId];
        return typeof value === 'string' && value.trim() ? value : null;
    }

    etiquetaResultadoModulo(estudio: EstudioEntry, modulo: Modulo): string {
        if (!this.isModuloNumerico(modulo)) {
            return this.formatResultado(estudio.resultadosPorModulo?.[modulo.id]) || '—';
        }
        const nota = this.notaModuloEstudio(estudio, modulo.id);
        return nota !== null ? String(nota.toFixed(2)) : '—';
    }

    private parseNotaNumerica(value: string): number | null {
        const raw = (value || '').toString().trim().replace(',', '.');
        if (!raw) return null;
        const nota = Number(raw);
        if (!Number.isFinite(nota)) return null;
        if (nota < 0 || nota > 10) return null;
        return nota;
    }

    private parseNotaByModulo(modulo: Modulo, value: string): number | null {
        if (this.isModuloNumerico(modulo)) {
            return this.parseNotaNumerica(value);
        }
        const normalized = (value || '').trim().toUpperCase();
        if (normalized === 'APTO') return 1;
        if (normalized === 'NO_APTO') return 0;
        if (normalized === 'EXENTO') return 2;
        return null;
    }

    private parseResultadoByModulo(modulo: Modulo, value: string): string | null {
        if (this.isModuloNumerico(modulo)) return null;
        const normalized = (value || '').trim().toUpperCase();
        if (normalized === 'APTO' || normalized === 'NO_APTO' || normalized === 'EXENTO') {
            return normalized;
        }
        return null;
    }

    private getStoredInputValue(estudio: EstudioEntry, modulo: Modulo): string {
        if (!this.isModuloNumerico(modulo)) {
            const resultado = estudio.resultadosPorModulo?.[modulo.id];
            if (typeof resultado === 'string' && resultado.trim()) {
                return resultado;
            }
            const nota = estudio.notasPorModulo?.[modulo.id];
            if (nota === 1) return 'APTO';
            if (nota === 0) return 'NO_APTO';
            if (nota === 2) return 'EXENTO';
            return '';
        }
        const nota = estudio.notasPorModulo?.[modulo.id];
        return nota === null || nota === undefined ? '' : String(nota);
    }

    private formatResultado(value: string | null | undefined): string | null {
        if (!value) return null;
        if (value === 'NO_APTO') return 'NO APTO';
        return value;
    }

    private migrateNotasPorModulo(estudio: EstudioEntry): Record<number, number | null> {
        const next: Record<number, number | null> = { ...(estudio.notasPorModulo || {}) };
        if (Object.keys(next).length === 0 && typeof estudio.notaMediaCiclo === 'number') {
            for (const modulo of estudio.modulos || []) {
                next[modulo.id] = estudio.notaMediaCiclo;
            }
        }
        return next;
    }

    private migrateResultadosPorModulo(estudio: EstudioEntry): Record<number, string | null> {
        const current = (estudio as EstudioEntry & { resultadosPorModulo?: Record<number, string | null> }).resultadosPorModulo || {};
        const next: Record<number, string | null> = { ...current };
        for (const modulo of estudio.modulos || []) {
            if (this.isModuloNumerico(modulo)) continue;
            if (next[modulo.id]) continue;
            const nota = estudio.notasPorModulo?.[modulo.id];
            if (nota === 1) {
                next[modulo.id] = 'APTO';
            } else if (nota === 0) {
                next[modulo.id] = 'NO_APTO';
            } else if (nota === 2) {
                next[modulo.id] = 'EXENTO';
            }
        }
        return next;
    }
}
