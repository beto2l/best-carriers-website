# Guía para agentes: páginas con LuxWrap Studio y OPIN X

Esta guía permite crear o modificar una página rápida dentro de un sitio WordPress existente, sin convertir el repositorio estático en una copia de WordPress ni duplicar los módulos de OPIN X.

El ejemplo vivo es `best-carriers.com`. Su fuente está en este repositorio y sus páginas publicadas se administran por **LuxWrap Studio (LW Studio)**.

## 1. Modelo mental

```text
Repositorio GitHub (contenido, diseño y build)
             |
             | commit en main + lw-release.json con checksums
             v
LW Studio en WordPress Multisite (valida y publica)
             |
             +--> Pages nativas de WordPress (menús, taxonomías, SEO)
             +--> Componentes OPIN X permitidos (datos y operaciones)
             v
Página pública rápida, con HTML estático y componentes dinámicos puntuales
```

**El repositorio es dueño de:** contenido editorial, HTML semántico, CSS, JavaScript de interfaz sin datos personales, diseño, SEO, `lw-release.json` y fallbacks seguros.

**WordPress/LW Studio es dueño de:** validar la publicación, montar cada ruta declarada, registrar o conservar su Page nativa y resolver los componentes autorizados.

**Los módulos especializados son dueños de sus propios datos y acciones.** Una página LW los presenta; no vuelve a implementar sus bases de datos, endpoints privados, secretos, Stripe ni píxeles.

## 2. Cuándo usar LW Studio

Usa LW Studio para una ruta específica que requiera diseño muy rápido y controlado por código, por ejemplo:

- una landing de curso, campaña o servicio;
- un catálogo HTML/JSON con filtros y diálogo accesible;
- una página bilingüe de ventas;
- una página de agradecimiento después de un pago.

No uses LW Studio para reemplazar todo WordPress cuando el sitio ya usa Divi u otro tema. En el modo `scope: "pages"`, LW Studio controla solamente las rutas declaradas. Todas las demás páginas, entradas, plantillas, menús y operaciones del sitio continúan en WordPress/Divi.

## 3. Contrato de una publicación

El archivo `lw-release.json` es el contrato que LW Studio valida. Se genera con `npm run build`; nunca se edita a mano.

Cada Page necesita un `id` permanente, una ruta, un archivo de entrada y su idioma:

```json
{
  "contract_version": 5,
  "runtime": "static",
  "scope": "pages",
  "site": "best-carriers-website",
  "version": "1.3.1",
  "pages": [
    {
      "id": "mi-pagina-es",
      "title": "Mi página",
      "route": "mi-pagina",
      "entry": "pages/mi-pagina/index.html",
      "language": "es",
      "translation_key": "mi-pagina"
    }
  ],
  "files_sha256": {
    "pages/mi-pagina/index.html": "sha256-generado-por-el-build"
  }
}
```

Reglas no negociables:

1. Mantén el `id` de una Page ya publicada. Es la relación estable con su Page nativa, menús, taxonomías y metadatos SEO de WordPress.
2. Mantén los pares bilingües con el mismo `translation_key` y rutas distintas.
3. Incrementa `package.json.version` cuando cambie cualquier byte publicado.
4. El build debe recalcular todos los checksums. Un archivo sin checksum no se publica.
5. El repositorio no contiene claves, tokens, contraseñas, datos de pago ni datos personales de clientes.

Al publicar, las rutas declaradas aparecen en **Pages** de WordPress con estado `LuxWrap Studio`. Se pueden añadir a menús, ordenar, etiquetar y clasificar. La edición visual o de Divi no es la fuente del diseño: el cambio de diseño vuelve al repositorio para no perderlo en la próxima publicación.

## 4. Catálogo de recursos OPIN X

