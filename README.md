# 📋 Tablero Kanban - Dashboard de Gestión de Tareas

Una aplicación web interactiva de gestión de proyectos estilo Kanban. Permite organizar tareas por estados, filtrarlas en tiempo real y gestionarlas de forma intuitiva mediante arrastrar y soltar (*drag and drop*).

<img width="1363" height="602" alt="doingnetask" src="https://github.com/user-attachments/assets/4f912528-d16f-43a3-bde6-c12161f51527" />


---

## ✨ Características Principales

* **Interfaz Dinámica**: Columnas organizadas por estado (*Por hacer*, *En progreso*, *Completado*).
* **Drag and Drop**: Arrastra y suelta tareas fácilmente entre columnas.
* **Modal de Detalles**: Creación y edición de información detallada para cada tarea.
* **Filtros en Tiempo Real**: Búsqueda rápida de tareas por título o etiqueta.
* **Persistencia de Datos**: Conexión con backend de prueba para conservar el estado de las tareas.
* **Diseño Responsive**: Adaptado para una navegación fluida en dispositivos móviles y de escritorio.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5** & **CSS3** (Flexbox, CSS Grid)
* **JavaScript Vanilla** (ES6+)
* **[SortableJS](https://sortablejs.github.io/Sortable/)** - Librería para la funcionalidad Drag and Drop
* **json-server** - Mock API REST para simular persistencia de datos
* **pnpm** - Gestor de paquetes rápido y eficiente

---

## 🚀 Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### Requisitos Previos

Asegúrate de tener instalado [Node.js](https://nodejs.org/) y [pnpm](https://pnpm.io/):

```bash
npm install -g pnpm
