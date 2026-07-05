# Portfolio — GitHub Pages

Dynamic portfolio with admin dashboard for managing projects, screenshots, store links, and contact messages.

## Quick Links

| Page | URL |
|------|-----|
| Homepage | `https://itsmountain74.github.io/ItsMountain.github.io/` |
| Admin Dashboard | `https://itsmountain74.github.io/ItsMountain.github.io/admin/` |
| Admin (alt) | `https://itsmountain74.github.io/ItsMountain.github.io/admin.html` |
| Project Details | `/portfolio-details.html?id={project-id}` |

See **[ROUTES.md](ROUTES.md)** for full route documentation.

## Setup

1. Push this repo to GitHub and enable **GitHub Pages** (Settings → Pages → Deploy from branch)
2. Edit `assets/js/config.js`:
   - Set `basePath` to `"/your-repo-name"` if using a project site, or `""` for `username.github.io`
   - Change `adminPassword` from the default `admin123`
3. Open `/admin/` to add projects
4. Export JSON from admin and commit `data/projects.json` to publish changes

## Admin Default Login

- **URL:** `/admin/`
- **Password:** `admin123` (change in `config.js`)

## Tech

- Static HTML + Bootstrap (GitHub Pages compatible)
- JSON data files (`data/projects.json`, `data/messages.json`)
- No PHP or server required
