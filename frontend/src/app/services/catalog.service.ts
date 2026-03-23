import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../config/api-paths';

@Injectable({ providedIn: 'root' })
export class CatalogService {
    constructor(private http: HttpClient) { }

    getGrados(): Observable<any[]> {
        return this.http.get<any[]>(`${API_BASE}/grados_existentes`);
    }

    getCiclos(gradoId?: number, soloSomorrostro = true): Observable<any[]> {
        const searchParams = new URLSearchParams();
        if (gradoId) {
            searchParams.set('grado_id', String(gradoId));
        }
        if (!soloSomorrostro) {
            searchParams.set('solo_somorrostro', 'false');
        }
        const params = searchParams.toString();
        return this.http.get<any[]>(`${API_BASE}/ciclos_existentes${params ? `?${params}` : ''}`);
    }

    getModulos(cicloId?: number): Observable<any[]> {
        const params = cicloId ? `?ciclo_id=${cicloId}` : '';
        return this.http.get<any[]>(`${API_BASE}/modulos_existentes${params}`);
    }

    getAcreditacionesExternas(): Observable<any[]> {
        return this.http.get<any[]>(`${API_BASE}/acreditaciones_externas`);
    }
}
