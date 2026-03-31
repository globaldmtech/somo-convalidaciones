import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ConvalidacionesService,
  getPersonalDocumentTypeLabel,
  isValidPersonalDocumentNumber,
  normalizePersonalDocumentNumber,
  PersonalDocumentType,
} from '../../services/convalidaciones.service';

@Component({
  selector: 'app-datos-personales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datos-personales.component.html'
})
export class DatosPersonalesComponent {
  @Output() next = new EventEmitter<void>();

  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  readonly documentTypeOptions: PersonalDocumentType[] = ['dni', 'nie', 'otro'];

  documentType: PersonalDocumentType = 'dni';
  nombre = '';
  apellidos = '';
  dni = '';
  email = '';
  attemptedNext = false;
  emailTouched = false;
  documentTouched = false;

  constructor(private convalidacionesService: ConvalidacionesService) {
    const personalData = this.convalidacionesService.getPersonalData();
    this.documentType = personalData.documentType || 'dni';
    this.nombre = personalData.nombre;
    this.apellidos = personalData.apellidos;
    this.dni = personalData.dni;
    this.email = personalData.email;
  }

  get canContinue(): boolean {
    return !!this.nombre.trim()
      && !!this.apellidos.trim()
      && this.isDocumentValid
      && this.isEmailValid;
  }

  get isEmailValid(): boolean {
    return this.emailPattern.test(this.email.trim());
  }

  get documentTypeLabel(): string {
    return getPersonalDocumentTypeLabel(this.documentType);
  }

  getDocumentTypeOptionLabel(type: PersonalDocumentType): string {
    return getPersonalDocumentTypeLabel(type);
  }

  get documentPlaceholder(): string {
    switch (this.documentType) {
      case 'nie':
        return 'Ej: X1234567L';
      case 'otro':
        return 'Ej: ID-458923';
      case 'dni':
      default:
        return 'Ej: 12345678Z';
    }
  }

  get documentErrorMessage(): string {
    switch (this.documentType) {
      case 'nie':
        return 'El NIE debe tener formato válido, por ejemplo X1234567L.';
      case 'otro':
        return 'Introduce un identificador válido usando letras, números o / . -';
      case 'dni':
      default:
        return 'El DNI debe tener 8 números y una letra válida, por ejemplo 12345678Z.';
    }
  }

  get isDocumentValid(): boolean {
    return isValidPersonalDocumentNumber(this.documentType, this.dni);
  }

  get showEmailError(): boolean {
    return (this.emailTouched || this.attemptedNext) && !!this.email.trim() && !this.isEmailValid;
  }

  get showDocumentError(): boolean {
    return (this.documentTouched || this.attemptedNext) && !!this.dni.trim() && !this.isDocumentValid;
  }

  onDocumentTypeChange(): void {
    this.dni = normalizePersonalDocumentNumber(this.documentType, this.dni);
    this.documentTouched = !!this.dni.trim();
  }

  onDocumentBlur(): void {
    this.documentTouched = true;
    this.dni = normalizePersonalDocumentNumber(this.documentType, this.dni);
  }

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  onNext(): void {
    this.attemptedNext = true;
    if (!this.canContinue) return;
    this.convalidacionesService.setPersonalData({
      documentType: this.documentType,
      nombre: this.nombre.trim(),
      apellidos: this.apellidos.trim(),
      dni: normalizePersonalDocumentNumber(this.documentType, this.dni),
      email: this.email.trim(),
    });
    this.next.emit();
  }
}
