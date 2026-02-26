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

  nombre = '';
  apellidos = '';
  dni = '';
  email = '';

  constructor(private convalidacionesService: ConvalidacionesService) {
    const personalData = this.convalidacionesService.getPersonalData();
    this.nombre = personalData.nombre;
    this.apellidos = personalData.apellidos;
    this.dni = personalData.dni;
    this.email = personalData.email;
  }

  get canContinue(): boolean {
    return !!this.nombre.trim() && !!this.apellidos.trim() && !!this.dni.trim() && !!this.email.trim();
  }

  onNext(): void {
    if (!this.canContinue) return;
    this.convalidacionesService.setPersonalData({
      nombre: this.nombre,
      apellidos: this.apellidos,
      dni: this.dni,
      email: this.email,
    });
    this.next.emit();
  }
}
