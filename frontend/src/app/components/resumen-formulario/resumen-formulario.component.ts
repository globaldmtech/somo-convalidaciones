import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ConvalidacionesService, PersonalData, SelectedConvalidation } from '../../services/convalidaciones.service';
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

    estudios: EstudioEntry[] = [];
    acreditaciones: AcreditacionExterna[] = [];
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
    documentoDni: File | null = null;
    documentoCertificado: File | null = null;
    documentoOtros: File | null = null;

    constructor(
        private convalidacionesService: ConvalidacionesService,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.estudios = this.convalidacionesService.getEstudios();
        this.acreditaciones = this.convalidacionesService.getAcreditaciones();
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

    onDocumentoChange(event: Event, tipo: 'dni' | 'certificado' | 'otros'): void {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files.length > 0 ? input.files[0] : null;
        if (tipo === 'dni') this.documentoDni = file;
        if (tipo === 'certificado') this.documentoCertificado = file;
        if (tipo === 'otros') this.documentoOtros = file;
    }

    get documentosCompletos(): boolean {
        return !!this.documentoDni && !!this.documentoCertificado;
    }

    enviar(): void {
        if (!this.documentosCompletos) {
            this.error = 'Debes subir DNI y certificado académico antes de enviar.';
            return;
        }

        this.enviando = true;
        this.error = null;

        const idModulosAportados = this.estudios.flatMap(e => e.modulos.map(m => m.id));

        const solicitudes = Array.from(this.convalidacionesService.sharedSelectedModuleSources.entries()).map(
            ([idModulo]) => ({ id_modulo_destino: idModulo, id_convalidacion: null, descripcion: null })
        );

        const descripciones: string[] = [];
        if (this.otrosModulosCiclo.length > 0) {
            descripciones.push(...this.otrosModulosCiclo.map(item => `[ciclo] ${item}`));
        }
        if (this.otrosSolicitudes.length > 0) {
            descripciones.push(...this.otrosSolicitudes.map(item => `[manual] ${item}`));
        }

        const payload = {
            id_alumno: 1,
            estado: null,
            enviado_at: null,
            anotaciones: null,
            id_modulos_aportados: idModulosAportados,
            descripcion_modulos: descripciones.length > 0 ? descripciones.join('\n') : null,
            solicitudes,
        };

        this.http.post(`${API_BASE}/insertar_formulario_completo`, payload).subscribe({
            next: () => {
                this.enviando = false;
                this.enviado = true;
            },
            error: (err) => {
                this.enviando = false;
                this.error = err?.error?.detail ?? 'Error al enviar el formulario. Inténtalo de nuevo.';
            }
        });
    }
}
