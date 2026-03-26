import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConvalidacionesService } from '../../services/convalidaciones.service';

@Component({
  selector: 'app-datos-personales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datos-personales.component.html'
})
export class DatosPersonalesComponent {
  @Output() next = new EventEmitter<void>();

  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  nombre = '';
  apellidos = '';
  dni = '';
  email = '';
  attemptedNext = false;
  emailTouched = false;

  constructor(private convalidacionesService: ConvalidacionesService) {
    const personalData = this.convalidacionesService.getPersonalData();
    this.nombre = personalData.nombre;
    this.apellidos = personalData.apellidos;
    this.dni = personalData.dni;
    this.email = personalData.email;
  }

  get canContinue(): boolean {
    return !!this.nombre.trim()
      && !!this.apellidos.trim()
      && !!this.dni.trim()
      && this.isEmailValid;
  }

  get isEmailValid(): boolean {
    return this.emailPattern.test(this.email.trim());
  }

  get showEmailError(): boolean {
    return (this.emailTouched || this.attemptedNext) && !!this.email.trim() && !this.isEmailValid;
  }

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  onNext(): void {
    this.attemptedNext = true;
    if (!this.canContinue) return;
    this.convalidacionesService.setPersonalData({
      nombre: this.nombre.trim(),
      apellidos: this.apellidos.trim(),
      dni: this.dni.trim(),
      email: this.email.trim(),
    });
    this.next.emit();
  }
}
