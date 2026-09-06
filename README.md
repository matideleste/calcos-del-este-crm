# Calcos del Este CRM

App privada para administración personal y de Calcos del Este.

## 1. Supabase
1. Crear un proyecto en Supabase.
2. Ir a SQL Editor y ejecutar `supabase.sql`.
3. En Authentication > Users crear el primer usuario con email y contraseña.
4. Copiar Project URL y anon public key.

## 2. Configuración local
```bash
npm install
cp .env.example .env
```
Editar `.env` con tus datos:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Ejecutar:
```bash
npm run dev
```

## 3. Probar build
```bash
npm run build
```

## 4. Netlify
1. Subir esta carpeta a GitHub.
2. En Netlify: Add new site > Import from Git.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. En Site configuration > Environment variables agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy.

## Seguridad
- Login real con Supabase Auth.
- RLS activado en las tablas.
- Cada usuario solo puede ver sus propios datos.
- No guardar claves privadas dentro del repositorio.
