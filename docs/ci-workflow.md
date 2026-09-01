# Workflows de CI

Los archivos viven en `.github/workflows/` en GitHub. No se pueden modificar por
`git push` desde acá porque el token de la máquina no tiene el scope `workflow`;
se editan desde la web de GitHub (**el repo → `.github/workflows/…` → lápiz de
editar**) o habilitando el scope con `gh auth refresh -h github.com -s workflow`.

Hay dos:

- **`ci.yml`** — lint, typecheck, formato, tests unitarios y build. Rápido.
- **`e2e.yml`** — tests de punta a punta con Playwright (modo demo). Más lento,
  corre en paralelo. Todavía no está en GitHub: su contenido está en
  `docs/workflows/e2e.yml` del repo. Creá el archivo `.github/workflows/e2e.yml`
  desde la web (**el repo → Add file → Create new file**) y pegá ese contenido.

## Contenido actual (con el paso de tests)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verificar:
    name: Lint · Formato · Tests · Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Configurar Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Instalar dependencias
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npm run typecheck
      - name: Formato (Prettier)
        run: npm run format:check
      - name: Tests
        run: npm test
      - name: Build
        run: npm run build
```
