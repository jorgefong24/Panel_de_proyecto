# 🔧 Configuración de Firebase - Panel de Proyectos

## ⏰ ⚠️ ATENCIÓN: Reglas temporal (30 días)

Firebase te dio reglas de **test mode que expiran el 21 de marzo de 2026** (30 días desde ahora).

**Esto significa que después de esa fecha, tu aplicación NO podrá acceder a la base de datos a menos que actualices las reglas.**

### AHORA DEBES:
1. ✅ Copiar y pegar las reglas que te proporcionó Firebase en la consola
2. 📅 Antes del 21/03/2026: Actualizar a reglas permanentes (sigue las instrucciones abajo)

---

Tu aplicación ya tiene la configuración de Firebase con:
- **Project ID**: `panel-de-proyectos-c1b25`
- **API Key**: Configurada en `index.html`
- **Auth Domain**: `panel-de-proyectos-c1b25.firebaseapp.com`

## ⚠️ Paso 2: IMPORTANTE - Configurar Firestore Database

Para que la sincronización funcione, debes crear una base de datos Firestore. Sigue estos pasos:

### En la Consola de Firebase (https://console.firebase.google.com/)

1. **Abre tu proyecto** `panel-de-proyectos-c1b25`

2. **Ve a Firestore Database**
   - En el menú izquierdo, busca "Firestore Database"
   - Haz clic en "Create Database"

3. **Configuración de la base de datos**
   - **Ubicación**: Usa la predeterminada o selecciona la más cercana a ti
   - **Modo de seguridad**: Selecciona "Start in test mode"
   - Haz clic en "Enable"

4. **Configurar las reglas de Firestore**
   - Una vez creada la BD, ve a la pestaña "Rules"
   - **Elimina TODO el contenido actual**
   - Copia y pega EXACTAMENTE estas reglas que Firebase te proporcionó:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // This rule allows anyone with your Firestore database reference to view, edit,
    // and delete all data in your Firestore database. It is useful for getting
    // started, but it is configured to expire after 30 days because it
    // leaves your app open to attackers. At that time, all client
    // requests to your Firestore database will be denied.
    //
    // Make sure to write security rules for your app before that time, or else
    // all client requests to your Firestore database will be denied until you Update
    // your rules
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 3, 21);
    }
  }
}
```

5. **Publicar las reglas**
   - Haz clic en "Publish"
   
⏰ **IMPORTANTE**: Estas reglas expiran el **21 de marzo de 2026** (30 días).
Después de esa fecha, deberás actualizar las reglas o el acceso se bloqueará.

## 🚀 Paso 3: Verificar que funciona

1. **Abre tu aplicación** en el navegador
2. **Abre la Consola** (F12 > Pestaña Console)
3. Deberías ver el mensaje:
   ```
   ✅ Firebase inicializado correctamente con Firestore
   ```

4. **Crea un nuevo proyecto** en la aplicación
5. **Ve a Firebase Console > Firestore Database > Datos**
6. Deberías ver una colección llamada `proyectos` con un documento `tablero_principal`

## � Reglas de seguridad para Producción

⚠️ **CRÍTICO**: Las reglas de test mode **expiran el 21 de marzo de 2026** (30 días). Después de esa fecha, TODOS los accesos serán bloqueados.

### Antes de que expire (recomendado hacerlo ahora):

En Firebase Console → Firestore Database → Rules, reemplaza con:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Regla de lectura/escritura abierta durante desarrollo
    // DESPUÉS de 30 días, DEBES cambiar esto a un sistema de autenticación
    match /proyectos/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Para Producción Real (con usuarios autenticados):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /proyectos/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Luego configura **Authentication** en Firebase Console.

### Opción Intermedia (Recomendada):

Si no quieres implementar autenticación ahora, simplemente actualiza las reglas antes del 21 de marzo quitando la fecha de expiración:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## ❓ Solución de Problemas

### "Firebase no está listo"
- Verifica que Firestore está habilitado en tu proyecto
- Abre Firestore Database en la consola y confirma que existe

### Los datos no se sincronizan
- Verifica las reglas de Firestore (máximo se deben ver como arriba)
- Abre la consola del navegador para ver errores
- Verifica que la aplicación está en `localhost` o el dominio correcto

### Error de CORS
- Las reglas de Firestore están correctamente configuradas
- Si aún tienes problemas, intenta desde una URL HTTPS (no HTTP)

## ✨ Características después de configurar Firestore

- ✅ Sincronización automática entre dispositivos
- ✅ Respaldo en la nube
- ✅ localStorage como fallback quando Firestore no está disponible
- ✅ Historial de cambios preservado
- ✅ Datos persistentes incluso entre sesiones

