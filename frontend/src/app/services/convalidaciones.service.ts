import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EstudioEntry, AcreditacionExterna } from '../components/estudios-cursados/estudios-cursados.component';

const API_BASE = 'http://localhost:8000/convalidaciones';
const ADMIN_API_BASE = 'http://localhost:8000/admin';

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

export interface AdminFormularioSolicitud {
    id: number;
    id_modulo_destino: number | null;
    id_convalidacion?: number | null;
    ciclo_id?: number | null;
    ciclo_nombre?: string | null;
    modulo_destino: string | null;
    modulo_destino_codigo?: string | null;
    convalidado_por?: string | null;
    convalidadoPor?: string | null;
    descripcion: string | null;
    estado_modulo_id?: number | null;
    estado_modulo?: string | null;
}

export interface AdminFormularioModuloAportado {
    id: number;
    id_modulo: number | null;
    nota?: number | null;
    ciclo_id?: number | null;
    ciclo_nombre?: string | null;
    modulo_nombre: string | null;
    modulo_codigo?: string | null;
    descripcion: string | null;
}

export interface AdminFormulario {
    id: number;
    id_alumno?: number;
    enviado_at: string | null;
    estado_id: number;
    estado: string | null;
    anotaciones: string | null;
    validado_at: string | null;
    alumno: {
        nombre: string;
        dni: string;
        email: string;
    };
    solicitudes?: AdminFormularioSolicitud[];
    modulos_aportados?: AdminFormularioModuloAportado[];
}

export interface AdminSolicitudEstadoUpdateResponse {
    id: number;
    estado_modulo_id: number;
    id_formulario?: number;
}

export interface AdminFormularioEstadoUpdateResponse {
    id: number;
    estado_id: number;
}

export interface AdminDeleteCicloResponse {
    ok: boolean;
    id: number;
}

export interface AdminDeleteModuloResponse {
    ok: boolean;
    id: number;
}

export interface AdminDeleteConvalidacionResponse {
    ok: boolean;
    id: number;
}

export interface AdminDeleteConvalidacionOrigenResponse {
    ok: boolean;
    id_convalidacion: number;
    id_modulo_origen: number;
}

export interface AdminCreateCicloRequest {
    nombre: string;
    id_familia: number;
    id_grado: number;
}

export interface AdminCreateModuloItemRequest {
    id_oficial?: string | null;
    nombre: string;
}

export interface AdminCreateModulosRequest {
    modulos: AdminCreateModuloItemRequest[];
}

export interface AdminCreateConvalidacionRequest {
    id_modulo_destino: number;
    id_modulos_origen: number[];
    source_link?: string | null;
    source_page?: number | null;
}

export interface AdminCreateConvalidacionResponse {
    ok: boolean;
    id: number;
    id_modulo_destino: number;
    id_modulos_origen: number[];
}

export interface AdminLoginResponse {
    ok: boolean;
    id: number;
    nombre: string;
    token: string;
}

export interface AdminCicloModulo {
    id: number;
    nombre: string;
    id_oficial: string | null;
}

export interface AdminCicloConModulos {
    id: number;
    nombre: string;
    id_oficial: string | null;
    normativa: string | null;
    id_familia: number | null;
    id_grado: number | null;
    familia_nombre?: string | null;
    grado_nombre?: string | null;
    total_modulos: number;
    modulos: AdminCicloModulo[];
}

export interface AdminConvalidacionOrigen {
    id_modulo_origen: number;
    modulo_origen_nombre: string;
    modulo_origen_codigo?: string | null;
    id_ciclo_origen: number;
    ciclo_origen_nombre: string;
}

export interface AdminConvalidacionRegla {
    id: number;
    source_link: string | null;
    source_page: number | null;
    id_modulo_destino: number;
    modulo_destino_nombre: string;
    modulo_destino_codigo?: string | null;
    id_ciclo_destino: number;
    ciclo_destino_nombre: string;
    origenes: AdminConvalidacionOrigen[];
}

export interface AdminUser {
    id: number;
    nombre: string;
    created_at: string | null;
}

export interface AdminCreateUserRequest {
    nombre: string;
    password: string;
}

export interface AdminCreateUserResponse {
    ok: boolean;
    id: number;
    nombre: string;
    created_at: string | null;
}

export interface AdminUpdateUserRequest {
    nombre?: string;
    password?: string;
}

export interface AdminUpdateUserResponse {
    ok: boolean;
    id: number;
}

export interface AdminDeleteUserResponse {
    ok: boolean;
    id: number;
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

    private getAdminAuthHeaders(): { headers?: HttpHeaders } {
        try {
            const raw = localStorage.getItem('somo_admin_session');
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            const token = typeof parsed?.token === 'string' ? parsed.token.trim() : '';
            if (!token) return {};
            return {
                headers: new HttpHeaders({
                    Authorization: `Bearer ${token}`,
                }),
            };
        } catch {
            return {};
        }
    }

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

    getFormulariosAdmin(): Observable<AdminFormulario[]> {
        return this.http.get<AdminFormulario[]>(`${ADMIN_API_BASE}/formularios`, this.getAdminAuthHeaders());
    }

    actualizarEstadoFormularioAdmin(
        idFormulario: number,
        estadoId: number,
        adminId?: number | null
    ): Observable<AdminFormularioEstadoUpdateResponse> {
        return this.http.put<AdminFormularioEstadoUpdateResponse>(
            `${ADMIN_API_BASE}/formularios/${idFormulario}/estado`,
            { estado_id: estadoId, admin_id: adminId ?? null },
            this.getAdminAuthHeaders()
        );
    }

