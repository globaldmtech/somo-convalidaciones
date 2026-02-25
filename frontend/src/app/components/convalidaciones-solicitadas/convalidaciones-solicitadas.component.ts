import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConvalidacionesService } from '../../services/convalidaciones.service';
import { CatalogService } from '../../services/catalog.service';
import { Grado, Ciclo } from '../../models/catalog.models';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-convalidaciones-solicitadas',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './convalidaciones-solicitadas.component.html',
    styleUrl: './convalidaciones-solicitadas.component.css'
})
export class ConvalidacionesSolicitadasComponent implements OnInit {

    // Target Selection
    grados: Grado[] = [];
    ciclos: Ciclo[] = [];
    selectedGradoId: number | null = null;
    selectedCicloId: number | null = null;
    selectedCicloName = '';

    loadingGrados = false;
    loadingCiclos = false;

    // Results
    results: any[] = [];
    groupedResults: { source: string, items: any[] }[] = [];
    loading = false;

    // Selection State (ModuleID -> SourceName)
    selectedModuleSources = new Map<number, string>();

    @Output() next = new EventEmitter<void>();
    @Output() prev = new EventEmitter<void>();

    constructor(
        private convalidacionesService: ConvalidacionesService,
        private catalogService: CatalogService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadGrados();

        // Restore from service
        this.selectedGradoId = this.convalidacionesService.targetGradoId;
        this.selectedCicloId = this.convalidacionesService.targetCicloId;
        // Use a new Map to avoid reference sharing issues if needed, or just copy
        this.selectedModuleSources = new Map(this.convalidacionesService.sharedSelectedModuleSources);

        if (this.selectedGradoId) {
            this.loadCiclosForGrado(this.selectedGradoId);
        }
        if (this.selectedCicloId) {
            this.loadResults();
        }
    }

    private syncTargetToService(): void {
        this.convalidacionesService.targetGradoId = this.selectedGradoId;
        this.convalidacionesService.targetCicloId = this.selectedCicloId;
        this.convalidacionesService.sharedSelectedModuleSources = new Map(this.selectedModuleSources);
    }

    loadGrados(): void {
        this.loadingGrados = true;
        this.catalogService.getGrados()
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe(data => {
                this.grados = data;
                this.loadingGrados = false;
                this.cdr.detectChanges();
            });
    }

    onGradoChange(): void {
        this.ciclos = [];
        this.selectedCicloId = null;
        this.selectedCicloName = '';
        this.results = [];
        this.groupedResults = [];
        this.selectedModuleSources.clear();
        this.syncTargetToService();

        if (!this.selectedGradoId) return;
        this.loadCiclosForGrado(Number(this.selectedGradoId));
    }

    private loadCiclosForGrado(gradoId: number): void {
        this.loadingCiclos = true;
        this.catalogService.getCiclos(gradoId)
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe(data => {
                this.ciclos = data;
                this.loadingCiclos = false;

                // If we restored a cicloId, ensure its name is also restored
                if (this.selectedCicloId) {
                    const found = this.ciclos.find(c => Number(c.id) === Number(this.selectedCicloId));
                    if (found) this.selectedCicloName = found.nombre;
                }

                this.cdr.detectChanges();
            });
    }

    onCicloChange(): void {
        const found = this.ciclos.find(c => Number(c.id) === Number(this.selectedCicloId));
        this.selectedCicloName = found ? found.nombre : '';
        this.selectedModuleSources.clear();
        this.syncTargetToService();

        if (this.selectedCicloId) {
            this.loadResults();
        } else {
            this.results = [];
            this.groupedResults = [];
        }
    }

    loadResults(): void {
        if (!this.selectedCicloId) return;

        this.loading = true;
        this.cdr.detectChanges();

        this.convalidacionesService.calcularConvalidaciones(Number(this.selectedCicloId)).subscribe({
            next: (data) => {
                this.results = data;

                // Normalize and group by source_nombre
                this.results = data.map(item => ({
                    ...item,
                    source_nombre: item.source_nombre || 'Otros'
                }));

                const groups: { [key: string]: any[] } = {};
                this.results.forEach(item => {
                    const source = item.source_nombre;
                    if (!groups[source]) groups[source] = [];
                    groups[source].push(item);
                });

                this.groupedResults = Object.keys(groups).map(source => ({
                    source,
                    items: groups[source]
                })).sort((a, b) => a.source.localeCompare(b.source));

                // Cleanup: Remove selected modules that are no longer in the results 
                // e.g. if the user removed a study in the other tab.
                const validIds = new Set(this.results.map(r => Number(r.id)));
                this.selectedModuleSources.forEach((source, id) => {
                    if (!validIds.has(Number(id))) {
                        this.selectedModuleSources.delete(Number(id));
                    }
                });
                this.syncTargetToService();

                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading convalidations:', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    toggleModulo(id: number | string, sourceName: string): void {
        const numericId = Number(id);
        const currentSource = this.selectedModuleSources.get(numericId);

        if (currentSource === sourceName) {
            // Unselect if same source
            this.selectedModuleSources.delete(numericId);
        } else if (currentSource === undefined) {
            // Select if nothing selected for this module
            this.selectedModuleSources.set(numericId, sourceName);
        }
        // If another source is selected, we follow user's "bloquee" request 
        // and do nothing here. The UI will also visualy reflect this.
        this.syncTargetToService();
    }

    isModuloSelected(id: number, sourceName: string): boolean {
        return this.selectedModuleSources.get(id) === sourceName;
    }

    isOtherSourceSelected(id: number, sourceName: string): boolean {
        const currentSource = this.selectedModuleSources.get(id);
        return currentSource !== undefined && currentSource !== sourceName;
    }

    get selectedCount(): number {
        return this.selectedModules.length;
    }

    get selectedModules(): any[] {
        const selected: any[] = [];
        this.selectedModuleSources.forEach((source, id) => {
            const mod = this.results.find(r => Number(r.id) === Number(id) && r.source_nombre === source);
            if (mod) selected.push(mod);
        });
        return selected;
    }
}
