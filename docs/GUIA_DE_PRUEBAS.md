# Guía de Pruebas: Nuevas Funcionalidades

## 🧪 Cómo Probar las Mejoras

### ⚙️ Preparación

1. **Iniciar el servidor de desarrollo:**

```bash
npm run dev
```

2. **Abrir el navegador:**

```
http://localhost:3000
```

3. **Iniciar sesión** en la aplicación

---

## 📋 Test 1: Mensaje Final en Creación de Proyecto

### Objetivo

Verificar que el nuevo paso de mensaje final funciona correctamente.

### Pasos

1. **Navegar al Dashboard**

   - URL: `/dashboard`
   - Clic en botón **"+ Nuevo Proyecto"**

2. **Paso 1: Información**

   - Nombre: `"Proyecto de Prueba - Mensaje Final"`
   - Número de productos: `4`
   - Mensaje final: (dejar vacío por ahora)
   - Clic en **"Siguiente →"**

3. **Paso 2: Archivos**

   - Subir 4 archivos ZIP con imágenes
   - Clic en **"Siguiente →"**

4. **Paso 3: Vistas**

   - Clic en **"+ Agregar Vista"**
   - Marcar algunos checkboxes de productos
   - ✅ **IMPORTANTE:** Verificar que el botón diga **"Siguiente →"** (no "Crear Proyecto")
   - Clic en **"Siguiente →"**

5. **Paso 4: Mensaje Final** ⬅️ NUEVO

   - Verificar que aparece la página de mensaje final
   - Escribir en el textarea:

     ```
     ¡Gracias por revisar nuestro proyecto!

     Contáctanos para más información:
     📧 info@ejemplo.com
     📞 555-1234
     ```

   - ✅ Verificar que aparece **Vista Previa** debajo
   - ✅ Verificar que la vista previa muestra el texto formateado
   - Clic en **"Crear Proyecto"**

6. **Resultado Esperado**
   - ✅ Proyecto creado exitosamente
   - ✅ Redirección al Dashboard
   - ✅ Mensaje final guardado en la base de datos

### Verificación en Base de Datos

```sql
SELECT final_message FROM projects
WHERE name = 'Proyecto de Prueba - Mensaje Final';
```

**Esperado:** El mensaje debe estar guardado.

---

## 👁️ Test 2: Editar Vistas de Proyecto

### Objetivo

Verificar que se pueden agregar, modificar y eliminar vistas desde la edición.

### Pasos

1. **Ir al Dashboard**

   - Seleccionar un proyecto existente
   - Clic en botón **✏️ Editar**

2. **Verificar Pestañas**

   - ✅ Debe haber 3 pestañas: **Información**, **Vistas**, **Productos**
   - Clic en pestaña **"👁️ Vistas"**

3. **Ver Vistas Existentes**

   - ✅ Debe mostrar tabla con vistas
   - ✅ Columnas: Vista, Producto 1, Producto 2, ..., Acciones
   - ✅ Checkboxes deben reflejar asignaciones actuales

4. **Agregar Nueva Vista**

   - Clic en **"+ Agregar Vista"**
   - ✅ Aparece nueva fila en la tabla
   - ✅ Vista creada con nombre "Vista X" (donde X = número)

5. **Asignar Productos a la Nueva Vista**

   - Marcar checkbox de Producto 1: ☑️
   - Marcar checkbox de Producto 3: ☑️
   - ✅ Checkboxes deben actualizarse instantáneamente
   - ✅ No debe recargar la página

6. **Modificar Vista Existente**

   - En Vista 1, desmarcar un producto
   - Marcar otro producto diferente
   - ✅ Cambios deben aplicarse al hacer clic

7. **Eliminar Vista**

   - Clic en 🗑️ de Vista 2
   - ✅ Debe aparecer confirmación: "¿Estás seguro de eliminar esta vista?"
   - Clic en **"Aceptar"**
   - ✅ Vista debe desaparecer de la tabla
   - ✅ Mensaje: "Vista eliminada correctamente"

8. **Verificar Persistencia**
   - Recargar la página (F5)
   - Volver a pestaña "Vistas"
   - ✅ Cambios deben seguir ahí

