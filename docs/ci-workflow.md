# Workflow de CI

El archivo vive en `.github/workflows/ci.yml` en GitHub. No se puede modificar por
`git push` desde acá porque el token de la máquina no tiene el scope `workflow`;
se edita desde la web de GitHub (**el repo → `.github/workflows/ci.yml` → lápiz de
editar**) o habilitando el scope con `gh auth refresh -h github.com -s workflow`.

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
      - name: Formato (Prettier)
        run: npm run format:check
      - name: Tests
        run: npm test
      - name: Build
        run: npm run build
```
