# Catálogo de cursos · release 1.3.24

La ruta preparada es `/cursos/`, con identidad permanente `course-catalog-es`. Requiere LW Studio 0.9.15 y el nuevo componente oficial `course_catalog`. El estado de este trabajo es **versión para revisión**, sin sustitución de la página pública.

## Diseño y contenido

- Dirección visual compartida con Servicios: azul profundo, verde, fondos claros, fotografías de transporte y tipografía limpia.
- Portada original generada con la herramienta de imágenes integrada; archivo editable/original en `design/course-catalog-hero-source.png` y WebP optimizado en `design/course-catalog-hero.webp` (1672 × 941, aproximadamente 102 KB).
- El WebP fue importado por WordPress usando el cliente CDN autorizado del sitio. Attachment 1631; URL devuelta: `https://bc.opin-x.com/best-carriers-courses-hero-v1.webp`.
- Seis cursos actuales; imágenes existentes del CDN de Best Carriers, una descripción breve y enlace a la landing informativa. Sin precios ni formularios de pago.
- Tarjetas, tabla, búsqueda y filtros por modalidad. La tabla se convierte en filas apiladas con etiquetas en móvil.
- Grabaciones, certificado de participación y un año de acceso al curso comprado. Paquetes cotizados por cantidad de cursos.
- Mismo componente Reviews Hub y mismo video de testimonios utilizados en MOTUS, adaptados a la identidad de este catálogo. Calificaciones de la marca, no de un curso específico.
- FAQ, título/descripción SEO, enlaces HTML, canonical, alternates y `CollectionPage`/`BreadcrumbList`. El componente aporta `ItemList`/`Course` con los cursos incluidos realmente. Sin precios, estrellas de reseñas en schema ni promesas de resultados enriquecidos.

## Qué se actualiza automáticamente

1. WordPress determina la pertenencia: Page publicada, idioma español, categoría exacta `cursos`.
2. Cursos y Ventas aporta la modalidad y las fechas. Se reutilizan `OPIN_Tools_Course_Catalog`, `opin_course_date` y `opin_course_schedule`.
3. Ambas vistas y los datos estructurados se renderizan en servidor desde la misma lista.
4. Los cursos en vivo se ordenan por fecha estructurada; después aparecen los grabados y los próximos sin fecha. El siguiente acceso refleja cambios de categoría, modalidad, fecha y horario, sin volver a publicar el diseño. La respuesta del catálogo usa `no-store`; las imágenes mantienen su CDN.
5. Una fecha vencida o sin confirmar muestra un estado próximo. Un curso grabado muestra disponibilidad a su ritmo. El límite del día se evalúa en la zona horaria del curso, no UTC.

`content/courses.json` conserva únicamente decisiones editoriales: títulos, descripciones, imágenes, temas y orden. Sus registros no deciden la inclusión. Al publicar una nueva Page en la categoría, aparece aunque no tenga entrada editorial, usando título, extracto e imagen destacada de WordPress. La relación canónica se resuelve por las rutas configuradas del curso; también admite `_opinx_course_key` o una entrada editorial explícita.

## Previsualización y comprobaciones

`npm test` genera y valida la release completa. El directorio ignorado `preview/` contiene la representación real obtenida en lectura de WordPress y Reviews Hub, más las capturas de revisión. No contiene una copia de la configuración privada de ventas. La previsualización tiene `noindex,nofollow` y es una instantánea, no el sistema publicado.

```sh
node scripts/preview-courses.mjs
python3 -m http.server 8765 --bind 127.0.0.1 --directory preview
```

`preview/catalog.html` se obtuvo ejecutando en memoria el nuevo renderer PHP contra los datos reales del sitio, sin instalarlo ni cambiar cursos. `preview/proof.html` proviene del runtime oficial existente. Para una nueva instantánea, regenerar esos dos archivos mediante la conexión WordPress autorizada y después ejecutar el comando de preview.

Verificado:

- 6 cursos reales: 4 en vivo, MOTUS grabado, Reclutamiento próximo.
- Fechas/horarios, enlaces a landings y ausencia de precios.
- Tarjetas/tabla, filtro grabados, búsqueda vacía/restablecimiento y contador singular/plural.
- Escritorio 1440 px, tablet 768 px, móvil 390 y 320 px. Sin desbordamiento de página; tabla móvil apilada y legible.
- HTML con los seis cursos sin JavaScript; controles ocultos y enlaces utilizables.
- Video diferido; solo se crea el reproductor al solicitarlo. Sin errores de consola durante las comprobaciones.
- Preflight real en lectura: adopción de Page 622, siete páginas sin cambios, cero conflictos y cero retiradas; traducción 726 y portada 1585 conservadas.
- PHP: 50 aserciones de fechas, medianoche de Chicago, cambios de categoría, nuevos cursos, privacidad, HTML, schema y validación del contrato. Regresiones de componentes, releases, rutas y Pages aprobadas.

## Publicación pendiente

1. Integrar y actualizar el módulo LW Studio 0.9.15 mediante su paquete oficial.
2. Publicar el commit revisado de esta release usando el flujo normal de LW Studio; permitir la adopción de la Page **622**, no crear un catálogo duplicado. Conservar su relación con la Page inglesa **726**. La versión inglesa existente permanece nativa.
3. Verificar el preflight del commit inmutable: ninguna retirada ni conflicto; la portada sigue siendo Servicios.
4. Comprobar `/cursos/` y las rutas hijas de MOTUS, header `Cache-Control`, canonical, HTML renderizado y enlaces. Eliminar la copia anterior de la caché mediante CDN y Cache al publicar.
5. Alinear por separado la política comercial de MOTUS: la configuración/landing existente aún declara acceso de por vida. Este trabajo no altera derechos de compradores anteriores ni su configuración de acceso; el nuevo catálogo incorpora la política de un año indicada por el propietario.

Los cambios generados de MOTUS/pagos en esta release son únicamente su etiqueta de versión; su contenido y comportamiento permanecen idénticos. Las páginas de Servicios se preservan byte por byte.

## Prompt de la portada

Herramienta integrada `image_gen`, generación nueva, fondo opaco:

> Use case: photorealistic-natural. Asset type: premium Best Carriers trucking education website hero, wide horizontal landscape 16:9. A single modern graphite and silver American semi truck with a white dry van trailer drives toward the camera in a realistic front three-quarter view on a clean US interstate through gentle Midwestern fields at dawn. Editorial commercial photography, refined warm sunrise light touching the truck, deep navy shadows, restrained green countryside, realistic road geometry and truck wheels. Place the truck in the right half of the frame with generous atmospheric dark sky and distant field negative space on the left for website typography; the complete cab must stay well within the right two thirds with breathing room. Subtle cinematic atmosphere, confident professional transport business, realistic not futuristic, crisp physical detail without excessive HDR. No people, no text, no logos, no lettering, no watermarks, no interface, no floating graphics, no duplicate trucks. Image only; all typography is added separately in HTML.
