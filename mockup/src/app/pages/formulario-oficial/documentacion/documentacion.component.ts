import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-documentacion',
  templateUrl: './documentacion.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentacionComponent {
  readonly selectedOption = input('');
  readonly optionChange = output<string>();
  readonly docsTodoToggle = output<boolean>();

  protected handleOptionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value ?? '';
    this.optionChange.emit(value);
  }

  protected handleDocsToggle(event: Event): void {
    const checked = Boolean((event.target as HTMLInputElement | null)?.checked);
    this.docsTodoToggle.emit(checked);
  }
}
