import { Routes } from '@angular/router';
import { EntryPageComponent } from './pages/entry-page.component';
import { FormularioPageComponent } from './pages/formulario-page.component';
import { AdminPageComponent } from './pages/admin-page.component';

export const routes: Routes = [
  { path: '', component: EntryPageComponent },
  { path: 'formulario', component: FormularioPageComponent },
  { path: 'admin', component: AdminPageComponent },
  { path: '**', redirectTo: '' },
];
