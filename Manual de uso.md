## Manual de uso

## 1. Objetivo

SOMO Convalidaciones es la aplicación utilizada para registrar y revisar solicitudes de convalidación de módulos de Formación Profesional.

La aplicación tiene dos áreas principales:

- acceso del usuario autenticado para cumplimentar y enviar solicitudes;
- zona de administración para revisar formularios, resolver módulos, mantener catálogo y gestionar reglas de convalidación.

## 2. Acceso a la aplicación

Las rutas funcionales actuales son:

- `/`: punto de entrada. Comprueba la sesión y redirige automáticamente.
- `/formulario`: formulario de solicitud para alumnado o solicitantes.
- `/admin`: panel de administración.

El flujo de acceso actual es:

1. La aplicación comprueba si existe una sesión activa.
2. Si no existe, redirige al servicio compartido de autenticación de Microsoft.
3. Tras autenticarse, el usuario vuelve a la aplicación.
4. Según su rol:
   - `alumno`: entra en el formulario.
   - `admin`: puede entrar en el panel de administración.

Si una persona autenticada no tiene rol de administración, no podrá acceder al panel admin.

## 3. Perfil solicitante

La solicitud se completa en 5 pasos.

### 3.1. Paso 1. Datos personales

En este paso se revisan o completan:

- nombre;
- apellidos;
- tipo de documento;
- número de documento;
- correo electrónico.

Tipos de documento admitidos:

- `DNI`;
- `NIE`;
- `Otro documento`.

La aplicación valida el formato del documento y del correo antes de permitir avanzar.

## 3.2. Paso 2. Formación aportada

Este paso recoge toda la formación que sirve como base para solicitar convalidaciones.

Se puede aportar información en tres bloques:

- estudios registrados en catálogo;
- acreditaciones externas;
- otros ciclos o módulos no registrados.

### 3.2.1. Añadir un estudio registrado

Para añadir un estudio del catálogo:

1. Seleccionar la titulación o grado.
2. Seleccionar el ciclo formativo.
3. Indicar si el ciclo se ha cursado completo.
4. Si el ciclo está completo, indicar la nota media del ciclo.
5. Marcar los módulos superados.
6. Introducir la nota o el resultado de cada módulo seleccionado.
7. Guardar el estudio.

La aplicación distingue entre:

- módulos numéricos: admiten nota entre `0` y `10`;
- módulos no numéricos: admiten `APTO`, `NO APTO` o `EXENTO`.

Cada estudio guardado queda visible en una tarjeta resumida y puede:

- desplegarse para revisar módulos;
- editarse;
- eliminarse.

También pueden aparecer módulos obsoletos, que la interfaz separa visualmente del resto.

### 3.2.2. Acreditaciones externas

En este mismo paso se pueden añadir acreditaciones externas disponibles en el catálogo.

Estas acreditaciones se tienen en cuenta al calcular convalidaciones automáticas.

### 3.2.3. Otros ciclos o módulos no registrados

Si la formación no existe en el catálogo, puede añadirse como texto libre.

Este bloque sirve para:

- ciclos no cargados en el sistema;
- módulos sueltos no catalogados;
- estudios especiales que deban revisarse manualmente.

### 3.2.4. Reglas prácticas del paso 2

- Debe guardarse cada estudio antes de continuar.
- Un estudio sin módulos válidos no se considera aportado.
- Si se indica ciclo completo, conviene informar también su nota media.
- La información de este paso condiciona los resultados automáticos del paso 3.

## 3.3. Paso 3. Convalidaciones solicitadas

Este paso permite elegir qué módulos se quieren convalidar.

Se divide en dos bloques:

- solicitud de convalidación de módulos registrados;
- solicitud de otros módulos o ciclos no registrados.

### 3.3.1. Selección de destino

Primero debe indicarse el destino en Somorrostro:

1. seleccionar el grado a cursar;
2. seleccionar el ciclo a cursar.

Cuando el ciclo está informado, la aplicación calcula automáticamente las posibles convalidaciones usando:

- módulos aportados;
- acreditaciones externas;
- ciclos completos aportados;
- notas registradas.

### 3.3.2. Resultados automáticos

Las posibles convalidaciones aparecen listadas y seleccionadas automáticamente.

Cada resultado puede mostrar:

- módulo destino;
- origen de la convalidación;
- módulos o ciclo que justifican la propuesta;
- nota media de origen;
- nota con la que se convalidaría el módulo.

Aspectos importantes:

- un mismo módulo destino puede tener varias vías posibles, pero solo se puede dejar activa una;
- si no hay coincidencias, la pantalla indicará que no existen resultados automáticos;

### 3.3.3. Añadir otros módulos del ciclo destino

El botón `Otros` permite añadir módulos del ciclo destino que no hayan quedado seleccionados automáticamente.

Este bloque sirve para pedir revisión manual de módulos del ciclo elegido aunque no exista propuesta automática.

