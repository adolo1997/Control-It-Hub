# Control IT Hub

SaaS multiempresa para centralizar control operativo IT: login seguro, empresas/divisiones, integraciones con PRTG/backups, licencias, vencimientos, compras y registros.

## Stack inicial

- Next.js + TypeScript para web y API.
- Prisma + PostgreSQL como base de datos principal.
- Cookie HTTP-only firmada con JWT para sesiones de 8 horas.
- Roles por empresa: `OWNER`, `ADMIN`, `TECH`, `BILLING`, `VIEWER`.
- Auditoria de login correcto/fallido.
- Docker Compose preparado para VPS Ubuntu.

## Arranque local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables:

```bash
cp .env.example .env
```

3. Arranca PostgreSQL local o usa Docker:

```bash
docker run --name control-it-hub-postgres -e POSTGRES_DB=control_it_hub -e POSTGRES_USER=control_it_hub -e POSTGRES_PASSWORD=control_it_hub_dev -p 5432:5432 -d postgres:16
```

4. Migra y crea el usuario inicial:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

5. Levanta la app:

```bash
npm run dev
```

Acceso por defecto del seed:

- Email: `admin@controlithub.local`
- Password: `Cambia-Esta-Clave-2026!`

Cambia esta clave en producción.

## Despliegue en VPS Ubuntu

1. Instala Docker y Docker Compose plugin.
2. Crea un `.env` dentro de `deploy/` con:

```env
APP_URL=https://tu-dominio.com
POSTGRES_PASSWORD=un-password-largo
SESSION_SECRET=un-secreto-muy-largo-de-minimo-32-caracteres
SEED_ADMIN_EMAIL=admin@tu-dominio.com
SEED_ADMIN_PASSWORD=una-clave-inicial-muy-fuerte
SEED_COMPANY_NAME=Tu Empresa
```

3. Desde `deploy/`:

```bash
docker compose up -d --build
docker compose exec app npm run prisma:seed
```

Para HTTPS en IONOS, coloca Caddy, Nginx Proxy Manager o Traefik delante del puerto `3000`.

## Siguientes bloques naturales

- Formularios CRUD para empresas, usuarios, licencias e integraciones.
- Cifrado real de secretos de API por empresa.
- Workers programados para sincronizar PRTG y backups.
- Alertas por email/Teams cuando una licencia vence o un backup falla.
- MFA/TOTP y recuperacion de contrasena antes de producción comercial.
