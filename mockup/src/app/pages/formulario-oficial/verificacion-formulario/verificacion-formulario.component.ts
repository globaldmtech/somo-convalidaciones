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

  protected volverAlFormulario(): void {
    void this.router.navigate(['/formulario-oficial']);
  }

  protected requestEnviarSolicitud(): void {
    if (this.draft().submitted) return;
    this.confirmDialog.set(true);
  }

  protected cancelEnviarSolicitud(): void {
    this.confirmDialog.set(false);
  }

  protected enviarSolicitud(): void {
    if (this.draft().submitted) return;
    const fechaSolicitud = new Date().toISOString();
    this.draftService.updateSubmission(fechaSolicitud);
    this.confirmDialog.set(false);
  }

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

  protected getDisplayValue(value: string | undefined | null): string {
    return value?.trim() || '—';
  }

  protected getEstudioTipoDisplay(entry: EstudioEntry): string {
    const tipo = entry.tipo.trim() as EstudiosTipo;
    if (tipo === 'LOE' || tipo === 'LOGSE') return tipo;
    if (tipo === 'Universitarios') return 'Universitarios';
    if (tipo === 'Otros') return 'Otros';
    return '—';
  }

  protected getEstudioGradoDisplay(entry: EstudioEntry): string {
    return this.formatGrado(entry.grado);
  }

  protected getEstudioModuloDisplay(entry: EstudioEntry): string {
    if (entry.modulo?.trim()) return entry.modulo;
    if (entry.descripcion?.trim()) return entry.descripcion;
    return '—';
  }

  protected getRequestedTipoDisplay(value: string): string {
    const tipo = value.trim();
    if (!tipo) return '—';
    if (tipo === 'Universitarios') return 'Universitarios';
    if (tipo === 'Otros') return 'Otros';
    return tipo;
  }

  protected getRequestedGradoDisplay(value: string): string {
    return this.formatGrado(value);
  }

  protected getRequestedModuloDisplay(item: RequestedModule): string {
    const modulo = item.nombre.trim();
    const codigo = item.codigo?.trim();
    if (modulo && codigo) return `${modulo} (${codigo})`;
    return modulo || '—';
  }

  protected getDniResumen(snapshot: FormularioDraftSnapshot): string {
    if (snapshot.docDniModeSingle) {
      return snapshot.docDniFileSingle?.name || 'Sin DNI adjunto';
    }
    const front = snapshot.docDniFileFront?.name || 'Sin anverso';
    const back = snapshot.docDniFileBack?.name || 'Sin reverso';
    return `Anverso: ${front} · Reverso: ${back}`;
  }

  protected getDocFileName(doc: DocumentoEntry): string {
    return doc.fileName?.trim() || 'Archivo sin nombre';
  }

  private formatGrado(value: string | undefined | null): string {
    if (!value?.trim()) return '—';
    if (/^grado superior$/i.test(value)) return 'Grado Superior';
    if (/^grado medio$/i.test(value)) return 'Grado Medio';
    return value;
  }
}