| Necesidad en la página | Módulo propietario | Cómo se integra desde LW | Límite importante |
| --- | --- | --- | --- |
| Registro, validación y publicación de páginas | LuxWrap Studio | `lw-release.json`, LW Sites, LW Release y `opinx-component` permitidos | No descargar/copiar archivos manualmente al servidor. |
| Precio, disponibilidad, acceso y ficha de un curso | Cursos y Ventas | Declarar un componente de checkout por `product` e idioma | El precio o disponibilidad se cambia en Cursos y Ventas, no en HTML. |
| Stripe, intención de compra, Purchase, reintentos y fulfillment | Funnel de Pagos | Usar el checkout resuelto por WordPress | No crear Stripe, formularios de tarjeta, webhooks ni eventos Purchase en JavaScript del repositorio. |
| Acceso de un alumno y compra confirmada | NUSA / Learning, a través de Cursos y Ventas y Funnel | Usar el componente de resultado de pago y la ruta de agradecimiento | No simular una inscripción ni enviar accesos desde la landing. |
| Reseñas, promedio, fotos de participantes y carga incremental | Reviews Hub | Componente `social_proof` con fallback estático | La calificación debe indicar si representa la marca y no un curso individual. |
| Imágenes, optimización y vaciado coordinado de caché | CDN y Cache | Subir primero en WordPress mediante **OPIN X > CDN y Cache > Imágenes CDN** y usar la URL resultante | No usar un CDN externo ni incluir tokens en el repositorio. |
| Botón o enlace de WhatsApp | WhatsApp Link | Usar la URL y el mensaje aprobados por sitio; mantener un enlace normal como fallback | No alterar destino ni mensaje sin aprobación. |
| Validación de correo en una captura de lead | Email Validator | El formulario debe ser un componente/flujo WordPress autorizado | No guardar ni validar correos sensibles en JavaScript estático. |
| Envío a NUSA, Mautic, Meta, TikTok o Telegram | Lead Router y/o Funnel de Pagos | Conectar un formulario o checkout aprobado en WordPress | No enviar eventos de contacto o venta directamente desde el repositorio. |
| UTMs y enlaces de campañas | Tracking URL Generator | Generar y administrar URLs desde el módulo; la landing solo conserva sus enlaces públicos | No inventar parámetros o píxeles duplicados en cada página. |
| Año actual | Current Year o JavaScript local seguro | Usar `data-current-year` para texto no transaccional | No depende de datos privados ni requiere endpoint. |

Un componente solo puede usarse si LW Studio lo admite y la clave se declara dentro de `global_content`. Si no existe un contrato aprobado para una necesidad, detente: primero se implementa y documenta la integración en el módulo propietario.

## 5. Patrón de componente dinámico

El HTML contiene el lugar y un fallback que funciona sin el componente. WordPress reemplaza o hidrata solamente una clave allowlisted declarada en `lw-release.json`.

```html
<opinx-component data-opinx-global-content="motus-checkout-es">
  <div data-component-fallback>
    <p role="status">La compra está temporalmente en actualización.</p>
    <a href="https://wa.me/...">Consultar por WhatsApp</a>
  </div>
</opinx-component>
```

Y la misma clave se declara en el manifiesto:

```json
{
  "global_content": {
    "motus-checkout-es": {
      "version": "1",
      "type": "checkout",
      "product": "motus",
      "language": "es",
      "design_variant": "headless",
      "required_product_type": "recorded_course",
      "require_legal": true
    }
  }
}
```

El patrón actual de Best Carriers utiliza:

- `social_proof`: Reviews Hub publica la calificación, reseñas y fotos moderadas.
- `checkout`: Cursos y Ventas proporciona la ficha canónica; Funnel de Pagos opera el precio, Stripe, la intención y la compra.
- `payment_result`: muestra el resultado de una compra validada, sin sesión ni datos de pago dentro del HTML.

El atributo `design_variant: "headless"` significa que la página conserva su diseño propio, pero no la lógica comercial.

## 6. Receta para crear una nueva página

1. **Define el alcance.** Confirma el dominio, ruta, idioma(s), objetivo, titular de datos y si la ruta ya existe. Si coexistirá con Divi, usa `scope: "pages"`.
2. **Identifica los propietarios.** Decide si solo hay contenido estático o si requiere un recurso de la tabla anterior. Para precio de curso, formularios o reseñas, confirma primero el módulo dueño y la configuración por sitio.
3. **Crea la fuente.** Añade contenido bilingüe en `content/`, la generación en `scripts/` y CSS/JS propio en `src/`. Mantén HTML semántico, foco visible, `prefers-reduced-motion`, imágenes con `alt` y fallback sin JavaScript.
4. **Declara las Pages.** Asigna IDs nuevos y permanentes, rutas sin conflicto, `translation_key` compartido y canonicals/hreflang correctos.
5. **Usa imágenes correctamente.** Optimiza y sube por `OPIN X > CDN y Cache > Imágenes CDN`; copia la URL CDN aprobada a la fuente. No generes URLs de CDN manualmente ni agregues binarios de producción al repositorio.
6. **Integra datos dinámicos por contrato.** Inserta un `opinx-component` y su fallback. Declara la clave exacta en `global_content`. Nunca copies la lógica del módulo propietario.
7. **Construye y valida.** Ejecuta `npm test`. Para una liberación de MOTUS, el build conserva los artefactos de servicios sin cambios y sólo regenera MOTUS, gracias y el manifiesto; usa `FULL_RELEASE=1 npm run build` únicamente cuando el cambio sí incluye servicios. Inspecciona el diff, comprueba los checksums y que no haya secretos.
8. **Publica el código.** Haz commit de los archivos intencionales y envíalo a `main`.
9. **Publica en WordPress.** En el subsite: **OPIN X > LuxWrap Studio**. Revisa el commit y las rutas; selecciona actualizar/publicar la versión revisada.
10. **Verifica producción.** Comprueba desktop y móvil, las Page nativas, el menú si aplica, los componentes, la URL CDN, el enlace WhatsApp y las capas de caché autorizadas.