    actualizarEstadoSolicitudAdmin(
        idSolicitud: number,
        estadoModuloId: number,
        adminId?: number | null
    ): Observable<AdminSolicitudEstadoUpdateResponse> {
        return this.http.put<AdminSolicitudEstadoUpdateResponse>(
            `${ADMIN_API_BASE}/solicitudes/${idSolicitud}/estado`,
            { estado_modulo_id: estadoModuloId, admin_id: adminId ?? null },
            this.getAdminAuthHeaders()
        );
    }

    loginAdmin(nombre: string, password: string): Observable<AdminLoginResponse> {
        return this.http.post<AdminLoginResponse>(`${ADMIN_API_BASE}/login`, { nombre, password });
    }

    getCiclosModulosAdmin(): Observable<AdminCicloConModulos[]> {
        return this.http.get<AdminCicloConModulos[]>(`${ADMIN_API_BASE}/ciclos-modulos`, this.getAdminAuthHeaders());
    }

    crearCicloAdmin(payload: AdminCreateCicloRequest): Observable<{ ok: boolean }> {
        return this.http.post<{ ok: boolean }>(`${ADMIN_API_BASE}/ciclos`, payload, this.getAdminAuthHeaders());
    }

    crearModulosAdmin(idCiclo: number, payload: AdminCreateModulosRequest): Observable<{ ok: boolean; inserted: number }> {
        return this.http.post<{ ok: boolean; inserted: number }>(
            `${ADMIN_API_BASE}/ciclos/${idCiclo}/modulos`,
            payload,
            this.getAdminAuthHeaders()
        );
    }

    crearConvalidacionAdmin(
        payload: AdminCreateConvalidacionRequest
    ): Observable<AdminCreateConvalidacionResponse> {
        return this.http.post<AdminCreateConvalidacionResponse>(
            `${ADMIN_API_BASE}/crear_convalidaciones`,
            payload,
            this.getAdminAuthHeaders()
        );
    }

    getConvalidacionesAdmin(gradoId?: number | null, cicloId?: number | null): Observable<AdminConvalidacionRegla[]> {
        const params = new URLSearchParams();
        if (gradoId !== null && gradoId !== undefined) {
            params.set('grado_id', String(gradoId));
        }
        if (cicloId !== null && cicloId !== undefined) {
            params.set('ciclo_id', String(cicloId));
        }
        const query = params.toString();
        const url = query
            ? `${ADMIN_API_BASE}/convalidaciones?${query}`
            : `${ADMIN_API_BASE}/convalidaciones`;
        return this.http.get<AdminConvalidacionRegla[]>(url, this.getAdminAuthHeaders());
    }

    getAdministradoresAdmin(): Observable<AdminUser[]> {
        return this.http.get<AdminUser[]>(`${ADMIN_API_BASE}/listar_administradores`, this.getAdminAuthHeaders());
    }

    exportarSolicitudesConvalidacionAdmin(): Observable<Blob> {
        return this.http.get(`${ADMIN_API_BASE}/exportar_solicitudes_convalidacion`, {
            ...this.getAdminAuthHeaders(),
            responseType: 'blob',
        });
    }

    crearAdministradorAdmin(payload: AdminCreateUserRequest): Observable<AdminCreateUserResponse> {
        return this.http.post<AdminCreateUserResponse>(
            `${ADMIN_API_BASE}/crear_administrador`,
            payload,
            this.getAdminAuthHeaders()
        );
    }

    actualizarAdministradorAdmin(
        idAdmin: number,
        payload: AdminUpdateUserRequest
    ): Observable<AdminUpdateUserResponse> {
        return this.http.put<AdminUpdateUserResponse>(
            `${ADMIN_API_BASE}/actualizar_administrador/${idAdmin}`,
            payload,
            this.getAdminAuthHeaders()
        );
    }

    eliminarAdministradorAdmin(idAdmin: number): Observable<AdminDeleteUserResponse> {
        return this.http.delete<AdminDeleteUserResponse>(
            `${ADMIN_API_BASE}/eliminar_administrador/${idAdmin}`,
            this.getAdminAuthHeaders()
        );
    }

    eliminarCicloAdmin(idCiclo: number): Observable<AdminDeleteCicloResponse> {
        return this.http.delete<AdminDeleteCicloResponse>(`${ADMIN_API_BASE}/ciclos/${idCiclo}`, this.getAdminAuthHeaders());
    }

    eliminarModuloAdmin(idModulo: number): Observable<AdminDeleteModuloResponse> {
        return this.http.delete<AdminDeleteModuloResponse>(`${ADMIN_API_BASE}/modulos/${idModulo}`, this.getAdminAuthHeaders());
    }

    eliminarConvalidacionAdmin(idConvalidacion: number): Observable<AdminDeleteConvalidacionResponse> {
        return this.http.delete<AdminDeleteConvalidacionResponse>(
            `${ADMIN_API_BASE}/convalidaciones/${idConvalidacion}`,
            this.getAdminAuthHeaders()
        );
    }

    eliminarConvalidacionOrigenAdmin(
        idConvalidacion: number,
        idModuloOrigen: number
    ): Observable<AdminDeleteConvalidacionOrigenResponse> {
        return this.http.delete<AdminDeleteConvalidacionOrigenResponse>(
            `${ADMIN_API_BASE}/convalidaciones/${idConvalidacion}/origenes/${idModuloOrigen}`,
            this.getAdminAuthHeaders()
        );
    }
}
