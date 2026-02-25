import { Component } from '@angular/core';
import { EstudiosCursadosComponent } from './components/estudios-cursados/estudios-cursados.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [EstudiosCursadosComponent],
  template: `<app-estudios-cursados />`
})
export class App { }
