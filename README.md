LadyCakes - App sencilla para administrar un emprendimiento de repostería

Descripción
-----------
Pequeña aplicación web estática pensada para gestionar notas, lista de cosas necesarias, tareas, recetas y recordatorios. Diseñada con colores pasteles y un look "cute".

Archivos
-------
- index.html: interfaz principal
- style.css: estilos
- app.js: lógica y persistencia en localStorage

Cómo usar
--------
1. Abrir `index.html` en el navegador.
2. En la barra lateral puedes navegar entre secciones: Inicio, Cosas necesarias, Anotaciones, Tareas, Recetas, Recordatorios y Ajustes.
3. En "Editar emprendimiento" puedes cambiar el nombre, logo y datos de contacto.
4. Los datos se guardan en el navegador (localStorage). Puedes exportar/importar en JSON desde la cabecera.

Limitaciones
-----------
- Es una aplicación local (sin servidor). Los datos quedan en tu navegador.
- Las notificaciones usan la API de Notificaciones del navegador; el navegador puede pedir permiso.

Siguientes pasos sugeridos
-------------------------
- Añadir autenticación y sincronización en la nube (Firebase o backend propio).
- Añadir categorías y filtros en la lista de "cosas necesarias".
- Generar presupuestos y reportes (p. ej. costos totales por receta).
- Integrar calendario visual para recordatorios.

Licencia
-------
Código bajo MIT (libre para modificar).
