import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:8000/convalidaciones';

@Injectable({ providedIn: 'root' })
export class CatalogService {
    constructor(private http: HttpClient) { }

    getGrados(): Observable<any[]> {
        return this.http.get<any[]>(`${API_BASE}/grados_existentes`);
    }

    getCiclos(gradoId?: number): Observable<any[]> {
        const params = gradoId ? `?grado_id=${gradoId}` : '';
        return this.http.get<any[]>(`${API_BASE}/ciclos_existentes${params}`);
    }

    getModulos(cicloId?: number): Observable<any[]> {
        const params = cicloId ? `?ciclo_id=${cicloId}` : '';
        return this.http.get<any[]>(`${API_BASE}/modulos_existentes${params}`);
    }

    getAcreditacionesExternas(): Observable<any[]> {
        return this.http.get<any[]>(`${API_BASE}/acreditaciones_externas`);
    }
}
