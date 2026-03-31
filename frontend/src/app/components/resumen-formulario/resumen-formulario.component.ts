import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs/operators';
import {
    ConvalidacionesService,
    PersonalData,
    SelectedConvalidation,
    UploadedDocument,
} from '../../services/convalidaciones.service';
import { EstudioEntry, AcreditacionExterna } from '../estudios-cursados/estudios-cursados.component';

@Component({
    selector: 'app-resumen-formulario',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './resumen-formulario.component.html',
})
export class ResumenFormularioComponent implements OnInit {
    @Output() prev = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<void>();

    estudios: EstudioEntry[] = [];
    acreditaciones: AcreditacionExterna[] = [];
    otrosCiclosModulosCursados: string[] = [];
    convalidacionesSolicitadas: SelectedConvalidation[] = [];
    personalData: PersonalData = {
        nombre: '',
        apellidos: '',
        dni: '',
        email: '',
    };

    enviando = false;
    enviado = false;
    error: string | null = null;
    expandedEstudios = new Set<number>();

    constructor(
        private convalidacionesService: ConvalidacionesService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.estudios = this.convalidacionesService.getEstudios();
        this.acreditaciones = this.convalidacionesService.getAcreditaciones();
        this.otrosCiclosModulosCursados = this.convalidacionesService.getOtrosCiclosModulos();
        this.personalData = this.convalidacionesService.getPersonalData();
        this.convalidacionesSolicitadas = this.deduplicarConvalidacionesSolicitadasPorMejorNota(
            this.convalidacionesService.sharedSelectedConvalidations
        );
    }

    get totalModulos(): number {
        return this.estudios.reduce((acc, e) => acc + e.modulos.length, 0);
    }

    get cicloDestino(): string {
        return this.convalidacionesService.targetCicloNombre || '—';
    }

    get gradoDestino(): string {
        return this.convalidacionesService.targetGradoNombre || '—';
    }

    get otrosSolicitudes(): string[] {
        return this.convalidacionesService.otrosSolicitudes || [];
    }

    get otrosModulosCiclo(): string[] {
        return this.convalidacionesService.otrosModulosCiclo || [];
    }

    toggleEstudio(index: number): void {
        if (this.expandedEstudios.has(index)) {
            this.expandedEstudios.delete(index);
            return;
        }
        this.expandedEstudios.add(index);
    }

    isEstudioExpanded(index: number): boolean {
        return this.expandedEstudios.has(index);
    }

    notaModuloEstudio(estudio: EstudioEntry, moduloId: number): number | null {
        const nota = this.parseNotaFlexible(estudio.notasPorModulo?.[moduloId]);
        if (nota !== null) return nota;
        return this.parseNotaFlexible(estudio.notaMediaCiclo);
    }

    resultadoModuloEstudio(estudio: EstudioEntry, moduloId: number): string | null {
        const value = estudio.resultadosPorModulo?.[moduloId];
        if (typeof value !== 'string' || !value.trim()) return null;
        if (value === 'NO_APTO') return 'NO APTO';
        return value;
    }

    isModuloNumerico(moduloId: number, estudio: EstudioEntry): boolean {
        const modulo = (estudio.modulos || []).find((item) => Number(item.id) === Number(moduloId));
        return modulo ? modulo.numerico !== 0 : true;
    }

    notaConvalidacionSolicitada(item: SelectedConvalidation): number | null {
        const notaMediaOrigen = this.parseNotaFlexible(item.nota_media_origen);
        if (notaMediaOrigen !== null) {
            return this.redondearNotaConvalidacion(notaMediaOrigen);
        }

        const origenIds = this.getModulosOrigenIds(item.modulos_origen_ids);
        if (origenIds.length === 0) return null;

        const notasPorId = this.getNotasPorIdModulo();
        const notas = origenIds
            .map((id) => notasPorId.get(id))
            .filter((nota): nota is number => typeof nota === 'number' && Number.isFinite(nota));

        if (notas.length !== origenIds.length) return null;

        const media = notas.reduce((acc, current) => acc + current, 0) / notas.length;
        return this.redondearNotaConvalidacion(media);
    }

    viaConvalidacion(item: SelectedConvalidation): string {
        const ciclo = (item.ciclo_origen || item.source || '').trim();
        if (item.origen_tipo === 'ciclo_completo') {
            return ciclo ? `${ciclo} · Ciclo completo` : 'Ciclo completo';
        }
        const modulos = (item.modulos_origen || '').trim();
        if (ciclo && modulos) {
            return `${ciclo} · ${modulos}`;
        }
        return ciclo || modulos || '—';
    }

