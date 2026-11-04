# neuroquest-tech
# NeuroQuest Tech — Undercity Edition

**Organiza tus misiones. Avanza paso a paso.**

NeuroQuest Tech es una aplicación web personal de productividad con estética **cyberpunk y manga**. Convierte objetivos en misiones y tareas pequeñas, muestra el progreso conseguido y ayuda a elegir qué hacer hoy sin sobrecargar la planificación.

## Funcionalidades

- **Inicio:** resumen de actividad y **Plan de hoy**, con una selección de hasta 3 pasos y 45 minutos en total.
- **Misiones:** creación y seguimiento de objetivos, fechas límite, dedicación diaria y pasos con duración estimada.
- **Calendario:** consulta de las misiones y su planificación.
- **Enfoque:** temporizador de concentración de 25 minutos.
- **Progreso:** métricas globales, pasos completados y pendientes, tiempo restante y evaluación de viabilidad de cada misión.
- **Ajustes:** opciones visuales y de accesibilidad, además de exportación e importación de copias de seguridad.
- **Avatares:** Rebelde, Estratega y Explorador.
- **Gamificación:** 25 XP por paso completado y progresión de nivel cada 100 XP.

## Diseño y accesibilidad

La interfaz incluye opciones de texto grande, alto contraste, lectura facilitada, modo concentración y representación visual del tiempo. Está diseñada para funcionar en escritorio y pantallas pequeñas.

Estas opciones no constituyen por sí solas una certificación de conformidad con WCAG.

## Tecnologías

- HTML
- CSS
- JavaScript sin frameworks
- Imágenes y recursos locales en `assets/`
- `localStorage` del navegador para guardar el estado

No requiere servidor ni instalación de dependencias para su uso local.

## Cómo utilizarla

1. Descarga los archivos del repositorio manteniendo su estructura de carpetas.
2. Abre `index.html` en un navegador moderno.
3. Elige un avatar y crea tu primera misión.
4. Divide la misión en pasos, asigna minutos estimados y marca los que completes.
5. Consulta **Inicio** para ver el Plan de hoy y **Progreso** para revisar tu avance.

## Estructura del proyecto

```text
neuroquest-redesign/
├── index.html
├── style.css
├── script.js
└── assets/
    └── ... recursos gráficos
```

## Datos y copias de seguridad

Los datos se guardan **localmente en el navegador** mediante `localStorage` (clave `neuroquest_v4`). No se sincronizan automáticamente con GitHub ni entre dispositivos.

Desde **Ajustes** puedes exportar una copia en formato JSON e importarla posteriormente. **Importar una copia sustituye los datos actuales** después de la confirmación correspondiente; conviene exportar una copia antes de hacerlo.

El temporizador de enfoque no conserva su cuenta atrás entre sesiones.

## Estado del proyecto

Versión personal funcional. Se han completado las funciones principales y una revisión técnica de navegación, adaptación a distintos tamaños de pantalla y estados de la aplicación. La revisión visual exhaustiva y la evaluación formal de accesibilidad no se han realizado.

## Privacidad

El repositorio contiene el código de la aplicación, no los datos almacenados en el navegador. Antes de compartir archivos o copias de seguridad, comprueba que no contienen información personal.

---

*Proyecto personal: NeuroQuest Tech — Undercity Edition.*
