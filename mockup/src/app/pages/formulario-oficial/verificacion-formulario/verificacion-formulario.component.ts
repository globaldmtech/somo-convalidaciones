import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormularioOficialDraftService } from '../formulario-oficial-draft.service';
import {
  DocumentoEntry,
  EstudioEntry,
  EstudiosTipo,
  FormularioDraftSnapshot,
  RequestedModule
} from '../formulario-oficial.types';

@Component({
  selector: 'app-verificacion-formulario',
  imports: [CommonModule],
  templateUrl: './verificacion-formulario.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerificacionFormularioComponent {
  private readonly router = inject(Router);
  private readonly draftService = inject(FormularioOficialDraftService);

  protected readonly draft = computed<FormularioDraftSnapshot>(
    () => this.draftService.getSnapshot() as FormularioDraftSnapshot
  );
  protected readonly confirmDialog = signal(false);

  // Vuelve al formulario principal para permitir ajustes antes de enviar.
  protected volverAlFormulario(): void {
    void this.router.navigate(['/formulario-oficial']);
  }

  // Abre el modal de confirmación del envío final.
  protected requestEnviarSolicitud(): void {
    if (this.draft().submitted) return;
    this.confirmDialog.set(true);
  }

  // Cierra el modal de confirmación sin enviar.
  protected cancelEnviarSolicitud(): void {
    this.confirmDialog.set(false);
  }

  // Marca la solicitud como enviada y guarda la fecha de envío.
  protected enviarSolicitud(): void {
    if (this.draft().submitted) return;
    const fechaSolicitud = new Date().toISOString();
    this.draftService.updateSubmission(fechaSolicitud);
    this.confirmDialog.set(false);
  }

  // Formatea la fecha/hora de envío para mostrarla en formato español.
  protected formatFechaSolicitud(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Devuelve un texto con fallback cuando un campo viene vacío.
  protected getDisplayValue(value: string | undefined | null): string {
    return value?.trim() || '—';
  }

  // Devuelve el tipo de estudio en formato legible para verificación.
  protected getEstudioTipoDisplay(entry: EstudioEntry): string {
    const tipo = entry.tipo.trim() as EstudiosTipo;
    if (tipo === 'LOE' || tipo === 'LOGSE') return tipo;
    if (tipo === 'Universitarios') return 'Universitarios';
    if (tipo === 'Otros') return 'Otros';
    return '—';
  }

  // Formatea el grado del estudio para la tabla de verificación.
  protected getEstudioGradoDisplay(entry: EstudioEntry): string {
    return this.formatGrado(entry.grado);
  }

  // Devuelve el módulo o la descripción del estudio en la previsualización.
  protected getEstudioModuloDisplay(entry: EstudioEntry): string {
    if (entry.modulo?.trim()) return entry.modulo;
    if (entry.descripcion?.trim()) return entry.descripcion;
    return '—';
  }

  // Devuelve el tipo de solicitud mostrado en la tabla final.
  protected getRequestedTipoDisplay(value: string): string {
    const tipo = value.trim();
    if (!tipo) return '—';
    if (tipo === 'Universitarios') return 'Universitarios';
    if (tipo === 'Otros') return 'Otros';
    return tipo;
  }

  // Formatea el grado en las solicitudes mostradas en verificación.
  protected getRequestedGradoDisplay(value: string): string {
    return this.formatGrado(value);
  }

  // Devuelve el nombre del módulo solicitado con código opcional.
  protected getRequestedModuloDisplay(item: RequestedModule): string {
    const modulo = item.nombre.trim();
    const codigo = item.codigo?.trim();
    if (modulo && codigo) return `${modulo} (${codigo})`;
    return modulo || '—';
  }

  // Construye el resumen del DNI según modo único o anverso/reverso.
  protected getDniResumen(snapshot: FormularioDraftSnapshot): string {
    if (snapshot.docDniModeSingle) {
      return snapshot.docDniFileSingle?.name || 'Sin DNI adjunto';
    }
    const front = snapshot.docDniFileFront?.name || 'Sin anverso';
    const back = snapshot.docDniFileBack?.name || 'Sin reverso';
    return `Anverso: ${front} · Reverso: ${back}`;
  }

  // Devuelve el nombre de archivo para un documento adicional.
  protected getDocFileName(doc: DocumentoEntry): string {
    return doc.fileName?.trim() || 'Archivo sin nombre';
  }

  // Normaliza el valor de grado para mostrar etiquetas consistentes.
  private formatGrado(value: string | undefined | null): string {
    if (!value?.trim()) return '—';
    if (/^grado superior$/i.test(value)) return 'Grado Superior';
    if (/^grado medio$/i.test(value)) return 'Grado Medio';
    return value;
  }
}
