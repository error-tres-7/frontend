# De Aquí · Prototipo local

Abre [prototype/index.html](prototype/index.html) en un navegador moderno. En macOS, desde la raíz del proyecto:

```sh
open prototype/index.html
```

No necesita instalar paquetes ni iniciar la aplicación. Mantén la carpeta `prototype/` completa: HTML, JS, CSS y `screens/`. Como alternativa, en un entorno que permita puertos locales:

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory prototype
```

Después abre `http://127.0.0.1:4174`. El puerto no pudo abrirse en este sandbox; la apertura directa como archivo sí se ejecutó y verificó.

## Recorridos que funcionan

- **Cliente escritorio:** explorar → buscar jitomate → cuadrícula/lista → catálogo de Doña Lucha → editar cantidades → carrito → revisar → elegir horario/nombre → solicitar → estado por confirmar → ver apartado / volver al mercado.
- **Cliente móvil:** explorar → mercado → cuadrícula/lista → catálogo → carrito con cantidades, quitar productos y total → revisión → solicitud pendiente. Cerrar conserva la vista de mercado desde la que se abrió. Una canasta vacía bloquea la revisión.
- **Comparación del cliente:** Doña Lucha $32/kg frente a Pepe $28/kg. El catálogo de Pepe abre un diálogo de comparación con cierre/volver; su apartado no está implementado. La solicitud interactiva pertenece a Doña Lucha.
- **Comerciante:** navegación entre resumen, productos, pedidos, finanzas y mi puesto; aceptar → preparación móvil → marcar listo. Registrar gasto y venta guarda movimientos de demostración; descargar registro produce un CSV local. Las pantallas financieras de referencia conservan sus cifras ilustrativas.
- **Precio del comerciante, escritorio y móvil:** resumen → referencias del mismo giro → revisar propuesta → editar un precio positivo con dos decimales → guardar explícitamente → éxito. Cancelar/conservar no aplica el borrador. El precio elegido se conserva en los resúmenes y comparaciones de este recorrido.
- **Fallos de precio:** en “Escenarios de demostración”, alternar ausencia de referencias bloquea una propuesta; simular fallo al guardar conserva el precio anterior y el borrador. Reintentar lleva al éxito. El guardado evita la doble ejecución durante la transición.
- **Controles comunes:** enlaces por fragmento, selector de pantalla, índice de recorridos, botón Volver, historial del navegador, cerrar diálogos, áreas clicables opcionales y lista accesible de acciones. Favoritos abre el catálogo y conecta a explorar/pedidos.

## Organización del lienzo

`design.pen` conserva los IDs y el contenido de las pantallas. El lienzo separa los recorridos principales de sus alternativas y cuenta con el índice `DVSNA` y encabezados de sección. Las pantallas nuevas se cotejaron con [DASHBOARD-DESIGN.md](DASHBOARD-DESIGN.md).

| Área | Posición |
| --- | --- |
| Marca, componentes y fotografías | y = 0 |
| Cliente escritorio | y = 780, izquierda a derecha |
| Comerciante escritorio | y = 2000 |
| Alternativa escritorio: mercado en lista | x = 0, y = 3500; último bloque de escritorio |
| Cliente móvil: recorrido principal | y = 4600, x = 0–2450, izquierda a derecha |
| Cliente móvil: favoritos y lista | y = 6000; favoritos bajo Explorar, lista bajo Mercado |
| Comerciante móvil: resumen → comparar → revisar → guardado | y = 7300, x = 0–1470 |
| Comerciante móvil: preparar pedido | x = 2200, y = 7300; rama de operación independiente |
| Todos los tableros y estados UX | y = 8910, x = 0–6880; encabezado en y = 8800 |
| Índice `DVSNA` | x = 0, y = 10300 |

Orden vertical del lienzo: escritorio → móvil → UX → índice. La última pantalla de escritorio termina en y = 4280; los móviles empiezan en y = 4600 y terminan en y = 8591. Los flujos y estados UX comienzan en y = 8910 y terminan en y = 10030. Se verificó la separación de escritorio y móvil; el diseñador delegado verificó las seis raíces de la sección UX, sin solapamientos y con placeholders despejados. Se actualizó la exportación del índice del prototipo. Las pantallas conservan su composición y sus destinos; este cambio solo modifica su ubicación en el lienzo y las indicaciones del índice. No se sustituyó la UI de producción.

