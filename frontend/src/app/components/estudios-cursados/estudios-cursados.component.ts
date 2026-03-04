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
    notaMediaCiclo: number | null;
    notasPorModulo: Record<number, number | null>;
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
    styleUrl: './estudios-cursados.component.css'
})
export class EstudiosCursadosComponent implements OnInit {

    // ── LOE catalog data ──────────────────────────────────────────────────────
    grados: Grado[] = [];
    ciclos: Ciclo[] = [];
    modulos: Modulo[] = [];

    selectedGradoId: number | null = null;
    selectedCicloId: number | null = null;
    selectedModuloIds: Set<number> = new Set();
    allSelected = false;
    selectedModuloNotas = new Map<number, string>();
    selectedNotaMediaCiclo = '';

    loadingGrados = false;
    loadingCiclos = false;
    loadingModulos = false;

    // LOE studies added
    estudios: EstudioEntry[] = [];
    showForm = true;
    expandedStudios: Set<number> = new Set();
    editingStudios: Set<number> = new Set();
    editDraft: Map<number, Set<number>> = new Map();

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
            notaMediaCiclo: typeof estudio.notaMediaCiclo === 'number' ? estudio.notaMediaCiclo : null,
            notasPorModulo: { ...(estudio.notasPorModulo || {}) },
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
        this.selectedNotaMediaCiclo = '';
        this.allSelected = false;

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
        this.allSelected = this.selectedModuloIds.size === this.modulos.length;
    }

    toggleAll(): void {
        if (this.allSelected) {
            this.selectedModuloIds.clear();
            this.selectedModuloNotas.clear();
            this.selectedNotaMediaCiclo = '';
            this.allSelected = false;
        } else {
            this.modulos.forEach(m => {
                this.selectedModuloIds.add(m.id);
                if (!this.selectedModuloNotas.has(m.id)) {
                    this.selectedModuloNotas.set(m.id, '');
                }
            });
            this.allSelected = true;
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
        const notaMedia = esCicloCompleto ? this.parseNota(this.selectedNotaMediaCiclo) : null;
        const notasPorModulo: Record<number, number | null> = {};
        if (!esCicloCompleto) {
            for (const modulo of selectedModulos) {
                notasPorModulo[modulo.id] = this.parseNota(this.selectedModuloNotas.get(modulo.id) || '');
            }
        }

        this.estudios.push({
            grado,
            ciclo,
            modulos: selectedModulos,
            allModulos: [...this.modulos],
            allSelected: esCicloCompleto,
            notaMediaCiclo: notaMedia,
            notasPorModulo,
        });

        this.syncWithService();

        this.selectedGradoId = null;
        this.selectedCicloId = null;
        this.selectedModuloIds.clear();
        this.selectedModuloNotas.clear();
        this.selectedNotaMediaCiclo = '';
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
        const draft = new Set(this.estudios[index].modulos.map(m => m.id));
        this.editDraft.set(index, draft);
        this.editingStudios.add(index);
        this.cdr.detectChanges();
    }

    cancelEdit(index: number): void {
        this.editDraft.delete(index);
        this.editingStudios.delete(index);
        this.cdr.detectChanges();
    }

    saveEdit(index: number): void {
        const draft = this.editDraft.get(index);
        if (!draft) return;
        this.estudios[index].modulos = this.estudios[index].allModulos.filter(m => draft.has(m.id));
        const estudio = this.estudios[index];
        const esCicloCompleto = estudio.modulos.length > 0 && estudio.modulos.length === estudio.allModulos.length;
        estudio.allSelected = esCicloCompleto;
        if (esCicloCompleto) {
            estudio.notasPorModulo = {};
            if (estudio.notaMediaCiclo === null || estudio.notaMediaCiclo === undefined) {
                estudio.notaMediaCiclo = null;
            }
        } else {
            const nextNotas: Record<number, number | null> = {};
            for (const modulo of estudio.modulos) {
                nextNotas[modulo.id] = estudio.notasPorModulo?.[modulo.id] ?? null;
            }
            estudio.notasPorModulo = nextNotas;
            estudio.notaMediaCiclo = null;
        }
        this.editDraft.delete(index);
        this.editingStudios.delete(index);
        this.syncWithService();
        this.cdr.detectChanges();
    }

    toggleDraftModulo(index: number, moduloId: number): void {
        const draft = this.editDraft.get(index);
        if (!draft) return;
        if (draft.has(moduloId)) { draft.delete(moduloId); } else { draft.add(moduloId); }
        this.cdr.detectChanges();
    }

    isDraftModuloSelected(index: number, moduloId: number): boolean {
        return this.editDraft.get(index)?.has(moduloId) ?? false;
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
        if (!this.selectedGradoId || !this.selectedCicloId || this.selectedModuloIds.size === 0) return false;
        const esCicloCompleto = this.selectedModuloIds.size === this.modulos.length && this.modulos.length > 0;
        if (esCicloCompleto) {
            return this.parseNota(this.selectedNotaMediaCiclo) !== null;
        }
        for (const moduloId of this.selectedModuloIds.values()) {
            if (this.parseNota(this.selectedModuloNotas.get(moduloId) || '') === null) {
                return false;
            }
        }
        return true;
    }

    canProceed(): boolean {
        return this.estudios.length > 0 || this.acreditacionesAdded.length > 0 || this.otrosCiclosModulosAdded.length > 0;
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

    getNotaModuloSeleccionado(moduloId: number): string {
        return this.selectedModuloNotas.get(moduloId) || '';
    }

    setNotaModuloSeleccionado(moduloId: number, value: string): void {
        this.selectedModuloNotas.set(moduloId, value);
    }

    private parseNota(value: string): number | null {
        const raw = (value || '').toString().trim().replace(',', '.');
        if (!raw) return null;
        const nota = Number(raw);
        if (!Number.isFinite(nota)) return null;
        if (nota < 0 || nota > 10) return null;
        return nota;
    }

    notaModuloEstudio(estudio: EstudioEntry, moduloId: number): number | null {
        if (estudio.allSelected) return estudio.notaMediaCiclo;
        const nota = estudio.notasPorModulo?.[moduloId];
        return typeof nota === 'number' ? nota : null;
    }
}