## 7. Caso de referencia: MOTUS

La venta de MOTUS demuestra la separación correcta:

- La landing y agradecimiento son seis Pages estáticas bilingües de este repositorio.
- La imagen de curso y los visuales de producto se sirven desde el CDN de Best Carriers; no se cargan desde el repositorio en producción. Cada imagen incluye URL CDN, dimensiones, `loading="lazy"` salvo la imagen principal, `decoding="async"` y texto alternativo para ambos idiomas.
- La página declara checkout y resultado de pago, pero no contiene precio fijo, lógica de Stripe, credenciales ni webhooks.
- Si el precio, disponibilidad o beneficios comerciales cambian, se actualizan en **Cursos y Ventas**. Funnel de Pagos recibe la proyección canonica y el checkout de la landing refleja la nueva ficha.
- Reviews Hub provee reseñas y fotos. El HTML incluye un fallback accesible y el runtime conserva "Ver más comentarios" y "Ver más fotos" como enlaces con respaldo sin JavaScript.
- Los videos muestran miniatura de YouTube y solo crean el reproductor al hacer clic; esto protege rendimiento inicial y evita reproducir contenido sin intención. La tarjeta de instructor usa `icLfupSYr_4` y conserva los textos “Conoce a tu instructor” / “Meet your instructor”.
- El temario se modela por módulos y lecciones en `content/motus.json`; el build lo genera como acordeones accesibles. No conviertas esa información en una imagen ni la ocultes dentro de JavaScript.
- El CTA fijo móvil inicia oculto y solo se vuelve interactivo cuando el hero ya salió de vista. Todos los CTAs de venta apuntan a `#checkout`; el precio, disponibilidad y checkout siguen siendo dinámicos.
- El checkout aparece inmediatamente después del hero para reducir fricción, mientras que la compra real sigue perteneciendo a Funnel de Pagos.

### Contrato comercial adicional de MOTUS

La versión `1.3.4` incorpora una prueba comercial en el hero: los servicios para resolver incidencias de MOTUS suelen cotizarse aproximadamente entre `$500` y `$750 USD`, y el curso enseña el proceso para que el alumno pueda aplicarlo en su práctica profesional y, si corresponde, ofrecerlo a sus clientes. Es una referencia de posicionamiento, no una garantía de ingresos, resultados ni de que el alumno deba vender un servicio.

La cifra tachada de referencia (`$150`) pertenece solamente a la presentación de la landing. El valor vigente **no se guarda ni se calcula en este repositorio**: el script de interfaz lee el precio que ya renderiza `.opinx-checkout-model` dentro del componente checkout. Esa línea llega desde el contrato canónico de Cursos y Ventas/Funnel, por lo que una actualización en NUSA/Cursos y Ventas se muestra tanto en el checkout como en el hero sin una segunda fuente de precio. Si no existe un precio renderizado, el hero muestra el fallback “Ver precio vigente en el checkout”; no se debe sustituir por una cifra estática.

Los enlaces a términos y privacidad se renderizan como presentación de la landing inmediatamente después de las tres garantías de compra, fuera de la tarjeta de pago. El bloque interno `.opin-fi-digital-sale-legal` de Funnel permanece visualmente oculto porque contenía texto comercial no aprobado para esta página. No copies campos, Stripe, upsells, consentimiento ni validaciones desde el checkout a la landing.

