import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FormularioOficialDraftService } from '../formulario-oficial-draft.service';
import { FormularioDraftSnapshot } from '../formulario-oficial.types';

// Guard de acceso para la página de verificación final del formulario.
// Solo permite entrar si existe un borrador con contenido; si no, redirige al formulario.
// Comprueba si el snapshot tiene algún dato útil cargado por el usuario.
const hasAnyDraftContent = (snapshot: FormularioDraftSnapshot): boolean => {
  const personal = Object.values(snapshot.personalValues).some((value) => value.trim().length > 0);
  return (
    personal ||
    snapshot.formEstudios.length > 0 ||
    snapshot.manualModules.length > 0 ||
    snapshot.selectedSuggestedModules.length > 0 ||
    snapshot.docEntries.length > 0 ||
    Boolean(snapshot.docDniFileSingle || snapshot.docDniFileFront || snapshot.docDniFileBack)
  );
};

// Permite o bloquea la navegación a /formulario-oficial/verificacion.
// Si no hay datos en el borrador, devuelve una redirección a /formulario-oficial.
export const verificacionFormularioGuard: CanActivateFn = () => {
  const router = inject(Router);
  const draftService = inject(FormularioOficialDraftService);
  const snapshot = draftService.getSnapshot();

  if (!snapshot || !hasAnyDraftContent(snapshot)) {
    return router.createUrlTree(['/formulario-oficial']);
  }

  return true;
};
