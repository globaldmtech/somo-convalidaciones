import { Injectable, signal } from '@angular/core';
import { FormularioDraftSnapshot } from './formulario-oficial.types';

// Servicio de estado temporal del formulario oficial.
// Se usa para conservar los datos entre la página del formulario y la página de verificación.
@Injectable({
  providedIn: 'root'
})
export class FormularioOficialDraftService {
  private readonly snapshotSignal = signal<FormularioDraftSnapshot | null>(null);

  // Devuelve el snapshot actual guardado del formulario.
  getSnapshot(): FormularioDraftSnapshot | null {
    return this.snapshotSignal();
  }

  // Guarda o reemplaza el snapshot completo del formulario en memoria.
  saveSnapshot(snapshot: FormularioDraftSnapshot): void {
    this.snapshotSignal.set({ ...snapshot });
  }

  // Marca la solicitud como enviada y registra la fecha/hora de envío.
  // Si no hay snapshot en memoria, no aplica cambios.
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
