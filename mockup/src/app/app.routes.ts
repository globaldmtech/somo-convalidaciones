import { Routes } from '@angular/router';
import { verificacionFormularioGuard } from './pages/formulario-oficial/verificacion-formulario/verificacion-formulario.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'formulario-oficial'
  },
  {
    path: 'formulario-oficial/verificacion',
    canActivate: [verificacionFormularioGuard],
    loadComponent: () =>
      import('./pages/formulario-oficial/verificacion-formulario/verificacion-formulario.component').then(
        (m) => m.VerificacionFormularioComponent
      )
  },
  {
    path: 'formulario-oficial',
    loadComponent: () =>
      import('./pages/formulario-oficial/formulario-oficial.component').then(
        (m) => m.FormularioOficialComponent
      )
  },
  {
    path: 'convalidaciones',
    loadComponent: () =>
      import('./pages/convalidaciones/convalidaciones.component').then(
        (m) => m.ConvalidacionesComponent
      )
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./pages/catalogo/catalogo.component').then(
        (m) => m.CatalogoComponent
      )
  }
];
