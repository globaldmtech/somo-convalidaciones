export type CatalogRow = {
  grado: string;
  familia: string;
  ciclo: string;
  modulo: string;
};

export type ConvalidacionRow = {
  grado_origen: string | null;
  familia_origen: string | null;
  ciclo_origen: string | null;
  modulo_origen: string | null;
  rd_origen: string | null;
  grado_destino: string | null;
  familia_destino: string | null;
  ciclo_destino: string | null;
  modulo_destino: string | null;
  rd_destino: string | null;
  source_page: number | null;
};

export type FormularioEstudio = {
  tipo: string;
  grado: string;
  familia: string;
  ciclo: string;
  modulo: string;
  descripcion: string;
};

export type FormularioAConvalidar = {
  tipo: string;
  grado: string;
  familia: string;
  ciclo: string;
  modulo: string;
  codigo: string;
};

export type FormularioSubmission = {
  id: string;
  createdAt: string;
  fechaSolicitud: string;
  estado?: 'Aprobado' | 'A revisar';
  personal: {
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
  estudios: FormularioEstudio[];
  a_convalidar: FormularioAConvalidar[];
  documentos: {
    dni: string;
    cert: string | null;
    acred: string | null;
    justif: string | null;
  };
};