## Alcance y límites

El esquema `.pen` y las herramientas disponibles no exponen conexiones nativas de prototipo entre nodos. `href` existe para textos, pero no una API de hotspots/transiciones de pantalla. Por eso la navegación vive en este HTML independiente, con **36 imágenes exportadas y 203 hotspots**, más diálogos y controles HTML para estado interactivo. Los tableros UX y la marca son referencias estáticas, navegables desde el índice.

Los datos son ficticios. No se hacen pagos, solicitudes de red, verificaciones de celular, reservas de stock, mensajes, scraping, publicación ni cambios de catálogo real. El buscador representa solo jitomate en Mercado Medellín y muestra una explicación para otras consultas. El plano sigue marcado como próximo. Formularios del inventario y del perfil público son capturas con navegación y feedback; no son editores completos. Los estados UX de acceso/recuperación son documentación, no flujos funcionales completos.

El cambio de precio del comerciante actualiza el estado del recorrido de precios; no se propaga a las capturas de inventario ni a la canasta de cliente de $77, que es un escenario independiente. La preparación y el registro financiero son demostraciones separadas; no existe sincronización de pedidos ni conciliación entre ambos lados. Algunas rutas del comerciante móvil llevan a pantallas de escritorio porque no existe adaptación móvil de esas secciones.

Las imágenes se escalan conservando su composición, no se reorganizan como una aplicación responsive. A 390 px el recorrido móvil no tuvo desbordamiento horizontal. Los hotspots de una pantalla desktop pueden quedar pequeños al reducirla; la lista “Acciones disponibles” ofrece botones alternativos y navegación por teclado. No se afirma una auditoría WCAG completa.

El estado vive en memoria de la pestaña y en `sessionStorage` cuando el navegador lo permite. Recargar conserva el estado en Chromium probado; “Reiniciar” restaura los ejemplos. No se garantiza persistencia entre navegadores o con almacenamiento bloqueado. Los archivos deben volver a exportarse tras cambios futuros del lienzo.

## Verificación ejecutada

- `node --check prototype/prototype.js` y `node --check prototype/checks.js`: sin errores de sintaxis.
- `python3 prototype/build-manifest.py`: reconstruye 36 pantallas y 203 hotspots. Todas las imágenes existen.
- Navegador integrado de pen.dev/Chromium, apertura directa `file://`: **187 comprobaciones aprobadas**. Incluyen dimensiones de las 36 imágenes, límites de hotspots, rutas, cantidades/totales, carrito vacío, contacto/horario, solicitud pendiente, navegación del comerciante, validación de gasto/precio, cancelar/conservar, guardado, fallo/reintento, ausencia de referencias, enlace desconocido y reinicio. Resultado: [browser-checks.json](prototype/browser-checks.json).
- Clics reales de puntero vía CDP: recorrido desktop (inicio, búsqueda, lista, catálogo, cerrar y Volver) y móvil a 390 × 844 (mercado, lista, catálogo, incrementar jitomate, revisión y solicitud pendiente). Resultado: [pointer-checks.json](prototype/pointer-checks.json).
- Las acciones de venta, descarga CSV y feedback de guardado de inventario/perfil están implementadas; no se verificó de extremo a extremo la descarga a disco ni esas rutas secundarias.
- Playwright no se ejecutó: falta su binario de Chromium instalado. No se descargaron dependencias para suplirlo. Una captura adicional por selector no terminó y se canceló; después se revisó el estado móvil pendiente mediante una captura CDP directa. La imagen refleja el total actualizado de $109 sin recorte de contenido.

Para repetir las comprobaciones del navegador, abre `prototype/index.html?test=1`. Consulta `window.PROTOTYPE_CHECKS` en la consola; el resultado aparece cuando termina. Se reinicia el estado de demostración. La prueba vive en [checks.js](prototype/checks.js) y activa los botones reales del documento mediante DOM; la verificación de puntero es una pasada adicional separada.

## Archivos y actualización

