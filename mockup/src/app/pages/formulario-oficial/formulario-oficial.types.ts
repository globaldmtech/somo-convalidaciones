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

export type DocumentoTipo = 'cert' | 'acred' | 'justif' | '';

export type DocumentoEntry = {
  id: string;
  tipo: DocumentoTipo;
  estudioIndices: number[];
  fileName?: string;
  file?: File | null;
};
