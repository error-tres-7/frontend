# Coordinación local · De Aquí

## Organización y prototipo

Responsable de organización: agente del índice DVSNA. No se modifica contenido de T28VaZ ni r2JYH. Todas las pantallas existentes se conservan. Se permite mover raíces para ordenar el lienzo, pero T28VaZ y r2JYH se mantienen en su posición para evitar conflictos.

Recorridos: cliente escritorio, cliente móvil, comerciante, alternativas y soporte/referencia. El prototipo vive en `prototype/`, aislado de `src/` y de la configuración de la aplicación.

## Entrega del dashboard

El agente de dashboard puede añadir aquí los IDs y nombres de nuevas raíces, su estado (en curso/listo), acciones de navegación y cualquier raíz que no deba moverse. Organización debe releer este archivo y el lienzo antes de incorporar y exportar pantallas listas.

No hay nuevas pantallas de dashboard anunciadas al iniciar este trabajo. Se reserva una sección del manifiesto para incorporarlas al detectar su entrega. No sobrescribir los apartados escritos por otro agente.

## Dashboard · Entrega lista para prototipado

Archivo único de diseño: `design.pen`. Se refinó únicamente la raíz existente `T28VaZ`; las demás raíces de esta entrega son nuevas. No se modificó `r2JYH`, el código ni el catálogo de inventario. Las coordenadas son de colocación inicial; organización puede ordenar las raíces nuevas y debe releer el documento antes de hacerlo.

| Raíz | Pantalla | Estado |
| --- | --- | --- |
| `T28VaZ` | Resumen del comerciante, escritorio | Lista; conservar posición |
| `D2zhK` | Comparar precios del mismo giro, escritorio | Lista |
| `Mgewd` | Revisar cambio de precio, escritorio | Lista |
| `X0uXg` | Precio guardado, escritorio; éxito simulado | Lista |
| `pSIRS` | Resumen del comerciante, móvil | Lista |
| `TtKVe` | Comparar precios, móvil | Lista |
| `y15ABx` | Revisar precio, móvil | Lista |
| `kQgTm` | Precio guardado, móvil; éxito simulado | Lista |

### Acciones para conectar

| Origen / objeto de acción | Destino / comportamiento |
| --- | --- |
| `T28VaZ` / `jOQeL` | Abrir `D2zhK` |
| `D2zhK` / `y0fFkC` | Abrir revisión `Mgewd`; propuesta editable de $30/kg, sin guardar |
| `D2zhK` / `LkeLX`, `VVxJW` | Conservar $32/kg y volver a `T28VaZ` |
| `Mgewd` / `a6PYzl` | Campo editable de precio; actualizar vista previa, diferencia y etiqueta de Guardar |
| `Mgewd` / `v3hmX` | Confirmación explícita; tras éxito simulado, abrir `X0uXg` |
| `Mgewd` / `ioq0m`, `c8igVE` | Descartar propuesta y volver a `D2zhK` |
| `X0uXg` / `KtiSp` | Volver a `T28VaZ` |
| `pSIRS` / `hi31E` | Abrir `TtKVe` |
| `TtKVe` / `sTMhF` | Abrir revisión `y15ABx`, sin guardar |
| `TtKVe` / `P5XpYx`, `AOaZ4` | Conservar $32/kg y volver a `pSIRS` |
| `y15ABx` / `LUNoI` | Campo editable equivalente al de escritorio |
| `y15ABx` / `ek9kS` | Confirmar; tras éxito simulado, abrir `kQgTm` |
| `y15ABx` / `DPXas`, `m8FpBP` | Descartar propuesta y volver a `TtKVe` |
| `kQgTm` / `n9DNNN` | Volver a `pSIRS` |
| `T28VaZ` / `bxBmU`; `pSIRS` / `f61tll` | Abrir configuración de aceptación en `h91to` (Mi puesto) |
| `pSIRS` / `t4D8M8`, `SRjYR` | Abrir pedidos `SWso9` o inventario `BnjUF`; usar adaptación móvil si ya existe |
| `pSIRS` / `OSW4n` | Conectar al flujo existente de Registrar venta; esta entrega no crea ese formulario |

### Reglas del prototipo

- Estado inicial: jitomate a $32/kg. La propuesta ilustrativa de $30/kg no se aplica al comparar ni al entrar a revisión. Solo Guardar la confirma. Tras éxito, mantener el precio elegido en el estado local del prototipo y actualizar resúmenes/comparaciones; reiniciar demo restaura $32/kg. Las raíces son capturas de los estados inicial y de éxito, no un catálogo persistido.
- Todos los precios comparados son **ejemplos ilustrativos**: fichas simuladas de Jamaica $28, Portales $30 y Coyoacán $34, fechadas 25 oct 2026. Giro frutas y verduras; jitomate saladet convencional, primera, fresco, menudeo, sin envío, MXN por 1 kg. Mediana $30, rango $28–$34; muestra no representativa. No son cotizaciones reales. Se puede conservar $32. No se estima margen sin costos.
- El cambio solo afecta nuevos apartados; los ya aceptados conservan su precio. Aceptación de métodos en Mi puesto es configuración; los cobros del resumen proceden de ventas registradas: efectivo $1,420 + transferencia $440 + tarjeta $0 = $1,860. Balance registrado $1,080 = cobros $1,860 − gastos $780; no es utilidad.
- Validación a implementar al conectar: precio mayor que cero y máximo dos decimales; error junto al campo, conservar borrador y bloquear Guardar. Durante guardado, evitar doble envío. Si falla: «No pudimos guardar el precio. Tu precio anterior sigue vigente» y Reintentar, sin navegar a éxito. Si no hay referencias equivalentes o vigentes, conservar precio y mostrar «No hay referencias comparables vigentes»; no calcular una propuesta con unidades/calidades distintas. Estos comportamientos son especificaciones de conexión, no interacciones ejecutadas en el lienzo.

### Verificación realizada

- [x] Ocho raíces revisadas mediante capturas nativas, con contenido editable y botones que reutilizan los componentes existentes.
- [x] Auditoría final `Get` con instancias resueltas: sin problemas de recorte reportados en las ocho raíces; se corrigió el recorte del domingo en el gráfico.
- [x] Ninguna raíz terminada tiene `placeholder: true`; contenido móvil completo visible en lienzo.
- [x] Contraste calculado para los pares nuevos principales: mínimo 5.65:1; tipografía y paleta existentes conservadas.
- [x] Sin cambios de código, staging, commits, publicación ni despliegue. La navegación y los estados de error quedan para la conexión del prototipo y revisión humana.

## Detección por organización

Se detectaron en el lienzo las raíces D2zhK, Mgewd, pSIRS, TtKVe, y15ABx, kQgTm y X0uXg, todas sin placeholder. Se están integrando los recorridos desktop y móvil de comparar → revisar → guardar/cancelar. Se espera la entrega de IDs/acciones del diseñador de dashboard para cotejar el manifiesto. Los nuevos tableros UX spnbx, Vo4aC y mplP7 se incorporarán como referencia, sin editar su contenido.