- [manifest.json](prototype/manifest.json): fuente exacta de pantallas, dimensiones, coordenadas, etiquetas, acciones y destinos.
- [canvas-nodes.json](prototype/canvas-nodes.json): geometría y textos visibles extraídos del lienzo; no es el `.pen` original.
- [build-manifest.py](prototype/build-manifest.py): reconstruye el manifiesto desde esa extracción.
- [data.js](prototype/data.js): datos empaquetados para abrir sin servidor. Se regenera junto con el manifiesto mediante `build-manifest.py`.
- `screens/<ID>.png`: exportaciones nativas a escala 1.
- `prototype.js`, `prototype.css`: capa local de navegación y estado; no importan código de `src/`.

Este agente no tocó `src/` ni la configuración de paquetes/aplicación y no ejecutó commits, staging, pushes, PRs, publicación ni despliegue. La revisión final de Git detectó `prototype/browser-checks.json` staged por una acción concurrente; ese índice se dejó intacto para revisión humana. Quedan para revisión humana las decisiones de producto del carrito multicomerciante y la implementación real de las reglas representadas en los tableros UX.

## Manifiesto de pantallas y acciones

Cada nombre corresponde a un control del prototipo. Los destinos y rectángulos exactos están en `manifest.json`. Un feedback de demostración no equivale a un cambio persistente en la aplicación.

### Cliente · escritorio

| ID | Pantalla | Acciones |
| --- | --- | --- |
| `aiuVt` | 01 · Explorar el barrio | Buscar jitomate en el mercado · Ver Mercado Medellín · Ver productos de Doña Lucha · Entrar como comerciante · Entrar como cliente · Iniciar sesión de demostración |
| `GcHvf` | 02 · Mercado y comerciantes | Volver al mapa · Ver cuadrícula · Ver lista · Buscar productos · Ver productos de Doña Lucha · Ver productos de El huerto de Pepe · Abrir carrito · Abrir carrito desde cabecera · Plano disponible próximamente · Iniciar sesión de demostración |
| `CTwi6` | 03 · Puesto · Catálogo en modal | Cerrar catálogo · Revisar apartado · Reducir jitomate · Aumentar jitomate · Reducir aguacate · Aumentar aguacate · Reducir cilantro · Aumentar cilantro · Buscar en el catálogo |
| `QRWqF` | 04 · Revisar apartado · Modal | Volver al catálogo · Cerrar revisión · Solicitar apartado · Elegir horario de recogida · Editar quién recoge |
| `mLRAY` | Cliente · Escritorio · Apartado por confirmar | Cerrar solicitud enviada · Volver al mercado · Ver mi apartado |

### Cliente · móvil

| ID | Pantalla | Acciones |
| --- | --- | --- |
| `KKxdU` | 09 · Móvil · Explorar | Buscar jitomate en el mercado · Ver Mercado Medellín · Ver productos de Doña Lucha · Entrar como comerciante · Entrar como cliente · Iniciar sesión de demostración |
| `p45ipV` | Mercado · Móvil · Vista cuadrícula | Volver al mapa · Ver cuadrícula · Ver lista · Buscar productos · Ver productos de Doña Lucha · Ver productos de El huerto de Pepe · Abrir carrito · Abrir carrito desde cabecera · Plano disponible próximamente |
| `M2vgQT` | 10 · Móvil · Catálogo en hoja | Cerrar catálogo · Revisar apartado · Reducir jitomate · Aumentar jitomate · Reducir aguacate · Aumentar aguacate · Reducir cilantro · Aumentar cilantro · Buscar en el catálogo |
| `BVUFI` | Mercado · Móvil · Carrito abierto | Volver al mercado · Seguir buscando productos · Revisar apartado · Eliminar jitomate · Reducir jitomate · Aumentar jitomate · Eliminar aguacate · Reducir aguacate · Aumentar aguacate · Eliminar cilantro · Reducir cilantro · Aumentar cilantro |
| `a4Tzo` | Cliente · Móvil · Revisar apartado | Volver al catálogo · Cerrar revisión · Solicitar apartado · Elegir horario de recogida · Editar quién recoge |
| `EFCOW` | 11 · Móvil · Apartado por confirmar | Cerrar solicitud enviada · Volver al mercado · Ver mi apartado |

### Comerciante

