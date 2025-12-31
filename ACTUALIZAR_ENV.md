# 🔐 Actualizar .env para PostgreSQL

## Opción 1: Usar Connection String Completo

Edita tu archivo `.env` y reemplaza `[YOUR-PASSWORD]` con tu contraseña real:

```env
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA_AQUI@db.xxxxx.supabase.co:5432/postgres
```

## Opción 2: Usar Componentes Individuales (Recomendado)

Agrega estas líneas a tu `.env`:

```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu-contraseña-aqui
```

## 🔑 Dónde encontrar tu contraseña

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a: **Settings → Database**
3. Busca la sección **Connection string** o **Database password**
4. Si no la recuerdas, puedes resetearla desde ahí

## ⚠️ Importante

- La contraseña es diferente a tu Service Role Key
- Es la contraseña del usuario `postgres` de la base de datos
- Si la resetas, actualiza también cualquier otra herramienta que la use


