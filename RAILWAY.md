# DalisApp en Railway

Este proyecto esta preparado para desplegarse como 2 servicios dentro del mismo proyecto de Railway:

1. `dalisapp-web`
   Usa `Dockerfile.web`
   Sirve el frontend compilado con Vite

2. `dalisapp-pocketbase`
   Usa `Dockerfile.pocketbase`
   Ejecuta PocketBase con persistencia usando un Volume montado en `/pb/pb_data`

## Variables de entorno

### Local

Archivo `.env`:

```env
VITE_APP_URL=http://127.0.0.1:5173
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### Railway - servicio web

Define estas variables en el servicio del frontend:

```env
VITE_APP_URL=https://TU-FRONTEND.up.railway.app
VITE_POCKETBASE_URL=https://TU-POCKETBASE.up.railway.app
```

## PocketBase en Railway

### Dockerfile

Usa `Dockerfile.pocketbase`.

### Volume

Monta un Volume en:

```text
/pb/pb_data
```

Esa carpeta guarda la base SQLite, auth, archivos y configuracion de PocketBase.

### Primer acceso

Cuando el servicio este arriba, entra a:

```text
https://TU-POCKETBASE.up.railway.app/_/
```

Y crea tu superuser.

## Frontend en Railway

### Dockerfile

Usa `Dockerfile.web`.

Railway construira la app con `pnpm build` y servira `dist/`.

## Orden recomendado de despliegue

1. Desplegar `dalisapp-pocketbase`
2. Crear el Volume
3. Abrir `/_/` y crear el superuser
4. Crear `users` y `extra_hours`
5. Copiar la URL publica de PocketBase
6. Configurar `VITE_POCKETBASE_URL` en `dalisapp-web`
7. Desplegar `dalisapp-web`