    private redondearNotaConvalidacion(value: number): number {
        return Math.floor(value + 0.5);
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

    private getNotasPorIdModulo(): Map<number, number> {
        const map = new Map<number, number>();
        for (const estudio of this.estudios || []) {
            for (const modulo of estudio.modulos || []) {
                const nota = this.parseNotaFlexible(estudio.notasPorModulo?.[modulo.id]);
                if (nota === null) continue;
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

    private parseNotaFlexible(value: unknown): number | null {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }
        if (typeof value === 'string') {
            const raw = value.trim().replace(',', '.');
            if (!raw) return null;
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }

    get documentoDni(): UploadedDocument | null {
        return this.convalidacionesService.documentoDni;
    }

    get documentosCertificado(): UploadedDocument[] {
        return this.convalidacionesService.documentosCertificado;
    }

    get documentosOtros(): UploadedDocument[] {
        return this.convalidacionesService.documentosOtros;
    }

    get duplicateDocumentNames(): string[] {
        return this.convalidacionesService.getDuplicateDocumentNames();
    }

    get documentosCompletos(): boolean {
        return !!this.documentoDni
            && this.documentosCertificado.length > 0
            && this.duplicateDocumentNames.length === 0;
    }

    enviar(): void {
        if (this.enviando) return;

        if (!this.documentosCompletos) {
            this.error = this.duplicateDocumentNames.length > 0
                ? `Hay documentos con nombres duplicados: ${this.duplicateDocumentNames.join(', ')}. Cámbialos antes de enviar.`
                : 'Debes subir DNI y certificado académico antes de enviar.';
            return;
        }

        // Releer selección final por si hubo cambios asíncronos tras entrar al resumen.
        this.convalidacionesSolicitadas = this.deduplicarConvalidacionesSolicitadasPorMejorNota(
            this.convalidacionesService.sharedSelectedConvalidations
        );

        this.enviando = true;
        this.error = null;
        let payload: any;
        try {
            const hayNotasInvalidas = this.estudios.some((estudio) => {
                if (estudio.modulos.length === 0) return false;
                return estudio.modulos.some((modulo) => {
                    const nota = estudio.notasPorModulo?.[modulo.id];
                    return nota === null || nota === undefined;
                });
            });
            if (hayNotasInvalidas) {
                throw new Error('Debes indicar nota en todos los módulos aportados.');
            }

            const idModulosAportados = this.estudios.flatMap(e => e.modulos.map(m => m.id));
            const modulosAportadosDetalle = this.estudios.flatMap((estudio) =>
                estudio.modulos.map((modulo) => ({
                    id_modulo: Number(modulo.id),
                    nota: estudio.notasPorModulo?.[modulo.id] ?? null,
                }))
            );
            const ciclosAportadosDetalle = this.estudios
                .filter((estudio) => estudio.cicloCompleto === true)
                .map((estudio) => ({
                    id_ciclo: Number(estudio.ciclo.id),
                    nota_media: estudio.notaMediaCiclo ?? null,
                }));
            const acreditacionesRegistradas = this.acreditaciones
                .filter(a => a.tipo !== 'otros')
                .map(a => a.id);
            const acreditacionesNoRegistradas = this.acreditaciones
                .filter(a => a.tipo === 'otros')
                .map(a => a.nombre.trim())
                .filter(Boolean);

            const solicitudesRegistradas = this.convalidacionesSolicitadas.map(item => ({
                id_modulo_destino: Number(item.id),
                id_convalidacion: item.id_convalidacion ?? null,
                id_convalidacion_ciclo: item.id_convalidacion_ciclo ?? null,
                descripcion: null,
                nota_media_origen: this.parseNotaFlexible(item.nota_media_origen),
            }));
            const solicitudesRegistradasManuales = this.convalidacionesService.otrosModulosCicloRegistrados.map(item => ({
                id_modulo_destino: Number(item.id),
                id_convalidacion: null,
                id_convalidacion_ciclo: null,
                descripcion: null,
                nota_media_origen: null,
            }));
            const solicitudesRegistradasUnicas = this.deduplicarSolicitudesRegistradas([
                ...solicitudesRegistradas,
                ...solicitudesRegistradasManuales,
            ]);

            const descripcionNoRegistrados = [
                ...this.otrosCiclosModulosCursados,
                ...acreditacionesNoRegistradas,
            ];

            payload = {
                nombre: this.personalData.nombre,
                apellidos: this.personalData.apellidos,
                dni: this.personalData.dni,
                email: this.personalData.email,
                estado: 0,
                enviado_at: null,
                anotaciones: null,
                id_modulos_registrados_aportados: [...new Set(idModulosAportados)],
                modulos_aportados_detalle: modulosAportadosDetalle,
                ciclos_aportados_detalle: ciclosAportadosDetalle.length > 0 ? ciclosAportadosDetalle : null,
                id_acreditaciones_registradas_aportadas: [...new Set(acreditacionesRegistradas)],
                descripcion_no_registrados: descripcionNoRegistrados.length > 0 ? descripcionNoRegistrados : null,
                solicitudes_registradas: solicitudesRegistradasUnicas,
                solicitudes_no_registradas: [...this.otrosSolicitudes],
            };
        } catch (e: any) {
            this.enviando = false;
            this.error = e?.message || 'Error preparando el envío del formulario.';
            this.cdr.detectChanges();
            return;
        }

        this.convalidacionesService.enviarFormularioCompleto(payload)
            .pipe(timeout(20000), finalize(() => {
                this.enviando = false;
                this.cdr.detectChanges();
            }))
            .subscribe({
                next: () => {
                    this.error = null;
                    this.enviado = true;
                    this.submitted.emit();
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    if (err?.status === 200) {
                        this.error = null;
                        this.enviado = true;
                        this.submitted.emit();
                        this.cdr.detectChanges();
                        return;
                    }
                    this.error = err?.error?.detail ?? 'Error al enviar el formulario. Inténtalo de nuevo.';
                    this.cdr.detectChanges();
                }
            });
    }

    private deduplicarSolicitudesRegistradas(
        items: Array<{ id_modulo_destino: number; id_convalidacion: number | null; id_convalidacion_ciclo: number | null; descripcion: null; nota_media_origen: number | null }>
    ): Array<{ id_modulo_destino: number; id_convalidacion: number | null; id_convalidacion_ciclo: number | null; descripcion: null }> {
        const byModulo = new Map<number, { id_modulo_destino: number; id_convalidacion: number | null; id_convalidacion_ciclo: number | null; descripcion: null; nota_media_origen: number | null }>();

        for (const item of items) {
            const moduloId = Number(item.id_modulo_destino);
            if (!Number.isFinite(moduloId)) continue;

            const current = byModulo.get(moduloId);
            if (!current) {
                byModulo.set(moduloId, {
                    id_modulo_destino: moduloId,
                    id_convalidacion: item.id_convalidacion ?? null,
                    id_convalidacion_ciclo: item.id_convalidacion_ciclo ?? null,
                    descripcion: null,
                    nota_media_origen: item.nota_media_origen ?? null,
                });
                continue;
            }

            const currentEsAutomatica = current.id_convalidacion !== null || current.id_convalidacion_ciclo !== null;
            const itemEsAutomatica = item.id_convalidacion !== null || item.id_convalidacion_ciclo !== null;
            const currentNota = this.parseNotaFlexible(current.nota_media_origen);
            const itemNota = this.parseNotaFlexible(item.nota_media_origen);
            const itemTieneMejorNota = itemNota !== null && (currentNota === null || itemNota > currentNota);
            const mismaNaturaleza = currentEsAutomatica === itemEsAutomatica;

            if ((!currentEsAutomatica && itemEsAutomatica) || (mismaNaturaleza && itemTieneMejorNota)) {
                byModulo.set(moduloId, {
                    id_modulo_destino: moduloId,
                    id_convalidacion: item.id_convalidacion ?? null,
                    id_convalidacion_ciclo: item.id_convalidacion_ciclo ?? null,
                    descripcion: null,
                    nota_media_origen: item.nota_media_origen ?? null,
                });
            }
        }

        return Array.from(byModulo.values()).map(({ nota_media_origen: _nota, ...item }) => item);
    }

    private deduplicarConvalidacionesSolicitadasPorMejorNota(items: SelectedConvalidation[]): SelectedConvalidation[] {
        const byModulo = new Map<number, SelectedConvalidation>();

        for (const item of items || []) {
            const moduloId = Number(item.id);
            if (!Number.isFinite(moduloId)) continue;

            const current = byModulo.get(moduloId);
            if (!current) {
                byModulo.set(moduloId, item);
                continue;
            }

            const currentEsAutomatica = current.id_convalidacion !== null || current.id_convalidacion_ciclo !== null;
            const itemEsAutomatica = item.id_convalidacion !== null || item.id_convalidacion_ciclo !== null;
            const currentNota = this.parseNotaFlexible(current.nota_media_origen);
            const itemNota = this.parseNotaFlexible(item.nota_media_origen);
            const itemTieneMejorNota = itemNota !== null && (currentNota === null || itemNota > currentNota);
            const mismaNaturaleza = currentEsAutomatica === itemEsAutomatica;

            if ((!currentEsAutomatica && itemEsAutomatica) || (mismaNaturaleza && itemTieneMejorNota)) {
                byModulo.set(moduloId, item);
            }
        }

        return Array.from(byModulo.values()).sort((a, b) =>
            String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
        );
    }
}
