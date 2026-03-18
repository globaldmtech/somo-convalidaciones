### Pestaña estudios cursados

- Get /convalidaciones/grados_existentes
    Lista los grados existentes que hay. 
- Get /convalidaciones/ciclos_existentes where grado_id = {seleccionado}
    Lista los ciclos existentes en el grado seleccionado.
- Get /convalidaciones/modulos_existentes where ciclo_id = {seleccionado}
    Lista los modulos existentes de un ciclo selecconado.
- Get /convalidaciones/acreditaciones_externas 
    Lista las acreditaciones externas existentes.
- Post /convalidaciones/calcular   ConvalidationRequest
    Calcula las convalidaciones posibles.
- Post /convalidaciones/insertar_formulario_completo   FormularioCompletoRequest
    Inserta un nuevo formulario.
    Inserta modulos aportados.
    Inserta solicitudes.