Para MOTUS, Funnel debe retirar el checkbox opcional de consentimiento promocional SMS/MMS del checkout de producto sin afectar el soporte de leads. La sugerencia de corrección de dominio del correo debe usar Email Validator de forma local, accesible y con texto asociado al campo (`role=status` o equivalente); no debe enviar el correo a terceros desde HTML o JavaScript estático. LW Studio no recrea esa validación: solo estiliza las clases que entregue el componente (`.opin-fi-email-feedback`, `.opin-fi-capture-status` y `.opin-fi-checkout-error`).

La versión `1.3.1` añade la demostración visual de plataforma, lecciones, temario, recursos descargables y certificado mediante el CDN; añade la imagen de participantes como respaldo de autoridad para el instructor; y conserva la revisión previa: paleta inspirada en MOTUS, sin cabecera fija de idioma, video previews reales, estrellas visuales, checkout alto, texto de soporte extenso eliminado y enlaces externos no solicitados retirados.

La versión `1.3.2` corrige una composición que no cumplía la pauta comercial: reduce el hero y las separaciones verticales, usa la paleta cálida de la página de consultoría (marfil, grafito y dorado), muestra las 13 lecciones sin acordeones, agranda los beneficios y añade CTAs de compra tras las secciones de problema y temario. El checkout sigue siendo propiedad de Cursos y Ventas/Funnel: la landing oculta únicamente el bloque visual `.opin-fi-digital-sale-legal` que no fue aprobado para esta página, sin tocar precio, disponibilidad, Stripe, consentimiento, upsell ni términos. La versión `1.3.3` declara explícitamente `featured_first` y mínimo cinco palabras en ambos componentes Social Proof; Reviews Hub `0.3.26` y LuxWrap Studio `0.9.7` conservan esa selección en SSR, REST y paginación. El JavaScript de la landing mantiene un filtro visual adicional para evitar testimonios de una palabra, emojis o respuestas vacías si una caché anterior responde brevemente. La versión `1.3.4` añade la prueba comercial y el precio sincronizado descritos arriba, y mueve los enlaces legales fuera de la tarjeta de pago.

## 8. Formularios, tracking y eventos: regla de seguridad

Una landing puede contener una zona visual para un formulario, pero el envío debe pertenecer a un flujo WordPress previamente configurado. Antes de publicar un formulario que capture contactos, verifica:

1. la política de Email Validator;
2. la ruta autorizada de Lead Router;
3. el destino de NUSA/Mautic y su consentimiento;
4. la configuración de eventos de Meta/TikTok/GTM, sin duplicar eventos de Funnel;
5. el aviso de privacidad y los mensajes de error/no disponibilidad.

Para una venta, Funnel es el único emisor de `Purchase` confirmado. Para una captura de contacto, Lead Router es el dueño del enrutamiento. El HTML estático puede reportar una interacción de interfaz no sensible solo cuando exista una especificación aprobada; no debe enviar nombre, correo, teléfono, identificadores publicitarios ni conversiones directamente a proveedores externos.

## 9. CDN y caché después de publicar

LW Studio valida el release; no sustituye el procedimiento del CDN. Cuando cambie una imagen, HTML público o configuración comercial:

1. verifica que la imagen responda desde la URL CDN aprobada;
2. en el sitio, usa **OPIN X > CDN y Cache** para diagnosticar y barrer únicamente las capas autorizadas;
3. el orden de barrido es WordPress/Redis, Varnish y Cloudflare;
4. verifica la versión pública (`data-release`) y una carga sin sesión.

No purgues zonas genéricas ni cambies DNS desde una publicación de página. La configuración de dominio, Cloudflare y hosting sigue siendo un paso de infraestructura separado.

## 10. Lista final para un agente

- [ ] Leí `AGENTS.md`, este documento, `README.md`, `content/` y `lw-release.json`.
- [ ] Sé quién posee cada dato, pago, formulario y evento.
- [ ] No cambié IDs ni rutas existentes sin una migración aprobada.
- [ ] Las dos variantes de idioma tienen contenido, canonical y `hreflang` correctos.
- [ ] Los recursos visuales se sirven desde CDN autorizado.
- [ ] Hay fallback para componente dinámico y no hay secretos ni PII en el repositorio.
- [ ] `npm test` pasó y los checksums coinciden.
- [ ] El commit está en `main` y la versión fue publicada desde LW Studio.
- [ ] Probé la ruta pública, sus componentes, Page nativa y caché.
