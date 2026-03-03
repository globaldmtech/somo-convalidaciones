import { Routes } from '@angular/router';
import { FormularioPageComponent } from './pages/formulario-page.component';
import { AdminPageComponent } from './pages/admin-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'formulario' },
  { path: 'formulario', component: FormularioPageComponent },
  { path: 'admin', component: AdminPageComponent },
  { path: '**', redirectTo: 'formulario' },
];
