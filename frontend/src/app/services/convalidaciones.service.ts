import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EstudioEntry, AcreditacionExterna } from '../components/estudios-cursados/estudios-cursados.component';
import { ADMIN_API_BASE, API_BASE } from '../config/api-paths';

export type PersonalDocumentType = 'dni' | 'nie' | 'otro';

export interface PersonalData {
    documentType: PersonalDocumentType;
    nombre: string;
    apellidos: string;
    dni: string;
    email: string;
}

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function normalizePersonalDocumentNumber(type: PersonalDocumentType, value: string): string {
    const upperValue = String(value || '').trim().toUpperCase();

    if (type === 'dni' || type === 'nie') {
        return upperValue.replace(/[\s-]+/g, '');
    }

    return upperValue.replace(/\s+/g, ' ');
}

function isValidDniLetter(number: number, letter: string): boolean {
    return DNI_LETTERS[number % 23] === letter;
}

export function isValidPersonalDocumentNumber(type: PersonalDocumentType, value: string): boolean {
    const normalized = normalizePersonalDocumentNumber(type, value);
    if (!normalized) {
        return false;
    }

    if (type === 'dni') {
        if (!/^\d{8}[A-Z]$/.test(normalized)) {
            return false;
        }
        return isValidDniLetter(Number(normalized.slice(0, 8)), normalized.slice(-1));
    }

    if (type === 'nie') {
        if (!/^[XYZ]\d{7}[A-Z]$/.test(normalized)) {
            return false;
        }
        const prefixMap: Record<string, string> = { X: '0', Y: '1', Z: '2' };
        const numericValue = `${prefixMap[normalized[0]]}${normalized.slice(1, 8)}`;
        return isValidDniLetter(Number(numericValue), normalized.slice(-1));
    }

    return /^[A-Z0-9](?:[A-Z0-9 /.-]{1,28}[A-Z0-9])?$/.test(normalized);
}

export function getPersonalDocumentTypeLabel(type: PersonalDocumentType): string {
    switch (type) {
        case 'nie':
            return 'NIE';
        case 'otro':
            return 'Otro documento';
        case 'dni':
        default:
            return 'DNI';
    }
}

export interface SelectedConvalidation {
    id: number;
    nombre: string;
    source: string;
    ciclo_origen?: string | null;
    origen_tipo?: string | null;
    modulos_origen?: string | null;
    modulos_origen_ids?: string | null;
    nota_media_origen?: number | null;
    id_convalidacion?: number | null;
    id_convalidacion_ciclo?: number | null;
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
    id_convalidacion_ciclo?: number | null;
    nota_manual?: number | null;
    nota_media_origen?: number | null;
    ciclo_id?: number | null;
    ciclo_nombre?: string | null;
    modulo_destino: string | null;
    modulo_destino_codigo?: string | null;
    convalidado_por?: string | null;
    convalidado_por_ids?: string | null;
    convalidadoPor?: string | null;
    convalidadoPorIds?: string | null;
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
    modulo_numerico?: number | null;
    descripcion: string | null;
}

export interface AdminFormularioDocumentoAportado {
    id: number;
    nombre_archivo: string;
    descripcion: string | null;
    ruta_almacenamiento: string;
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
    documentos_aportados?: AdminFormularioDocumentoAportado[];
}

export interface AdminSolicitudEstadoUpdateResponse {
    id: number;
    estado_modulo_id: number;
    id_formulario?: number;
    nota_manual?: number | null;
}

export interface AdminFormularioEstadoUpdateResponse {
    id: number;
    estado_id: number;
}

