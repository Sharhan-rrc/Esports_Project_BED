# Deployment Documentation

## Local Development
1. Install dependencies
```bash
npm install
```
2. Set up `.env`
3. Run the app
```bash
npm run dev
```

## Generate Documentation
Run the docs command on the development branch:
```bash
npm run docs
```

This generates:
- `openapi.json`
- `docs/index.html`

## Documentation Branch Workflow
1. Switch to `documentation`
2. Copy generated docs files from `development`
3. Commit only documentation files
4. Push the branch to GitHub

Example:
```bash
git checkout documentation
git checkout development -- docs/index.html openapi.json
git add docs/index.html openapi.json
git commit -m "docs: update generated documentation"
git push origin documentation
```

## GitHub Pages
1. Go to repository Settings
2. Open Pages
3. Choose Deploy from a branch
4. Select `documentation`
5. Select `/docs`
6. Save changes

## Notes
- Do not merge the documentation branch back into `development` or `main`.
- Keep source `.md` files in the repository so they are visible in `main`.
- Keep generated HTML docs in the `documentation` branch for publishing.