---

## 📦 Test 3: Visualizar Productos con KeyShotXRViewer

### Objetivo

Verificar que los productos se visualizan correctamente en 3D.

### Pasos

1. **Editar Proyecto con Productos**

   - Dashboard → Editar proyecto que tenga productos con imágenes subidas
   - Clic en pestaña **"📦 Productos"**

2. **Verificar Selector de Productos**

   - ✅ Debe mostrar botones para cada producto
   - ✅ Formato: `[Producto 1] [Producto 2] [Producto 3]`
   - ✅ Primer producto debe estar seleccionado (color oscuro)

3. **Verificar Visor 3D**

   - ✅ Debe mostrarse KeyShotXRViewer con tamaño 800×600
   - ✅ Debe cargar el modelo 3D del primer producto
   - ✅ Fondo negro o del color configurado

4. **Interactuar con el Visor**

   - Arrastrar el mouse sobre el visor
   - ✅ Modelo debe rotar 360°
   - Hacer scroll sobre el visor
   - ✅ Debe hacer zoom in/out (si está habilitado)

5. **Cambiar de Producto**

   - Clic en botón **"Producto 2"**
   - ✅ Botón debe cambiar de color (seleccionado)
   - ✅ Visor debe cargar el modelo del Producto 2
   - ✅ Transición debe ser fluida

6. **Producto Sin Imágenes**

   - Si hay producto sin `path`:
   - ✅ Debe mostrar mensaje: "Este producto aún no tiene imágenes cargadas"
   - ✅ No debe romper la página

7. **Información del Producto**
   - ✅ Debe mostrar nombre del producto seleccionado
   - ✅ Si tiene descripción, debe mostrarse debajo del visor

---

## 📝 Test 4: Editar Mensaje Final de Proyecto Existente

### Objetivo

Verificar que se puede editar el mensaje final de un proyecto ya creado.

### Pasos

1. **Editar Proyecto**

   - Dashboard → Editar proyecto
   - Pestaña **"📋 Información"** (debe estar activa por defecto)

2. **Verificar Campo de Mensaje Final**

   - ✅ Debe haber textarea con label "Mensaje Final (Opcional)"
   - ✅ Si el proyecto tiene mensaje, debe mostrarse
   - ✅ Si no tiene, debe estar vacío

3. **Modificar Mensaje**

   - Cambiar el texto a:
     ```
     Mensaje actualizado el [fecha actual]
     Nuevas ofertas disponibles!
     ```
   - Clic en **"Guardar Cambios"**
   - ✅ Alerta: "Proyecto actualizado correctamente"

4. **Verificar Actualización**

   - Recargar la página
   - Volver a editar el proyecto
   - ✅ Mensaje debe reflejar los cambios

5. **Borrar Mensaje**
   - Borrar todo el texto del textarea (dejar vacío)
   - Guardar cambios
   - ✅ Mensaje debe ser removido (NULL en DB)

---

## 🎨 Test 5: Interfaz y Navegación

### Objetivo

Verificar que la interfaz es intuitiva y funciona correctamente.

### Pasos

1. **Indicador de Progreso (Creación)**

   - Ir a Crear Proyecto
   - ✅ Debe haber 4 círculos numerados: 1, 2, 3, 4
   - ✅ Paso activo debe tener color oscuro
   - ✅ Pasos completados deben tener ✓
   - Navegar por todos los pasos
   - ✅ Indicador debe actualizarse correctamente

2. **Pestañas (Edición)**

   - Ir a Editar Proyecto
   - Clic en pestaña "Vistas"
   - ✅ Pestaña debe tener borde inferior grueso (activa)
   - ✅ Otras pestañas deben ser grises
   - ✅ Contenido debe cambiar según pestaña

3. **Botones de Navegación**

   - En cada paso/pestaña:
   - ✅ Botón "← Anterior" o "← Cancelar" debe estar a la izquierda
   - ✅ Botón "Siguiente →" o "Guardar" debe estar a la derecha
   - ✅ Botones deben ser responsivos al hover

