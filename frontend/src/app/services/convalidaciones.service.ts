import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EstudioEntry, AcreditacionExterna } from '../components/estudios-cursados/estudios-cursados.component';

const API_BASE = 'http://localhost:8000/convalidaciones';

@Injectable({ providedIn: 'root' })
export class ConvalidacionesService {

    private estudiosSubject = new BehaviorSubject<EstudioEntry[]>([]);
    estudios$ = this.estudiosSubject.asObservable();

    private acreditacionesSubject = new BehaviorSubject<AcreditacionExterna[]>([]);
    acreditaciones$ = this.acreditacionesSubject.asObservable();

    // Persist Results-tab filter and user selections
    targetGradoId: number | null = null;
    targetCicloId: number | null = null;
    sharedSelectedModuleSources: Map<number, string> = new Map();

    constructor(private http: HttpClient) { }

    setEstudios(estudios: EstudioEntry[]): void {
        this.estudiosSubject.next(estudios);
    }

    setAcreditaciones(acreditaciones: AcreditacionExterna[]): void {
        this.acreditacionesSubject.next(acreditaciones);
    }

    getEstudios(): EstudioEntry[] {
        return this.estudiosSubject.value;
    }

    getAcreditaciones(): AcreditacionExterna[] {
        return this.acreditacionesSubject.value;
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
}
