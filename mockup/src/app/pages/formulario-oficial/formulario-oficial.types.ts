// Claves de filtros utilizadas para cruzar estudios y módulos.
export type FilterKey = 'grado' | 'familia' | 'ciclo' | 'modulo';

// Tipos de estudios admitidos en el formulario.
export type EstudiosTipo = 'LOGSE' | 'LOE' | 'Universitarios' | 'Otros' | '';

// Estructura de un estudio aportado por el solicitante.
export type EstudioEntry = {
  tipo: EstudiosTipo;
  grado: string;
  familia: string;
  ciclo: string;
  modulo: string;
  descripcion: string;
};

// Opción de estudio FP disponible para selección en el modal.
export type FpEstudioOption = {
  id: string;
  grado: string;
  familia: string;
  ciclo: string;
};

// Entrada persistida de módulo añadido manualmente.
export type ManualModuleEntry = {
  id: string;
  nombre: string;
};

// Entrada temporal de módulo manual antes de persistir.
export type ManualModuleEntryDraft = {
  nombre: string;
};

// Opción sugerida de módulo construida desde estudios y catálogo.
export type SuggestedModuleOption = {
  id: string;
  nombre: string;
  ciclo: string;
  familia: string;
  grado: string;
  tipo: string;
  origenes: string[];
};

// Solicitud final de convalidación (sugerida o manual).
export type RequestedModule = {
  id: string;
  source: 'suggested' | 'manual';
  nombre: string;
  tipo: string;
  grado: string;
  familia: string;
  ciclo: string;
  origenes?: string[];
};

// Valores del bloque de datos personales.
export type PersonalValues = {
  nif: string;
  nombre: string;
  apellidos: string;
  domicilio: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  telefonoFijo: string;
  telefonoMovil: string;
  email: string;
};

// Clave de campo individual de datos personales.
export type PersonalFieldKey = keyof PersonalValues;

// Entrada de documentación adjunta.
export type DocumentoEntry = {
  id: string;
  titulo: string;
  fileName?: string;
  file?: File | null;
};

// Snapshot completo del borrador del formulario.
export type FormularioDraftSnapshot = {
  currentStep: number;
  personalValues: PersonalValues;
  draftEstudio: EstudioEntry;
  formEstudios: EstudioEntry[];
  manualModules: ManualModuleEntry[];
  selectedSuggestedModules: string[];
  requestedModules: RequestedModule[];
  docDniModeSingle: boolean;
  docDniFileSingle: File | null;
  docDniFileFront: File | null;
  docDniFileBack: File | null;
  docEntries: DocumentoEntry[];
  submitted: boolean;
  fechaSolicitud: string | null;
};
