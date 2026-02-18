import { Injectable, signal } from '@angular/core';
import { FormularioDraftSnapshot } from './formulario-oficial.types';

@Injectable({
  providedIn: 'root'
})
export class FormularioOficialDraftService {
  private readonly snapshotSignal = signal<FormularioDraftSnapshot | null>(null);

  getSnapshot(): FormularioDraftSnapshot | null {
    return this.snapshotSignal();
  }

  saveSnapshot(snapshot: FormularioDraftSnapshot): void {
    this.snapshotSignal.set({ ...snapshot });
  }

  updateSubmission(fechaSolicitud: string): void {
    const snapshot = this.snapshotSignal();
    if (!snapshot) return;
    this.snapshotSignal.set({
      ...snapshot,
      submitted: true,
      fechaSolicitud
    });
  }
}
