import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConvalidacionesService, UploadedDocument } from '../../services/convalidaciones.service';

@Component({
    selector: 'app-documentacion-aportar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './documentacion-aportar.component.html',
})
export class DocumentacionAportarComponent {
    @Output() next = new EventEmitter<void>();
    @Output() prev = new EventEmitter<void>();

    constructor(private convalidacionesService: ConvalidacionesService) {}

    modalOpen = false;
    modalTipo: 'certificado' | 'otros' | null = null;
    pendingItems: { file: File; displayName: string }[] = [];
    modalError: string | null = null;

    get documentoDni(): UploadedDocument | null {
        return this.convalidacionesService.documentoDni;
    }

    get documentosCertificado(): UploadedDocument[] {
        return this.convalidacionesService.documentosCertificado;
    }

    get documentosOtros(): UploadedDocument[] {
        return this.convalidacionesService.documentosOtros;
    }

    get duplicateDocumentNames(): string[] {
        return this.convalidacionesService.getDuplicateDocumentNames();
    }

    get hasDuplicateDocumentNames(): boolean {
        return this.duplicateDocumentNames.length > 0;
    }

    get canContinue(): boolean {
        return !!this.documentoDni && this.documentosCertificado.length > 0 && !this.hasDuplicateDocumentNames;
    }

    onDniSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files.length > 0 ? input.files[0] : null;
        this.convalidacionesService.setDocumentoDni(file);
        input.value = '';
    }

    onCertificadoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        if (files.length > 0) {
            this.openAddModal('certificado', files);
        }
        input.value = '';
    }

    onOtrosSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        if (files.length > 0) {
            this.openAddModal('otros', files);
        }
        input.value = '';
    }

    removeDocumento(tipo: 'certificado' | 'otros', index: number): void {
        if (tipo === 'certificado') {
            const list = [...this.documentosCertificado];
            list.splice(index, 1);
            this.convalidacionesService.documentosCertificado = list;
            return;
        }
        const list = [...this.documentosOtros];
        list.splice(index, 1);
        this.convalidacionesService.documentosOtros = list;
    }

    clearDni(): void {
        this.convalidacionesService.setDocumentoDni(null);
    }

    trackByIndex(index: number): number {
        return index;
    }

    onNext(): void {
        if (!this.canContinue) {
            return;
        }
        this.next.emit();
    }

    private openAddModal(tipo: 'certificado' | 'otros', files: File[]): void {
        this.modalTipo = tipo;
        this.pendingItems = files.map((file) => ({
            file,
            displayName: file.name,
        }));
        this.modalError = null;
        this.modalOpen = true;
    }

    closeModal(): void {
        this.modalOpen = false;
        this.modalTipo = null;
        this.pendingItems = [];
        this.modalError = null;
    }

    addPending(): void {
        if (!this.modalTipo || this.pendingItems.length === 0) {
            return;
        }

        const docs = this.pendingItems.map((item) => ({
            file: item.file,
            categoria: this.modalTipo as 'certificado' | 'otros',
            displayName: item.displayName.trim() || item.file.name,
        }));

        const duplicateNames = this.convalidacionesService.getDuplicateDocumentNamesForDocuments([
            ...(this.documentoDni ? [this.documentoDni] : []),
            ...this.documentosCertificado,
            ...this.documentosOtros,
            ...docs,
        ]);
        if (duplicateNames.length > 0) {
            this.modalError = `Ya existe un documento con ese nombre: ${duplicateNames.join(', ')}. Cámbialo antes de añadirlo.`;
            return;
        }

        if (this.modalTipo === 'certificado') {
            this.convalidacionesService.documentosCertificado = [
                ...this.convalidacionesService.documentosCertificado,
                ...docs,
            ];
        } else {
            this.convalidacionesService.documentosOtros = [
                ...this.convalidacionesService.documentosOtros,
                ...docs,
            ];
        }

        this.closeModal();
    }
}