| ID | Pantalla | Acciones |
| --- | --- | --- |
| `T28VaZ` | 05 · Resumen del comerciante | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Ver puesto público · Consultar ayuda · Editar formas de pago · Revisar pedidos · Ver todos los pedidos · Ver pedido 041 · Registrar venta de demostración · Comparar precios del giro |
| `BnjUF` | 06 · Productos e inventario | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Ver puesto público · Consultar ayuda · Guardar cambios de producto · Agregar producto de demostración · Cancelar edición |
| `SWso9` | 07 · Gestión de pedidos | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Ver puesto público · Consultar ayuda · Aceptar pedido y preparar · Proponer cambio · No puedo atenderlo |
| `bpqzW` | 08 · Finanzas y registro de gastos | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Ver puesto público · Consultar ayuda · Guardar gasto de demostración · Descargar registro de demostración |
| `h91to` | 13 · Mi puesto · Información pública | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Ver puesto público · Consultar ayuda · Guardar puesto de demostración |
| `OrB9k` | 12 · Móvil · Preparar pedido | Ir a resumen · Ir a pedidos · Ir a productos · Ir a más · Marcar pedido como listo |
| `D2zhK` | Comerciante · Comparar precios del mismo giro | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Consultar ayuda · Volver al resumen · Revisar nuevo precio · Conservar precio actual |
| `Mgewd` | Comerciante · Revisar cambio de precio | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Consultar ayuda · Volver a comparar precios · Editar nuevo precio · Guardar nuevo precio · Cancelar cambio de precio |
| `X0uXg` | Comerciante · Precio guardado · Simulación | Ir a resumen · Ir a productos · Ir a pedidos · Ir a finanzas · Ir a mi puesto · Consultar ayuda · Volver al resumen |
| `pSIRS` | Comerciante · Móvil · Resumen y precios | Comparar precios del giro · Registrar venta de demostración · Editar formas de pago · Revisar pedidos pendientes · Revisar stock de cilantro · Ir a resumen · Ir a pedidos · Ir a productos · Ir a mi puesto |
| `TtKVe` | Comerciante · Móvil · Comparar precios | Volver al resumen · Revisar nuevo precio · Conservar precio actual |
| `y15ABx` | Comerciante · Móvil · Revisar precio | Volver a comparar precios · Editar nuevo precio · Guardar nuevo precio · Cancelar cambio de precio |
| `kQgTm` | Comerciante · Móvil · Precio guardado · Simulación | Volver al resumen |

### Alternativas

| ID | Pantalla | Acciones |
| --- | --- | --- |
| `vHDrB` | Mercado · Escritorio · Vista lista | Volver al mapa · Ver cuadrícula · Ver lista · Buscar productos · Ver productos de Doña Lucha · Ver productos de El huerto de Pepe · Abrir carrito · Abrir carrito desde cabecera · Plano disponible próximamente · Iniciar sesión de demostración |
| `j6xDkI` | Mercado · Móvil · Vista lista | Volver al mapa · Ver cuadrícula · Ver lista · Buscar productos · Ver productos de Doña Lucha · Ver productos de El huerto de Pepe · Abrir carrito · Abrir carrito desde cabecera · Plano disponible próximamente |
| `defJ5` | 14 · Móvil · Mis favoritos | Ir a explorar · Ir a pedidos · Ir a favoritos · Ver productos favoritos |

### Soporte y referencia

| ID | Pantalla | Acciones |
| --- | --- | --- |
| `U3vDvD` | De Aquí · Brand and experience direction | Referencia estática; selector, índice y Volver |
| `euR0h` | Sistema de marca · Tokens y componentes | Referencia estática; selector, índice y Volver |
| `o8vGp` | Reusable photography · illustrative assets | Referencia estática; selector, índice y Volver |
| `r2JYH` | UX · Cliente · Descubrir y apartar | Referencia estática; selector, índice y Volver |
| `Ijo5S` | Estados UX · Acceso, cambios y recuperación | Referencia estática; selector, índice y Volver |
| `spnbx` | UX · Comerciante · Operación diaria | Referencia estática; selector, índice y Volver |
| `Vo4aC` | UX · Alta y pagos · Publicar el puesto | Referencia estática; selector, índice y Volver |
| `mplP7` | UX · Precios · Comparar y decidir | Referencia estática; selector, índice y Volver |
| `DVSNA` | Prototipo · Índice de recorridos | Abrir recorrido 1 · Abrir recorrido 2 · Abrir recorrido 3 · Abrir recorrido 4 · Abrir recorrido 5 |
