# Tablero de Proyectos

Aplicación web para gestionar proyectos (tablero tipo Kanban) con persistencia local y opcional en Firebase Firestore.

## Estructura del proyecto

```
Programas/
├── index.html          # Punto de entrada: HTML + configuración Firebase
├── css/
│   └── main.css        # Estilos globales de la aplicación
├── js/
│   └── app.js          # Lógica principal: almacenamiento, tablero, editor, carrusel
├── models/             # Modelos de datos
│   ├── proyecto.js     # ProyectoModel (metadatos, dependencias)
│   └── tarea.js        # TareaModel (normalización, estado)
├── services/           # Servicios de dominio
│   ├── eventos.js      # EventBus y constantes de eventos
│   ├── workflow.js     # Máquina de estados (pendiente/proceso/terminado)
│   ├── progreso.js     # Cálculo de avance y retraso
│   └── validaciones.js # Riesgo de proyecto y validaciones
└── ui/
    └── render.js       # Utilidades de render (badges, alertas, escape HTML)
```

## Orden de carga de scripts

Los scripts se cargan en este orden (las dependencias usan `window.AppModels`, `window.AppServices`, `window.AppUI`):

1. `models/tarea.js`, `models/proyecto.js`
2. `services/eventos.js`, `services/workflow.js`, `services/progreso.js`, `services/validaciones.js`
3. `ui/render.js`
4. `js/app.js` (depende de todos los anteriores)

## Cómo ejecutar

Abre `index.html` en un navegador (o sirve la carpeta con un servidor local si lo prefieres). Para sincronización entre dispositivos, configura Firebase en el bloque de configuración dentro de `index.html`.
