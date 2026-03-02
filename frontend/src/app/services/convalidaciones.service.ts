import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EstudioEntry, AcreditacionExterna } from '../components/estudios-cursados/estudios-cursados.component';

const API_BASE = 'http://localhost:8000/convalidaciones';

export interface PersonalData {
    nombre: string;
    apellidos: string;
    dni: string;
    email: string;
}

export interface SelectedConvalidation {
    id: number;
    nombre: string;
    source: string;
    id_convalidacion?: number | null;
}

export interface RegisteredManualModule {
    id: number;
    nombre: string;
}

export type DocumentoCategoria = 'dni' | 'certificado' | 'otros';

export interface UploadedDocument {
    file: File;
    displayName: string;
    categoria: DocumentoCategoria;
}

@Injectable({ providedIn: 'root' })
export class ConvalidacionesService {

    private estudiosSubject = new BehaviorSubject<EstudioEntry[]>([]);
    estudios$ = this.estudiosSubject.asObservable();

    private acreditacionesSubject = new BehaviorSubject<AcreditacionExterna[]>([]);
    acreditaciones$ = this.acreditacionesSubject.asObservable();
    private otrosCiclosModulosSubject = new BehaviorSubject<string[]>([]);
    otrosCiclosModulos$ = this.otrosCiclosModulosSubject.asObservable();

    private personalDataSubject = new BehaviorSubject<PersonalData>({
        nombre: '',
        apellidos: '',
        dni: '',
        email: '',
    });
    personalData$ = this.personalDataSubject.asObservable();

    // Persist Results-tab filter and user selections
    targetGradoId: number | null = null;
    targetCicloId: number | null = null;
    targetGradoNombre = '';
    targetCicloNombre = '';
    otrosModulosCiclo: string[] = [];
    otrosSolicitudes: string[] = [];
    otrosModulosCicloRegistrados: RegisteredManualModule[] = [];
    sharedSelectedModuleSources: Map<number, string> = new Map();
    sharedSelectedConvalidations: SelectedConvalidation[] = [];
    documentoDni: UploadedDocument | null = null;
    documentosCertificado: UploadedDocument[] = [];
    documentosOtros: UploadedDocument[] = [];

    constructor(private http: HttpClient) { }

    setEstudios(estudios: EstudioEntry[]): void {
        this.estudiosSubject.next(estudios);

        // Las convalidaciones automáticas dependen de los estudios aportados.
        // Si cambian los estudios, invalidamos selecciones derivadas del paso 3.
        this.sharedSelectedModuleSources = new Map();
        this.sharedSelectedConvalidations = [];
        this.otrosModulosCiclo = [];
    }

    setAcreditaciones(acreditaciones: AcreditacionExterna[]): void {
        this.acreditacionesSubject.next(acreditaciones);
    }

    setOtrosCiclosModulos(items: string[]): void {
        this.otrosCiclosModulosSubject.next(items);
    }

    getEstudios(): EstudioEntry[] {
        return this.estudiosSubject.value;
    }

    getAcreditaciones(): AcreditacionExterna[] {
        return this.acreditacionesSubject.value;
    }

    getOtrosCiclosModulos(): string[] {
        return this.otrosCiclosModulosSubject.value;
    }

    setPersonalData(personalData: PersonalData): void {
        this.personalDataSubject.next(personalData);
    }

    getPersonalData(): PersonalData {
        return this.personalDataSubject.value;
    }

    calcularConvalidaciones(targetCicloId?: number): Observable<any[]> {
        const modulo_ids = this.estudiosSubject.value.flatMap(e => e.modulos.map(m => m.id));
        const acreditacion_ids = this.acreditacionesSubject.value
            .filter(a => a.tipo !== 'otros')
            .map(a => a.id);

        if (modulo_ids.length === 0 && acreditacion_ids.length === 0) {
            return of([]);
        }

        return this.http.post<any[]>(`${API_BASE}/calcular`, {
            modulo_ids: [...new Set(modulo_ids)],
            acreditacion_ids: [...new Set(acreditacion_ids)],
            target_ciclo_id: targetCicloId || null
        }).pipe(
            catchError(err => {
                console.error('Error al calcular convalidaciones:', err);
                return of([]);
            })
        );
    }

    setDocumentoDni(file: File | null): void {
        this.documentoDni = file
            ? { file, categoria: 'dni', displayName: file.name }
            : null;
    }

    setDocumentosCertificado(files: File[]): void {
        this.documentosCertificado = files.map((file) => ({
            file,
            categoria: 'certificado',
            displayName: file.name,
        }));
    }

    addDocumentosCertificado(files: File[]): void {
        const nuevos = files.map((file) => ({
            file,
            categoria: 'certificado' as const,
            displayName: file.name,
        }));
        this.documentosCertificado = [...this.documentosCertificado, ...nuevos];
    }

    setDocumentosOtros(files: File[]): void {
        this.documentosOtros = files.map((file) => ({
            file,
            categoria: 'otros',
            displayName: file.name,
        }));
    }

    addDocumentosOtros(files: File[]): void {
        const nuevos = files.map((file) => ({
            file,
            categoria: 'otros' as const,
            displayName: file.name,
        }));
        this.documentosOtros = [...this.documentosOtros, ...nuevos];
    }
}