export interface AdminDeleteFormularioResponse {
    ok: boolean;
    id: number;
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
    numerico: number;
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

export interface AdminCreateConvalidacionMasivaItemRequest {
    id_modulo_destino: number;
    id_modulo_origen: number;
}

export interface AdminCreateConvalidacionCicloMasivaItemRequest {
    id_modulo_destino: number;
    id_ciclo_origen: number;
}

export interface AdminCreateConvalidacionesMasivasRequest {
    reglas: AdminCreateConvalidacionMasivaItemRequest[];
    source_link?: string | null;
    source_page?: number | null;
}

export interface AdminCreateConvalidacionesCicloMasivasRequest {
    reglas: AdminCreateConvalidacionCicloMasivaItemRequest[];
    source_link?: string | null;
    source_page?: number | null;
}

export interface AdminCreateConvalidacionCicloRequest {
    id_modulo_destino: number;
    id_ciclo_origen: number;
    source_link?: string | null;
    source_page?: number | null;
}

export interface AdminCreateConvalidacionResponse {
    ok: boolean;
    id: number;
    id_modulo_destino: number;
    id_modulos_origen: number[];
}

export interface AdminCreateConvalidacionesMasivasResponse {
    ok: boolean;
    created_count: number;
    skipped_count: number;
    skipped_existing_count: number;
    created: AdminCreateConvalidacionResponse[];
}

export interface AdminDeleteConvalidacionesMasivasRequest {
    reglas: AdminCreateConvalidacionMasivaItemRequest[];
}

export interface AdminDeleteConvalidacionesCicloMasivasRequest {
    reglas: AdminCreateConvalidacionCicloMasivaItemRequest[];
}

export interface AdminDeleteConvalidacionesMasivasResponse {
    ok: boolean;
    deleted_count: number;
    skipped_count: number;
    skipped_missing_count: number;
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
    numerico?: number | null;
    deprecated?: number | null;
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
    id_modulo_origen: number | null;
    modulo_origen_nombre: string | null;
    modulo_origen_codigo?: string | null;
    id_ciclo_origen: number;
    ciclo_origen_nombre: string;
    es_ciclo_completo?: boolean;
}

export interface AdminConvalidacionRegla {
    id: number;
    tipo_regla?: 'modulo' | 'ciclo';
    source_link: string | null;
    source_page: number | null;
    id_modulo_destino: number;
    modulo_destino_nombre: string;
    modulo_destino_codigo?: string | null;
    id_ciclo_destino: number;
    ciclo_destino_nombre: string;
    id_convalidacion_ciclo?: number | null;
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
        documentType: 'dni',
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
        const modulos_aportados = this.getApprovedModuloDetails();
        const acreditacion_ids = this.acreditacionesSubject.value
            .filter(a => a.tipo !== 'otros')
            .map(a => a.id);
        const ciclos_completos = this.estudiosSubject.value
            .filter((estudio) => estudio.cicloCompleto === true && typeof estudio.notaMediaCiclo === 'number' && Number.isFinite(estudio.notaMediaCiclo))
            .map((estudio) => ({
                id_ciclo: Number(estudio.ciclo.id),
                nota_media: Number(estudio.notaMediaCiclo),
            }));

        if (modulos_aportados.length === 0 && acreditacion_ids.length === 0 && ciclos_completos.length === 0) {
            return of([]);
        }

        return this.http.post<any[]>(`${API_BASE}/calcular`, {
            modulos_aportados,
            acreditacion_ids: [...new Set(acreditacion_ids)],
            ciclos_completos,
            target_ciclo_id: targetCicloId || null
        }).pipe(
            catchError(err => {
                console.error('Error al calcular convalidaciones:', err);
                return of([]);
            })
        );
    }

    private getApprovedModuloDetails(): Array<{ id_modulo: number; nota: number }> {
        const bestByModulo = new Map<number, number>();
        for (const estudio of this.estudiosSubject.value) {
            for (const modulo of estudio.modulos || []) {
                const moduloId = Number(modulo.id);
                if (!Number.isFinite(moduloId)) {
                    continue;
                }
                if (!this.isModuloApproved(estudio, moduloId, modulo.numerico !== 0)) {
                    continue;
                }
                const nota = estudio.notasPorModulo?.[moduloId];
                if (typeof nota !== 'number' || !Number.isFinite(nota)) {
                    continue;
                }
                const current = bestByModulo.get(moduloId);
                if (current === undefined || nota > current) {
                    bestByModulo.set(moduloId, nota);
                }
            }
        }
        return Array.from(bestByModulo.entries()).map(([id_modulo, nota]) => ({ id_modulo, nota }));
    }

    private isModuloApproved(estudio: EstudioEntry, moduloId: number, isNumerico: boolean): boolean {
        const nota = estudio.notasPorModulo?.[moduloId];
        if (isNumerico) {
            return typeof nota === 'number' && Number.isFinite(nota) && nota >= 5;
        }

        const resultado = (estudio.resultadosPorModulo?.[moduloId] || '').trim().toUpperCase();
        if (resultado === 'APTO' || resultado === 'EXENTO') {
            return true;
        }

        return nota === 1 || nota === 2;
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

    hasDuplicateDocumentNames(): boolean {
        return this.getDuplicateDocumentNames().length > 0;
    }

    getDuplicateDocumentNames(): string[] {
        return this.getDuplicateDocumentNamesForDocuments(this.getAllUploadedDocuments());
    }

    getDuplicateDocumentNamesForDocuments(documents: UploadedDocument[]): string[] {
        const duplicates = new Map<string, string>();
        const seen = new Map<string, string>();

        for (const document of documents) {
            const storageKey = this.buildDocumentStorageKey(document);
            if (!storageKey) {
                continue;
            }

            const currentName = document.displayName.trim() || document.file.name;
            const existingName = seen.get(storageKey);
            if (existingName) {
                duplicates.set(storageKey, existingName || currentName);
                continue;
            }
            seen.set(storageKey, currentName);
        }

        return Array.from(duplicates.values());
    }

    private getAllUploadedDocuments(): UploadedDocument[] {
        return [
            ...(this.documentoDni ? [this.documentoDni] : []),
            ...this.documentosCertificado,
            ...this.documentosOtros,
        ];
    }

    private buildDocumentStorageKey(document: UploadedDocument): string {
        const extension = this.getFileExtension(document.file.name);
        const safeDescription = this.sanitizeDocumentName(document.displayName.trim() || document.file.name);
        return `${safeDescription}${extension}`;
    }

    private getFileExtension(fileName: string): string {
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex <= 0) {
            return '';
        }
        return fileName.slice(lastDotIndex);
    }

