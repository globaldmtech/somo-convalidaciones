import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';
import {
    ConvalidacionesService,
    PersonalData,
    SelectedConvalidation,
    UploadedDocument,
} from '../../services/convalidaciones.service';
import { EstudioEntry, AcreditacionExterna } from '../estudios-cursados/estudios-cursados.component';

const API_BASE = 'http://localhost:8000/convalidaciones';

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
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.estudios = this.convalidacionesService.getEstudios();
        this.acreditaciones = this.convalidacionesService.getAcreditaciones();
        this.otrosCiclosModulosCursados = this.convalidacionesService.getOtrosCiclosModulos();
        this.personalData = this.convalidacionesService.getPersonalData();
        this.convalidacionesSolicitadas = [...this.convalidacionesService.sharedSelectedConvalidations];
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

    get documentoDni(): UploadedDocument | null {
        return this.convalidacionesService.documentoDni;
    }

    get documentosCertificado(): UploadedDocument[] {
        return this.convalidacionesService.documentosCertificado;
    }

    get documentosOtros(): UploadedDocument[] {
        return this.convalidacionesService.documentosOtros;
    }

    get documentosCompletos(): boolean {
        return !!this.documentoDni && this.documentosCertificado.length > 0;
    }

    enviar(): void {
        if (this.enviando) return;

        if (!this.documentosCompletos) {
            this.error = 'Debes subir DNI y certificado académico antes de enviar.';
            return;
        }

        this.enviando = true;
        this.error = null;
        let payload: any;
        try {
            const hayNotasInvalidas = this.estudios.some((estudio) => {
                if (estudio.modulos.length === 0) return false;
                if (estudio.allSelected) {
                    return estudio.notaMediaCiclo === null || estudio.notaMediaCiclo === undefined;
                }
                return estudio.modulos.some((modulo) => {
                    const nota = estudio.notasPorModulo?.[modulo.id];
                    return nota === null || nota === undefined;
                });
            });
            if (hayNotasInvalidas) {
                throw new Error('Debes indicar nota en todos los módulos aportados.');
            }

            const idModulosAportados = this.estudios.flatMap(e => e.modulos.map(m => m.id));
            const modulosAportadosDetalle = this.estudios.flatMap((estudio) => {
                if (estudio.allSelected && estudio.notaMediaCiclo !== null && estudio.notaMediaCiclo !== undefined) {
                    return estudio.modulos.map((modulo) => ({
                        id_modulo: Number(modulo.id),
                        nota: Number(estudio.notaMediaCiclo),
                    }));
                }
                return estudio.modulos.map((modulo) => ({
                    id_modulo: Number(modulo.id),
                    nota: estudio.notasPorModulo?.[modulo.id] ?? null,
                }));
            });
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
                descripcion: null,
            }));
            const solicitudesRegistradasManuales = this.convalidacionesService.otrosModulosCicloRegistrados.map(item => ({
                id_modulo_destino: Number(item.id),
                id_convalidacion: null,
                descripcion: null,
            }));

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
                id_acreditaciones_registradas_aportadas: [...new Set(acreditacionesRegistradas)],
                descripcion_no_registrados: descripcionNoRegistrados.length > 0 ? descripcionNoRegistrados : null,
                solicitudes_registradas: [...solicitudesRegistradas, ...solicitudesRegistradasManuales],
                solicitudes_no_registradas: [...this.otrosSolicitudes],
            };
        } catch (e: any) {
            this.enviando = false;
            this.error = e?.message || 'Error preparando el envío del formulario.';
            this.cdr.detectChanges();
            return;
        }

        this.http.post(`${API_BASE}/insertar_formulario_completo`, payload)
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
}
