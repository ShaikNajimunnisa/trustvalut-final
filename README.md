**TrustVault – Secure Document Vault**
A secure document-sharing web app built with Node.js, Express and SQLite, with a built-in web UI. Users upload documents, share them with specific people (read or edit access), and every action is written to a tamper-evident audit log that admins can verify with one click.

**Features**
Authentication: register and login with JWT tokens (2-hour expiry) and bcrypt-hashed passwords
Role-based access control: admin, owner and viewer roles
Per-document sharing: owners grant or revoke read/edit access for other users
Upload and download: 10 MB limit with a file-type whitelist
Tamper-evident audit log: each entry is hash-chained to the previous one, and admins can run a "Verify hash chain" check
Admin panel: audit log and user list (admin only)
Security
Passwords hashed with bcrypt
Login and register limited to 10 attempts per 15 minutes
Security headers via Helmet; CORS is off unless CORS_ORIGIN is set
In production the app refuses to start without a strong JWT_SECRET, and no demo users are created
Self-registration only creates viewer accounts
npm audit: 0 known vulnerabilities at the time of packaging
Tech Stack
Node.js 20+, Express, better-sqlite3, JSON Web Tokens, bcryptjs, multer, helmet, express-rate-limit, plain HTML/JS frontend.

**Project Structure**
backend/
  src/
    app.js            # server setup
    config.js         # environment config
    db.js             # SQLite setup
    seed.js           # creates demo users / first admin
    middleware/       # auth + permission checks
    routes/           # auth, documents, admin
    utils/audit.js    # hash-chained audit log
  public/             # web UI (index.html, app.js)
  tests/              # automated tests
  Dockerfile
render.yaml           # Render deployment blueprint
Run Locally (Node 20+)
bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
npm run seed
npm start
Open http://localhost:3000

Demo logins (local only):

Role	Email	Password
Admin	admin@vault.com	admin123
Owner	owner@vault.com	owner123
Viewer	viewer@vault.com	viewer123
Run the tests with npm test.

**API Overview**
Method	Endpoint	Access
POST	/api/auth/register	Public (creates viewer)
POST	/api/auth/login	Public
POST	/api/documents/upload	Logged in
GET	/api/documents	Logged in
GET	/api/documents/:id/download	Read permission
GET	/api/documents/:id/permissions	Owner
POST	/api/documents/:id/grant	Owner
POST	/api/documents/:id/revoke	Owner
GET	/api/admin/audit	Admin
GET	/api/admin/audit/verify	Admin
GET	/api/admin/users	Admin
Check the route files in backend/src/routes/ for the exact URL prefixes if you change the mounting in app.js.

**Deploy with Docker**
bash
cd backend
docker build -t trustvault .
docker run -d --name trustvault -p 80:3000 -v trustvault-data:/data \
  -e JWT_SECRET="$(openssl rand -hex 32)" trustvault
# create the first real admin (no demo users in production)
docker exec -e ADMIN_EMAIL=shaik.najimunnisa29@email.com -e ADMIN_PASSWORD='YourLongPassword' trustvault node src/seed.js
Put it behind HTTPS (Caddy or nginx with Let's Encrypt).

**Deploy on Render**
Push this repo to GitHub.
In Render, choose New > Blueprint and select the repo (it reads render.yaml).
Set ADMIN_EMAIL and ADMIN_PASSWORD when asked. JWT_SECRET is generated automatically.
After the deploy, open the service's Shell tab and run node src/seed.js once to create the admin.
A paid instance is required because the database and uploads live on a persistent disk (/data). HTTPS is automatic.

Environment Variables
Variable	Purpose
JWT_SECRET	Required in production, 16+ characters
NODE_ENV	production disables demo seeding and enforces the secret
DATA_DIR	Folder for trustvault.db and uploads/ (use a persistent disk)
CORS_ORIGIN	Optional, comma-separated allowed origins
PORT	http://localhost:3000/
ADMIN_EMAIL / ADMIN_PASSWORD	Used only by node src/seed.js to create or update an admin

**Author**
shaik.najimunnisa29email@.com