### 3.3.4. Añadir otras solicitudes libres

Además, puede escribirse texto libre para solicitar:

- módulos no registrados;
- ciclos no registrados;
- situaciones especiales que deban revisarse manualmente.

## 3.4. Paso 4. Documentación a aportar

Antes del envío hay que adjuntar documentación.

Documentación obligatoria:

- documento de identidad;
- al menos un certificado académico.

Documentación opcional:

- otros archivos de apoyo.

Comportamiento actual:

- se pueden subir varios certificados;
- se pueden subir varios documentos adicionales;
- cada archivo puede renombrarse dentro del formulario;
- la aplicación bloquea el avance si hay nombres duplicados entre los documentos cargados.

## 3.5. Paso 5. Resumen y envío

El último paso muestra un resumen completo de:

- datos personales;
- estudios aportados;
- acreditaciones;
- otros estudios o módulos;
- convalidaciones seleccionadas;
- documentación adjunta.

Desde este paso se puede:

- volver atrás para corregir información;
- enviar la solicitud.

Al enviar:

- el formulario queda registrado en base de datos;
- se guardan las solicitudes;
- se guardan los módulos y ciclos aportados;
- se almacenan los archivos adjuntos;
- el estado inicial del formulario queda en `En revisión`.

Tras el envío, la aplicación muestra una confirmación final.

## 4. Panel de administración

El panel admin está disponible en `/admin` para usuarios con rol `admin`.

Tiene cuatro pestañas:

- `Formularios`
- `Modulos`
- `Convalidaciones`
- `Administradores`

## 4.1. Pestaña Formularios

Permite trabajar con las solicitudes enviadas.

Estados principales del formulario:

- `En revisión`
- `Validadas`
- `Rechazadas`
- `Archivadas validadas`
- `Archivadas rechazadas`

### 4.1.1. Organización de la pantalla

La pestaña se organiza por estados de trabajo.

En la parte superior se puede cambiar entre:

- `En revisión`;
- `Validadas`;
- `Rechazadas`;
- `Archivadas`.

Los formularios se muestran agrupados por `alumno`, no solo como una lista plana.
Dentro de cada alumno pueden existir uno o varios formularios enviados en fechas distintas.

La interfaz también muestra contadores de:

- número de alumnos visibles;
- número de formularios visibles;
- número de formularios por estado.

### 4.1.2. Revisión de un formulario

Al desplegar un alumno se accede al detalle de cada formulario.

Cada formulario permite revisar:

- fecha de envío;
- estado general del formulario;
- módulos aportados, agrupados por ciclo;
- nota o resultado de cada módulo aportado;
- solicitudes de convalidación;
- documentos adjuntados por la persona solicitante.

Las solicitudes se muestran separadas en tres columnas:

- `En revisión`;
- `Validadas`;
- `Rechazadas`.

Esto permite ver rápidamente qué módulos ya están resueltos y cuáles siguen pendientes.

### 4.1.3. Documentación adjunta

Dentro del formulario, la persona administradora puede revisar los documentos aportados.

Comportamiento actual:

- los documentos aparecen listados dentro del propio formulario;
- se pueden seleccionar uno a uno;
- se pueden abrir para su consulta;
- el sistema conserva tanto el nombre visible del documento como el archivo almacenado.

Esto facilita comprobar si la documentación justifica realmente la convalidación solicitada.

### 4.1.4. Cambio de estado del formulario

El formulario completo puede cambiar de estado.

Acciones habituales:

- pasar un formulario a `Validado`;
- pasarlo a `Rechazado`;
- devolverlo a `En revisión`;
- archivarlo cuando ya no se necesite en la vista principal;
- desarchivarlo si debe volver a trabajarse.

Uso recomendado:

1. Revisar primero módulos, solicitudes y documentos.
2. Confirmar después el estado general del formulario.
3. Archivar solo cuando el caso ya esté cerrado o no deba permanecer en la vista operativa.

### 4.1.5. Cambio de estado de solicitudes individuales

Además del estado general del formulario, cada solicitud o módulo solicitado puede resolverse por separado.

Desde la propia ficha se puede:

- validar una solicitud concreta;
- rechazar una solicitud concreta;
- devolver una solicitud validada o rechazada a `En revisión`.

Esto es útil cuando un mismo formulario contiene:

- módulos claramente aceptables;
- módulos que deben rechazarse;
- módulos que todavía requieren revisión adicional.

Cuando procede, el panel también permite informar una `nota manual` para la convalidación validada.

### 4.1.6. Exportación y archivado

En la vista de formularios `Validadas` aparece la opción de exportar solicitudes de convalidación a Excel.

Esta exportación sirve para:

- sacar un listado de trabajo;
- conservar un registro externo;
- preparar el cierre administrativo de formularios ya resueltos.

Después de exportar, la aplicación permite mover formularios a estados archivados.

Estados de archivado:

