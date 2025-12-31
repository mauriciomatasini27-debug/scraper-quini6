# 🔐 Configurar Variables de Entorno

Guía rápida para configurar las variables de entorno necesarias.

## 📝 Crear archivo .env

1. Copia el archivo de ejemplo:
   ```bash
   # Windows PowerShell
   Copy-Item env.example.txt .env
   
   # O Linux/Mac
   cp env.example.txt .env
   ```

2. Edita el archivo `.env` y completa con tus valores:

### Para usar API REST de Supabase:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key-aqui
```

### Para usar PostgreSQL Directo:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### O componentes individuales:
```env
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu-password-aqui
```

## ⚠️ IMPORTANTE

- ✅ El archivo `.env` está en `.gitignore` y NO se subirá a Git
- ✅ NUNCA compartas tus tokens o contraseñas
- ✅ El token que tienes es tu Service Role Key - guárdalo de forma segura

## 🚀 Usar las variables

Una vez configurado el `.env`, los scripts los leerán automáticamente.

Para verificar que se leen correctamente:
```bash
# Windows PowerShell
Get-Content .env

# Linux/Mac
cat .env
```

