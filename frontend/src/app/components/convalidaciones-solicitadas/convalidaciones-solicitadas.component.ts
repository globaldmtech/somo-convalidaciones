import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConvalidacionesService } from '../../services/convalidaciones.service';
import { CatalogService } from '../../services/catalog.service';
import { Grado, Ciclo, Modulo } from '../../models/catalog.models';
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
    selectedGradoName = '';
    selectedCicloId: number | null = null;
    selectedCicloName = '';
    selectedOtroModuloCicloId: number | null = null;
    otrosModulosCiclo: string[] = [];
    showOtrosModulosCiclo = false;
    otroInput = '';
    otrosSolicitudes: string[] = [];

    loadingGrados = false;
    loadingCiclos = false;
    loadingModulosCiclo = false;
    modulosCicloDisponibles: Modulo[] = [];

    // Results
    results: any[] = [];
    groupedResults: { source: string, items: any[] }[] = [];
    loading = false;
    private loadResultsRequestId = 0;

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
        this.selectedGradoName = this.convalidacionesService.targetGradoNombre;
        this.selectedCicloName = this.convalidacionesService.targetCicloNombre;
        this.otrosModulosCiclo = [...this.convalidacionesService.otrosModulosCiclo];
        this.otrosSolicitudes = [...this.convalidacionesService.otrosSolicitudes];
        // Use a new Map to avoid reference sharing issues if needed, or just copy
        this.selectedModuleSources = new Map(this.convalidacionesService.sharedSelectedModuleSources);

        if (this.selectedGradoId) {
            this.loadCiclosForGrado(this.selectedGradoId);
        }
        if (this.selectedCicloId) {
            this.loadModulosCiclo(Number(this.selectedCicloId));
            this.loadResults();
        }
    }

    private syncTargetToService(): void {
        if ((!this.selectedGradoName || !this.selectedGradoName.trim()) && this.selectedGradoId) {
            const gradoFound = this.grados.find(g => Number(g.id) === Number(this.selectedGradoId));
            if (gradoFound) {
                this.selectedGradoName = gradoFound.nombre;
            }
        }
        if ((!this.selectedCicloName || !this.selectedCicloName.trim()) && this.selectedCicloId) {
            const cicloFound = this.ciclos.find(c => Number(c.id) === Number(this.selectedCicloId));
            if (cicloFound) {
                this.selectedCicloName = cicloFound.nombre;
            }
        }

        this.convalidacionesService.targetGradoId = this.selectedGradoId;
        this.convalidacionesService.targetCicloId = this.selectedCicloId;
        this.convalidacionesService.targetGradoNombre = this.selectedGradoName;
        this.convalidacionesService.targetCicloNombre = this.selectedCicloName;
        this.convalidacionesService.otrosModulosCiclo = [...this.otrosModulosCiclo];
        this.convalidacionesService.otrosSolicitudes = [...this.otrosSolicitudes];
        this.convalidacionesService.otrosModulosCicloRegistrados = this.otrosModulosCiclo
            .map(nombre => this.modulosCicloDisponibles.find(m => m.nombre === nombre))
            .filter((m): m is Modulo => !!m)
            .map(m => ({ id: Number(m.id), nombre: m.nombre }));
        this.convalidacionesService.sharedSelectedModuleSources = new Map(this.selectedModuleSources);
        this.convalidacionesService.sharedSelectedConvalidations = this.selectedModules.map(mod => ({
            id: Number(mod.id),
            nombre: mod.nombre,
            source: mod.source_nombre,
            id_convalidacion: mod.id_convalidacion ?? null,
        }));
    }

    addOtro(): void {
        const value = this.otroInput.trim();
        if (!value) return;
        this.otrosSolicitudes.push(value);
        this.otroInput = '';
        this.syncTargetToService();
    }

    toggleOtrosModulosCiclo(): void {
        this.showOtrosModulosCiclo = !this.showOtrosModulosCiclo;
    }

    addOtroModuloCiclo(): void {
        if (!this.selectedOtroModuloCicloId) return;
        const found = this.modulosCicloDisponibles.find(m => Number(m.id) === Number(this.selectedOtroModuloCicloId));
        if (!found) return;
        if (!this.otrosModulosCiclo.includes(found.nombre)) {
            this.otrosModulosCiclo.push(found.nombre);
        }
        this.selectedOtroModuloCicloId = null;
        this.syncTargetToService();
    }

    removeOtroModuloCiclo(index: number): void {
        this.otrosModulosCiclo.splice(index, 1);
        this.syncTargetToService();
    }

    removeOtro(index: number): void {
        this.otrosSolicitudes.splice(index, 1);
        this.syncTargetToService();
    }

    onOtroEnter(event: Event): void {
        event.preventDefault();
        this.addOtro();
    }

    loadGrados(): void {
        this.loadingGrados = true;
        this.catalogService.getGrados()
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe(data => {
                this.grados = data;
                this.loadingGrados = false;
                if (this.selectedGradoId) {
                    const found = this.grados.find(g => Number(g.id) === Number(this.selectedGradoId));
                    if (found) {
                        this.selectedGradoName = found.nombre;
                        this.syncTargetToService();
                    }
                }
                this.cdr.detectChanges();
            });
    }

    onGradoChange(): void {
        const gradoFound = this.grados.find(g => Number(g.id) === Number(this.selectedGradoId));
        this.selectedGradoName = gradoFound ? gradoFound.nombre : '';
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

                const gradoFound = this.grados.find(g => Number(g.id) === Number(this.selectedGradoId));
                this.selectedGradoName = gradoFound ? gradoFound.nombre : '';

                // If we restored a cicloId, ensure its name is also restored
                if (this.selectedCicloId) {
                    const found = this.ciclos.find(c => Number(c.id) === Number(this.selectedCicloId));
                    if (found) this.selectedCicloName = found.nombre;
                }

                this.syncTargetToService();
                this.cdr.detectChanges();
            });
    }

    onCicloChange(): void {
        const found = this.ciclos.find(c => Number(c.id) === Number(this.selectedCicloId));
        this.selectedCicloName = found ? found.nombre : '';
        this.selectedModuleSources.clear();
        this.otrosModulosCiclo = [];
        this.selectedOtroModuloCicloId = null;
        this.syncTargetToService();

        if (this.selectedCicloId) {
            this.loadModulosCiclo(Number(this.selectedCicloId));
            this.loadResults();
        } else {
            this.modulosCicloDisponibles = [];
            this.results = [];
            this.groupedResults = [];
        }
    }

    private loadModulosCiclo(cicloId: number): void {
        this.loadingModulosCiclo = true;
        this.catalogService.getModulos(cicloId)
            .pipe(timeout(10000), catchError(() => of([])))
            .subscribe(data => {
                this.modulosCicloDisponibles = data;
                this.loadingModulosCiclo = false;
                this.cdr.detectChanges();
            });
    }

    loadResults(): void {
        if (!this.selectedCicloId) return;

        const requestId = ++this.loadResultsRequestId;
        this.loading = true;
        this.cdr.detectChanges();

        this.convalidacionesService.calcularConvalidaciones(Number(this.selectedCicloId)).subscribe({
            next: (data) => {
                if (requestId !== this.loadResultsRequestId) {
                    return;
                }
                // Normalize source name
                const normalized = data.map(item => ({
                    ...item,
                    source_nombre: item.source_nombre || 'Otros'
                }));

                // Pick the best rule per target module across ALL sources,
                // based on the highest average note from origin modules.
                this.results = this.selectBestRulesByModule(normalized);
                this.groupedResults = this.results.length > 0
                    ? [{ source: 'Mejor opción por nota', items: this.results }]
                    : [];

                // Cleanup: remove selections that are no longer valid in current results.
                // We must validate by (moduleId + source), not only by moduleId,
                // otherwise modules can remain blocked with stale sources.
                const validSelections = new Set(
                    this.results.map(r => `${Number(r.id)}::${String(r.source_nombre || 'Otros')}`)
                );
                this.selectedModuleSources.forEach((source, id) => {
                    const key = `${Number(id)}::${String(source)}`;
                    if (!validSelections.has(key)) {
                        this.selectedModuleSources.delete(Number(id));
                    }
                });

                // Default behavior: preselect all best options.
                if (this.selectedModuleSources.size === 0) {
                    this.results.forEach(result => {
                        this.selectedModuleSources.set(Number(result.id), String(result.source_nombre || 'Otros'));
                    });
                }
                this.syncTargetToService();

                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                if (requestId !== this.loadResultsRequestId) {
                    return;
                }
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
        return this.selectedModules.length + this.otrosModulosCiclo.length;
    }

    get availableOtrosModulosCiclo(): Modulo[] {
        const selectedIds = new Set(this.selectedModules.map(m => Number(m.id)));
        const selectedNombres = new Set(this.otrosModulosCiclo.map(n => n.toLowerCase().trim()));
        return this.modulosCicloDisponibles.filter(m =>
            !selectedIds.has(Number(m.id)) && !selectedNombres.has(m.nombre.toLowerCase().trim())
        );
    }

    get selectedModules(): any[] {
        const selected: any[] = [];
        this.selectedModuleSources.forEach((source, id) => {
            const mod = this.results.find(r => Number(r.id) === Number(id) && r.source_nombre === source);
            if (mod) selected.push(mod);
        });
        return selected;
    }

    private selectBestRulesByModule(results: any[]): any[] {
        const bestByModulo = new Map<number, any>();
        for (const result of results) {
            const moduloId = Number(result?.id);
            if (!Number.isFinite(moduloId)) continue;
            const currentBest = bestByModulo.get(moduloId);
            if (!currentBest || this.getRuleScore(result) > this.getRuleScore(currentBest)) {
                bestByModulo.set(moduloId, result);
            }
        }
        return Array.from(bestByModulo.values()).sort((a, b) =>
            String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es')
        );
    }

    private getRuleScore(result: any): number {
        const origenIds = this.getModulosOrigenIds(result?.modulos_origen_ids);
        if (origenIds.length === 0) return -1;
        const notasPorId = this.getNotasPorIdModulo();
        const notas = origenIds
            .map((id) => notasPorId.get(id))
            .filter((nota): nota is number => typeof nota === 'number' && Number.isFinite(nota));
        if (notas.length === 0) return -1;
        const total = notas.reduce((acc, current) => acc + current, 0);
        return total / notas.length;
    }

    private getModulosOrigenIds(rawIds: unknown): number[] {
        if (!rawIds) return [];
        return String(rawIds)
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean)
            .map((token) => Number(token))
            .filter((id) => Number.isFinite(id));
    }

    getModulosOrigenLista(modulosOrigen: string | null | undefined): string[] {
        if (!modulosOrigen) return [];
        return modulosOrigen
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    getModulosOrigenConNota(modulosOrigen: string | null | undefined): string[] {
        const notasPorNombre = this.getNotasPorNombreModulo();
        return this.getModulosOrigenLista(modulosOrigen).map((nombre) => {
            const nota = notasPorNombre.get(this.normalizarTexto(nombre));
            if (nota === null || nota === undefined) return `${nombre} (sin nota)`;
            return `${nombre} (${this.formatearNota(nota)})`;
        });
    }

    debeMostrarDesplegableModulosOrigen(modulosOrigen: string | null | undefined): boolean {
        return this.getModulosOrigenLista(modulosOrigen).length > 2;
    }

    private getNotasPorNombreModulo(): Map<string, number> {
        const map = new Map<string, number>();
        const estudios = this.convalidacionesService.getEstudios() || [];
        for (const estudio of estudios) {
            for (const modulo of estudio.modulos || []) {
                const nota = estudio.notasPorModulo?.[modulo.id];
                if (typeof nota !== 'number' || !Number.isFinite(nota)) continue;
                const key = this.normalizarTexto(modulo.nombre);
                if (!key) continue;
                const actual = map.get(key);
                if (actual === undefined || nota > actual) {
                    map.set(key, nota);
                }
            }
        }
        return map;
    }

    private getNotasPorIdModulo(): Map<number, number> {
        const map = new Map<number, number>();
        const estudios = this.convalidacionesService.getEstudios() || [];
        for (const estudio of estudios) {
            for (const modulo of estudio.modulos || []) {
                const nota = estudio.notasPorModulo?.[modulo.id];
                if (typeof nota !== 'number' || !Number.isFinite(nota)) continue;
                const idModulo = Number(modulo.id);
                if (!Number.isFinite(idModulo)) continue;
                const actual = map.get(idModulo);
                if (actual === undefined || nota > actual) {
                    map.set(idModulo, nota);
                }
            }
        }
        return map;
    }

    private normalizarTexto(value: string): string {
        return (value || '').toLowerCase().trim().replace(/\s+/g, ' ');
    }

    private formatearNota(value: number): string {
        return value.toLocaleString('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }
}
