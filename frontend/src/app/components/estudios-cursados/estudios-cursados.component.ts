import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Grado, Ciclo, Modulo } from '../../models/catalog.models';

// ── LOE Study entry ──────────────────────────────────────────────────────────
export interface EstudioEntry {
    grado: Grado;
    ciclo: Ciclo;
    modulos: Modulo[];      // selected
    allModulos: Modulo[];   // all available for this ciclo
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

    get isOtrosSelected(): boolean {
        return this.selectedAcreditacionId === 'otros';
    }

    constructor(private catalogService: CatalogService, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.loadGrados();
        this.loadAcreditacionesExternas();
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
        } else {
            this.selectedModuloIds.add(id);
        }
        this.allSelected = this.selectedModuloIds.size === this.modulos.length;
    }

    toggleAll(): void {
        if (this.allSelected) {
            this.selectedModuloIds.clear();
            this.allSelected = false;
        } else {
            this.modulos.forEach(m => this.selectedModuloIds.add(m.id));
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

        if (!grado || !ciclo || selectedModulos.length === 0) return;

        this.estudios.push({ grado, ciclo, modulos: selectedModulos, allModulos: [...this.modulos] });

        this.selectedGradoId = null;
        this.selectedCicloId = null;
        this.selectedModuloIds.clear();
        this.ciclos = [];
        this.modulos = [];
        this.allSelected = false;
        this.showForm = false;
        this.cdr.detectChanges();
    }

    removeEstudio(index: number): void {
        this.estudios.splice(index, 1);
        this.expandedStudios.delete(index);
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
        this.editDraft.delete(index);
        this.editingStudios.delete(index);
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
        return !!this.selectedGradoId && !!this.selectedCicloId && this.selectedModuloIds.size > 0;
    }

    canProceed(): boolean {
        return this.estudios.length > 0 || this.acreditacionesAdded.length > 0;
    }

    get totalModulos(): number {
        return this.estudios.reduce((acc, e) => acc + e.modulos.length, 0);
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
        this.selectedAcreditacionId = null;
        this.showAcreditacionForm = false;
        this.cdr.detectChanges();
    }

    removeAcreditacion(index: number): void {
        this.acreditacionesAdded.splice(index, 1);
        this.cdr.detectChanges();
    }
}
