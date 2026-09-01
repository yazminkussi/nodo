# Cómo contribuir a NODO

Guía breve de trabajo para el proyecto.

## Requisitos

- Node.js ≥ 20 y npm.
- Una cuenta de GitHub con acceso al repo.

## Puesta en marcha

```bash
npm install
npm run dev
```

Para probar la integración con Supabase, copiá `.env.example` a `.env.local` (ver el README).

## Flujo de trabajo

1. Partí siempre desde `main` actualizado.
2. Creá una rama por tarea, con prefijo de fase o tipo:
   - `fase-1/esquema-supabase`
   - `fix/reserva-slot-solapado`
   - `docs/actualizar-readme`
3. Commits chicos y descriptivos. Se sigue [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: inscripción a talleres desde el portal del socio`
   - `fix: evita doble registro de acceso por Realtime`
   - `docs: agrega hoja de ruta`
   - `chore: configura Prettier y CI`
4. Antes de abrir el PR:
   ```bash
   npm run check   # lint + typecheck + formato + tests
   npm run build
   ```
5. Abrí el Pull Request contra `main`. La CI corre lint + formato + build. No se mergea con la CI en rojo.

## Estilo de código

- **Formato:** Prettier (`npm run format`). La configuración está en `.prettierrc.json`.
- **Linting:** ESLint (`.eslintrc.cjs`). Sin warnings (`--max-warnings 0`).
- **Idioma:** el dominio del producto está en español (variables, componentes, comentarios). Se mantiene esa convención.
- **Componentes:** un componente por archivo, PascalCase. Hooks en `src/hooks`, lógica de datos en `src/lib`.
- **TypeScript:** la migración es incremental (Fase 4). Los archivos nuevos en `src/lib` y `src/store` se escriben en `.ts`/`.tsx` cuando sea posible.

## Seguridad

- Nunca commitees `.env`, `.env.local`, claves `service_role` ni contraseñas.
- Los binarios de diseño (`.ai`) van en `brand/` y no se versionan.
- Si encontrás un problema de seguridad, no abras un issue público: contactá directamente a la autora.