4. **Estados de Carga**
   - Al crear proyecto:
   - ✅ Modal de carga debe aparecer durante subida
   - ✅ Barra de progreso debe actualizarse
   - Al guardar cambios:
   - ✅ Botón debe mostrar "Guardando..."
   - ✅ Botones deben deshabilitarse

---

## 🔍 Test 6: Casos Extremos

### Test 6.1: Proyecto Sin Productos

**Pasos:**

1. Editar proyecto que no tenga productos creados
2. Ir a pestaña "Productos"

**Esperado:**

- ✅ Mensaje: "No hay productos en este proyecto"
- ✅ No debe romper la página
- ✅ No debe mostrar visor 3D

### Test 6.2: Proyecto Sin Vistas

**Pasos:**

1. Editar proyecto que no tenga vistas configuradas
2. Ir a pestaña "Vistas"

**Esperado:**

- ✅ Mensaje: "No hay vistas configuradas"
- ✅ Botón "+ Agregar Vista" debe funcionar
- ✅ Al agregar, tabla debe aparecer

### Test 6.3: Mensaje Final Muy Largo

**Pasos:**

1. Crear proyecto
2. En paso "Mensaje Final", escribir 1000+ caracteres

**Esperado:**

- ✅ Textarea debe permitir texto largo
- ✅ Vista previa debe mostrar todo el texto
- ✅ Debe guardarse completamente

### Test 6.4: Caracteres Especiales

**Pasos:**

1. Escribir mensaje con emojis y símbolos:
   ```
   ¡Gracias! 🎉
   Contáctanos: info@test.com
   Precio: $50 - €45 - £40
   ```

**Esperado:**

- ✅ Debe guardarse correctamente
- ✅ Emojis deben mostrarse en preview
- ✅ Símbolos especiales deben mantenerse

---

## 📊 Checklist de Verificación

### Funcionalidad

- [ ] Paso de mensaje final aparece
- [ ] Vista previa funciona
- [ ] Mensaje se guarda en DB
- [ ] Mensaje es editable después
- [ ] Pestañas de edición cambian contenido
- [ ] Tabla de vistas se muestra
- [ ] Agregar vista funciona
- [ ] Eliminar vista funciona
- [ ] Checkboxes asignan/desasignan productos
- [ ] KeyShotXRViewer carga modelos
- [ ] Selector de productos funciona
- [ ] Navegación entre productos funciona

### UX/UI

- [ ] Indicador de progreso actualiza
- [ ] Pestañas tienen estilo activo/inactivo
- [ ] Botones están bien posicionados
- [ ] Estados de carga se muestran
- [ ] Mensajes de error son claros
- [ ] Confirmaciones aparecen antes de eliminar
- [ ] Responsive en diferentes tamaños

### Performance

- [ ] No hay errores en consola
- [ ] Cambios de pestaña son instantáneos
- [ ] Visor 3D carga sin demora excesiva
- [ ] Checkboxes responden inmediatamente
- [ ] No hay fugas de memoria

---

## 🐛 Reporte de Errores

Si encuentras algún error, documenta:

1. **Pasos para reproducir**
2. **Resultado esperado**
3. **Resultado actual**
4. **Errores en consola** (F12 → Console)
5. **Captura de pantalla** (si aplica)

---

## ✅ Criterios de Aceptación

Para considerar las mejoras como **completadas y funcionales**:

1. ✅ Todos los tests 1-6 pasan sin errores
2. ✅ No hay errores de TypeScript
3. ✅ No hay errores en consola del navegador
4. ✅ No hay warnings de React
5. ✅ Interfaz es intuitiva y responsiva
6. ✅ Datos se persisten correctamente en DB
7. ✅ KeyShotXRViewer carga y es interactivo

---

## 🎓 Notas Finales

- **Tiempo estimado de pruebas:** 30-45 minutos
- **Navegadores recomendados:** Chrome, Firefox, Edge
- **Resoluciones a probar:** Desktop (1920×1080), Tablet (768×1024), Mobile (375×667)

**¡Buena suerte con las pruebas!** 🚀
