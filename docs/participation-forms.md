# Official participation forms

Reviewed in the live forms on **September 10, 2026**. This records the visible labels, browser constraints, upload help, and conditional behavior used in `prompts/participacion.md`. No personal information, uploads, or submissions were sent. Required status below reflects the form's labels and client behavior; server validation was not exercised.

## Reportá una norma

[Official form](https://www.argentina.gob.ar/formularios/reportar-normativa), form ID `webform-client-form-450583`.

| Field | Requirement and observed constraint |
| --- | --- |
| Apellido | Required; 128 characters |
| Nombre | Required; 128 characters |
| Correo electrónico | Required; email input |
| ¿Querés publicar tu nombre junto con la propuesta? | Required; Sí / No; the person decides |
| ¿Nos escribís en nombre de una empresa u organización? | Required; Sí / No |
| Razón social | Required and visible only for organization = Sí; 128 characters |
| CUIT (sólo números) | Required and visible only for organization = Sí |
| DNI (sólo números) | Required and visible only for organization = No |
| Carácter | Required; Nacional / Provincial / Municipal |
| Provincia | Required and visible for Provincial or Municipal; dynamically populated province selector |
| Municipio | Required and visible only for Municipal; 128 characters |
| Tipo | Required; options below |
| Número | Required; 128 characters |
| Año | Optional for Ley; required for all other types |
| Organismo que dictó la norma | Required and visible only for Resolución, Resolución conjunta, Disposición, or Circular; 128 characters |
| Título | Required; 128 characters |
| Desarrollo | Required textarea; no client `maxlength` or published length limit observed |
| ¿Cuál es el cambio propuesto? | Optional; Derogarla / Modificarla |
| Propuesta de solución | Optional textarea; remains visible for both alternatives; no client `maxlength` or published length limit observed |
| Adjuntar información complementaria | Optional; files smaller than 2 MB: jpg, jpeg, png, pdf, doc, docx, odt, xls, xlsx |

The eleven **Tipo** options are Ley; Decreto; Decreto de necesidad y urgencia; Decreto/Ley; Resolución; Resolución conjunta; Disposición; Decisión Administrativa; Ordenanza; Circular; Comunicación.

The Desarrollo field sits under a heading asking why the regulation obstructs economic activity. The prompt therefore prepares a specific account of the activity, legal requirement, obstacle, and evidence, followed by a distinct proposed solution. It recommends completing the two optional solution fields but does not call them required. Working on one regulation per draft is editorial guidance based on the single regulation input group.

Verification exercised both organization answers, all three jurisdictions, all eleven types, and both change alternatives. Browser-visible changes also matched the form's public Drupal conditional configuration. In particular, Comunicación does **not** display the issuer field, and Ley makes Año optional. Hidden anti-spam controls are excluded from the prompt.

## IGJ consultation

[Official form](https://www.argentina.gob.ar/formularios/consulta-publica-modificacion-de-la-rg-igj-152024) · [Official call and deadline](https://www.argentina.gob.ar/justicia/igj/consulta-publica).

The call concerns Resolución General IGJ 15/2024, with a recorded extension to September 28, 2026. The prompt instructs the assistant to recheck the active call and deadline before recommending submission.

| Field | Requirement and observed constraint |
| --- | --- |
| Nombre y apellido / Denominación (en caso de ser persona jurídica) | Required; 128 characters |
| Correo electrónico | Required; email input |
| Carácter en que se presenta | Required; eight options below |
| Seleccioná la opción que corresponda según la temática/aspecto sobre la que enviarás la propuesta | Required; Sociedades comerciales / Entidades civiles / Otra |
| Adjuntá documentación | Required according to its label; files smaller than 100 MB: pdf, doc, docx |

The eight **Carácter en que se presenta** options are Particular interesado (persona humana); Profesional; Representante de consejo profesional; Institución académica; Sociedad inscripta en IGJ; Entidad civil inscripta en IGJ; Cámaras; Otro.

All eight roles and all three topics were selected during review. None exposed additional fields. There is no proposal textarea: the substantive proposal must be prepared as an attachment. The upload widget's native file input has `required=false`, while the enclosing form label marks the document required; the prompt follows the visible requirement.

The form introduction asks concrete proposals to identify the affected articles and specifies one form per topic. It does not publish a proposal template, word limit, or page limit. The prompt's six-part document structure and proposed wording are clearly labeled as drafting guidance, not official requirements. Multiple topics get separate drafts.

The consent declaration is accompanying text describing the use of contributions and personal-data treatment. No separate consent checkbox was present. The prompt asks the visitor to read and decide before submitting; it does not invent an additional form question.

## Prompt handoff

Both prompts start with the person's actual problem, use available relevant memory after hearing it, confirm facts before inclusion, and separate copy-ready content from unresolved questions and personal data. Mandatory legal identifiers are never guessed. The general prompt produces individual form answers; the IGJ prompt produces form metadata plus an attachable document.

`scripts/build_prompts.py` combines the common instructions with each form-specific section. After changes, regenerate both `data/participation-prompts.json` and `index.single.html`. The six provider links, previews, and copy controls must carry the exact generated channel prompt. Provider login and prefill behavior remain external dependencies; no signed-in AI conversations were sent during verification.