    private sanitizeDocumentName(value: string): string {
        const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        const sanitized = normalized.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[._-]+|[._-]+$/g, '');
        return sanitized || 'documento';
    }

    enviarFormularioCompleto(payload: unknown): Observable<unknown> {
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));

        if (this.documentoDni) {
            formData.append('documento_dni', this.documentoDni.file, this.documentoDni.file.name);
            formData.append('documento_dni_nombre', this.documentoDni.displayName);
        }

        for (const documento of this.documentosCertificado) {
            formData.append('documentos_certificado', documento.file, documento.file.name);
        }
        formData.append(
            'documentos_certificado_nombres',
            JSON.stringify(this.documentosCertificado.map((documento) => documento.displayName))
        );

        for (const documento of this.documentosOtros) {
            formData.append('documentos_otros', documento.file, documento.file.name);
        }
        formData.append(
            'documentos_otros_nombres',
            JSON.stringify(this.documentosOtros.map((documento) => documento.displayName))
        );

        return this.http.post(`${API_BASE}/insertar_formulario_completo`, formData);
    }

    getFormulariosAdmin(estadoId?: number | null): Observable<AdminFormulario[]> {
        const options = this.getAdminAuthHeaders();
        const params = estadoId === null || estadoId === undefined
            ? undefined
            : new HttpParams().set('estado_id', String(estadoId));
        return this.http.get<AdminFormulario[]>(`${ADMIN_API_BASE}/formularios`, {
            ...options,
            params,
        });
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

    eliminarFormularioAdmin(idFormulario: number): Observable<AdminDeleteFormularioResponse> {
        return this.http.delete<AdminDeleteFormularioResponse>(
            `${ADMIN_API_BASE}/formularios/${idFormulario}`,
            this.getAdminAuthHeaders()
        );
    }

    actualizarEstadoSolicitudAdmin(
        idSolicitud: number,
        estadoModuloId: number,
        notaManual?: number | null,
        adminId?: number | null
    ): Observable<AdminSolicitudEstadoUpdateResponse> {
        return this.http.put<AdminSolicitudEstadoUpdateResponse>(
            `${ADMIN_API_BASE}/solicitudes/${idSolicitud}/estado`,
            { estado_modulo_id: estadoModuloId, admin_id: adminId ?? null, nota_manual: notaManual ?? null },
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

    crearConvalidacionesMasivasAdmin(
        payload: AdminCreateConvalidacionesMasivasRequest
    ): Observable<AdminCreateConvalidacionesMasivasResponse> {
        return this.http.post<AdminCreateConvalidacionesMasivasResponse>(
            `${ADMIN_API_BASE}/crear_convalidaciones_masivas`,
            payload,
            this.getAdminAuthHeaders()
        );
    }

    eliminarConvalidacionesMasivasAdmin(
        payload: AdminDeleteConvalidacionesMasivasRequest
    ): Observable<AdminDeleteConvalidacionesMasivasResponse> {
        return this.http.delete<AdminDeleteConvalidacionesMasivasResponse>(
            `${ADMIN_API_BASE}/convalidaciones_masivas`,
            {
                ...this.getAdminAuthHeaders(),
                body: payload,
            }
        );
    }

    crearConvalidacionCicloAdmin(
        payload: AdminCreateConvalidacionCicloRequest
    ): Observable<AdminCreateConvalidacionResponse> {
        return this.http.post<AdminCreateConvalidacionResponse>(
            `${ADMIN_API_BASE}/crear_convalidaciones_ciclo`,
            payload,
            this.getAdminAuthHeaders()
        );
    }

    crearConvalidacionesCicloMasivasAdmin(
        payload: AdminCreateConvalidacionesCicloMasivasRequest
    ): Observable<AdminCreateConvalidacionesMasivasResponse> {
        return this.http.post<AdminCreateConvalidacionesMasivasResponse>(
            `${ADMIN_API_BASE}/crear_convalidaciones_ciclo_masivas`,
            payload,
            this.getAdminAuthHeaders()
        );
    }

    eliminarConvalidacionesCicloMasivasAdmin(
        payload: AdminDeleteConvalidacionesCicloMasivasRequest
    ): Observable<AdminDeleteConvalidacionesMasivasResponse> {
        return this.http.delete<AdminDeleteConvalidacionesMasivasResponse>(
            `${ADMIN_API_BASE}/convalidaciones_ciclo_masivas`,
            {
                ...this.getAdminAuthHeaders(),
                body: payload,
            }
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

    abrirDocumentoAdmin(path: string): Observable<Blob> {
        const url = `${ADMIN_API_BASE}/documentos/abrir?path=${encodeURIComponent(path)}`;
        return this.http.get(url, {
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

    eliminarConvalidacionCicloAdmin(idConvalidacionCiclo: number): Observable<AdminDeleteConvalidacionResponse> {
        return this.http.delete<AdminDeleteConvalidacionResponse>(
            `${ADMIN_API_BASE}/convalidaciones-ciclo/${idConvalidacionCiclo}`,
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
