export type FilterKey = 'grado' | 'familia' | 'ciclo' | 'modulo';

export type EstudiosTipo = 'LOGSE' | 'LOE' | 'Universitarios' | 'Otros' | '';

export type EstudioEntry = {
  tipo: EstudiosTipo;
  grado: string;
  familia: string;
  ciclo: string;
  modulo: string;
  descripcion: string;
};

export type ManualModuleDraft = {
  nombre: string;
  codigo: string;
};

export type ManualModuleEntry = {
  id: string;
  nombre: string;
  codigo: string;
};

export type SuggestedModuleOption = {
  id: string;
  nombre: string;
  ciclo: string;
  familia: string;
  grado: string;
  tipo: string;
  origenes: string[];
};

export type RequestedModule = {
  id: string;
  source: 'suggested' | 'manual';
  nombre: string;
  codigo?: string;
  tipo: string;
  grado: string;
  familia: string;
  ciclo: string;
  origenes?: string[];
};

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

export type PersonalFieldKey = keyof PersonalValues;

export type DocumentoEntry = {
  id: string;
  titulo: string;
  fileName?: string;
  file?: File | null;
};

export type FormularioDraftSnapshot = {
  currentStep: number;
  personalValues: PersonalValues;
  draftEstudio: EstudioEntry;
  formEstudios: EstudioEntry[];
  manualModuleDraft: ManualModuleDraft;
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
