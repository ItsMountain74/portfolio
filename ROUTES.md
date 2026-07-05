# Portfolio Routes & Admin Guide

This portfolio is built for **GitHub Pages** (static hosting). All project and message data is stored in JSON files and managed through the admin dashboard.

---

## Public Routes

| Route | Description |
|-------|-------------|
| `/` or `/index.html` | Main portfolio homepage |
| `/index.html#hero` | Hero section |
| `/index.html#about` | About section |
| `/index.html#resume` | Resume section |
| `/index.html#portfolio` | Dynamic portfolio grid (loaded from `data/projects.json`) |
| `/index.html#services` | Services section |
| `/index.html#contact` | Contact form |
| `/portfolio-details.html?id={project-id}` | Single project detail page with screenshots and download links |

### Project detail URL examples

```
https://yourusername.github.io/portfolio-details.html?id=mobile-task-app
https://yourusername.github.io/portfolio/portfolio-details.html?id=mobile-task-app
```

The `id` must match the `id` field in `data/projects.json`.

---

## Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/` or `/admin/index.html` | Admin dashboard (password protected) |

### Admin panels

| Panel | Purpose |
|-------|---------|
| **Overview** | Stats and quick start guide |
| **Projects** | List, edit, and delete projects |
| **Add Project** | Create or edit a project with screenshots and store links |
| **Messages** | View contact form submissions |
| **Data & Export** | Export/import JSON files for GitHub |

---

## Data Files

| File | Purpose |
|------|---------|
| `data/projects.json` | All portfolio projects (published on the live site) |
| `data/messages.json` | Contact form messages (committed to repo) |
| `assets/js/config.js` | Site config: base path, admin password, Formspree |

### Project JSON schema

```json
{
  "id": "unique-project-id",
  "title": "Project Name",
  "category": "app",
  "categoryLabel": "App",
  "shortDescription": "Brief tagline",
  "description": "Full project description",
  "thumbnail": "assets/img/portfolio/app-1.jpg",
  "screenshots": [
    "assets/img/portfolio/app-1.jpg",
    "assets/img/portfolio/app-2.jpg"
  ],
  "links": {
    "website": "https://example.com",
    "appStore": "https://apps.apple.com/app/...",
    "playStore": "https://play.google.com/store/apps/..."
  },
  "client": "Client name",
  "projectDate": "2024-06-15",
  "published": true
}
```

All link fields are optional — leave empty (`""`) if not applicable.

---

## GitHub Pages Setup

### User/organization site (`username.github.io` repo)

- Site URL: `https://username.github.io/`
- Set `basePath: ""` in `assets/js/config.js`

### Project site (`username.github.io/repo-name`)

- Site URL: `https://username.github.io/repo-name/`
- Set `basePath: "/repo-name"` in `assets/js/config.js`

---

## Workflow: Adding a Project

1. Go to `/admin/` and log in (default password: `admin123`)
2. Open **Add Project** and fill in the form
3. Upload screenshot images to `assets/img/portfolio/` in your repo
4. Reference image paths like `assets/img/portfolio/my-screenshot.jpg`
5. Add optional links: Website, App Store, Google Play
6. Save the project
7. Go to **Data & Export** → **Export projects.json**
8. Replace `data/projects.json` in your repo with the exported file
9. Commit and push to GitHub

---

## Workflow: Contact Messages

GitHub Pages cannot run PHP. The contact form uses JavaScript instead.

1. Visitor submits the contact form on the homepage
2. Message is saved in the browser (localStorage)
3. In admin, open **Messages** to view submissions
4. Export `messages.json` from **Data & Export**
5. Replace `data/messages.json` in your repo and push to GitHub

### Optional: Email notifications via Formspree

1. Create a free form at [formspree.io](https://formspree.io)
2. Copy your form endpoint URL
3. Set it in `assets/js/config.js`:

```javascript
formspreeEndpoint: "https://formspree.io/f/your-form-id"
```

Messages will still appear in the admin dashboard and optionally be emailed to you.

---

## Security Notes

- **Change the default admin password** in `assets/js/config.js` before going live
- Admin auth is client-side only (session storage) — suitable for a personal portfolio, not high-security apps
- Do not commit real secrets; Formspree endpoint URLs are safe to commit

---

## Local Development

Serve the site with any static file server:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open:

- Site: `http://localhost:8080/`
- Admin: `http://localhost:8080/admin/`

---

## File Structure (new files)

```
portfolio/
├── admin/
│   └── index.html          # Admin dashboard
├── assets/
│   ├── css/
│   │   └── admin.css       # Admin styles
│   └── js/
│       ├── config.js       # Site configuration
│       ├── data-store.js   # Data layer (JSON + localStorage)
│       ├── portfolio.js    # Dynamic portfolio grid
│       ├── project-details.js
│       ├── contact.js      # Contact form handler
│       └── admin.js        # Admin dashboard logic
├── data/
│   ├── projects.json       # Portfolio projects
│   └── messages.json       # Contact messages
├── ROUTES.md               # This file
└── .nojekyll               # GitHub Pages config
```
