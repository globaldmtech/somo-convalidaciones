import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PersonalFieldKey, PersonalValues } from '../formulario-oficial.types';

@Component({
  selector: 'app-datos-personales',
  templateUrl: './datos-personales.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatosPersonalesComponent {
  readonly values = input.required<PersonalValues>();
  readonly fieldChange = output<{ key: PersonalFieldKey; value: string }>();

  // Emite al componente padre el cambio de un campo de datos personales.
  protected updateField(key: PersonalFieldKey, event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.fieldChange.emit({ key, value });
  }
}