- `Archivadas validadas`;
- `Archivadas rechazadas`.

### 4.1.7. Vista de archivados

La vista `Archivadas` separa los formularios archivados validados de los archivados rechazados.

Además, permite filtrar por `curso académico`.

Este filtro es útil para:

- consultar expedientes de un año concreto;
- reducir el volumen visible;
- recuperar formularios antiguos sin mezclar campañas distintas.

### 4.1.8. Eliminación de formularios

La pestaña también permite eliminar formularios cuando corresponda.

Esta acción debe usarse con cuidado, porque elimina junto con el formulario:

- sus solicitudes;
- sus módulos y ciclos aportados;
- sus documentos asociados.

Se recomienda reservar esta acción para casos de error, duplicidad o limpieza administrativa justificada.

## 4.2. Pestaña Modulos

Permite mantener el catálogo de ciclos, módulos y acreditaciones externas.

Funciones disponibles:

- consultar ciclos con sus módulos;
- distinguir módulos activos y obsoletos;
- crear ciclos;
- editar ciclos;
- eliminar ciclos;
- crear varios módulos a la vez dentro de un ciclo;
- eliminar módulos;
- crear acreditaciones externas.

Los ciclos pueden estar marcados como propios de Somorrostro o como externos.

## 4.3. Pestaña Convalidaciones

Permite mantener las reglas con las que la aplicación calcula propuestas automáticas.

Hay dos modos de trabajo:

- edición por ciclo destino;
- edición múltiple en bloque.

### 4.3.1. Convalidaciones por destino

Este modo sirve para revisar y mantener las reglas de un ciclo concreto.

Uso recomendado:

1. Seleccionar el `grado destino`.
2. Seleccionar el `ciclo destino`.
3. Revisar el listado de módulos del ciclo que ya tienen reglas registradas.

La pantalla agrupa la información por `módulo destino`, es decir, por cada módulo que el alumnado quiere convalidar.

Dentro de cada módulo destino se muestran sus posibles vías de convalidación:

- por `módulos de origen`;
- por `ciclo completo de origen`.

Cada opción desplegable permite ver:

- el ciclo de origen;
- si la regla exige ciclo completo o módulos concretos;
- los módulos origen que justifican la convalidación;
- la referencia documental asociada, si se ha informado;
- la página concreta del documento, si existe.

Desde este modo se puede:

- consultar reglas de convalidación por grado y ciclo destino;
- crear una nueva regla para el ciclo seleccionado;
- crear reglas módulo a módulo;
- crear reglas por ciclo completo;
- editar una opción de convalidación ya existente;
- eliminar una regla completa;
- eliminar un origen concreto de una regla cuando la regla tiene varios módulos origen.

Este modo es el más adecuado cuando:

- se quiere revisar una convalidación concreta;
- se necesita corregir una regla ya existente;
- se está trabajando módulo a módulo sobre un ciclo determinado.

### 4.3.2. Edición múltiple en bloque

Este modo está pensado para altas o bajas masivas de reglas.

La lógica de uso es:

1. Seleccionar uno o varios `orígenes`.
2. Seleccionar uno o varios `módulos destino`.
3. Informar, si se desea, la `URL` de la fuente normativa o documental.
4. Informar, si se desea, la `página` de referencia.
5. Ejecutar la creación o eliminación masiva.

Los orígenes que se pueden usar en bloque son:

- módulos;
- ciclos completos;
- acreditaciones externas.

El sistema genera combinaciones entre los orígenes seleccionados y los módulos destino seleccionados.
Por tanto, una sola operación puede crear o eliminar muchas reglas a la vez.

Este modo es útil cuando:

- se carga una normativa nueva;
- se replican varias convalidaciones similares;
- se necesita limpiar reglas antiguas en bloque.

### 4.3.3. Recomendaciones de uso

- Usar `Convalidaciones por destino` para revisar casos concretos y cambios finos.
- Usar `Edición múltiple en bloque` solo cuando se tenga claro el conjunto completo de reglas a crear o eliminar.
- Informar la fuente y la página siempre que sea posible para dejar trazabilidad de la regla.
- Revisar bien el ciclo destino antes de guardar cambios, porque las reglas afectan al cálculo automático del formulario.

## 4.4. Pestaña Administradores

Permite consultar usuarios autenticados y cambiar su rol.

Funciones disponibles:

- listar usuarios registrados;
- buscar por nombre, correo, DNI o rol;
- convertir un usuario en `admin`;
- retirar el rol `admin` y devolverlo a `alumno`.

## 5. Comportamientos importantes

- El formulario exige sesión autenticada.
- El panel admin exige sesión autenticada y rol `admin`.
- La aplicación valida formatos de documento y correo.
- No puede enviarse una solicitud sin documento de identidad ni certificado académico.
- Si el guardado del formulario falla, la aplicación revierte la transacción y elimina los archivos ya escritos.
