export interface Grado {
    id: number;
    nombre: string;
}

export interface Ciclo {
    id: number;
    nombre: string;
    id_oficial: string | null;
    normativa: string | null;
    id_familia: number;
    id_grado: number;
}

export interface Modulo {
    id: number;
    nombre: string;
    id_oficial: string | null;
    id_ciclo: number;
    numerico: number;
}
