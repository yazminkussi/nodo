# Workflow de CI (pendiente de agregar)

El archivo `.github/workflows/ci.yml` no se pudo subir por `git push` porque el
token de GitHub de la máquina no tiene el scope `workflow`.

## Opción A — agregarlo desde la web de GitHub

1. En el repo → **Add file → Create new file**.
2. Nombre: `.github/workflows/ci.yml`
3. Pegá el contenido de abajo y commiteá.

## Opción B — habilitar el scope y subirlo por git

```bash
gh auth refresh -h github.com -s workflow
```

Confirmá en el navegador, después avisá y se sube desde acá.

---

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verificar:
    name: Lint · Formato · Build
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

      - name: Build
        run: npm run build
```
