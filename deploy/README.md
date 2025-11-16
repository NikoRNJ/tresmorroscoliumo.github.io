# Guía de despliegue (DigitalOcean + servidores propios)

Este directorio contiene configuraciones listas para usar en DigitalOcean App Platform, Droplets con Node.js + Nginx y entornos que prefieran Apache como reverse proxy.

---

## 1. DigitalOcean App Platform

1. **Especificación lista (`.do/app.yaml`)**  
   - Permite crear o actualizar la App con `doctl apps create/update --spec .do/app.yaml`.  
   - Define el build (`pnpm install --frozen-lockfile && pnpm build`), el run command del `Procfile` y la lista de variables críticas (quedan con valor vacío para que las completes desde el panel).
2. **Repositorio y rama**  
   - Github: `https://github.com/NikoRNJ/tresmorroscoliumo.github.io`  
   - Rama: `main`
3. **Runtime y comandos**  
   - Node 20 (`package.json` + `.nvmrc` fuerzan 20.18.x).  
   - Build: `pnpm install && pnpm build`.  
   - Run: `pnpm --filter @tresmorros/web start -- -p ${PORT:-3000}` (idéntico al Procfile).
4. **Variables de entorno**  
   - Copia las llaves desde `env/example.env`, `apps/web/env.local.example` o el `.env.local` versionado que se incluyó para pruebas rápidas.  
   - App Platform no lee archivos `.env*` automáticamente, por lo que debes pegarlas en la pestaña **Environment Variables** o dejar los valores directamente en `.do/app.yaml` si no es un repo público.
5. **Archivos `.env`**  
   - `.env.local` está permitido en el repo para DigitalOcean, pero evita subir llaves sensibles a repos públicos.  
   - Para separar secretos, deja los valores en blanco en `.do/app.yaml` y complétalos desde la UI o `doctl apps update`.

---

## 2. Droplet con Node.js + Nginx (reverse proxy)

1. **Provisiona el servidor**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y build-essential nginx git ufw
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   corepack enable pnpm
   ```

2. **Clona el repo y prepara el entorno**
   ```bash
   git clone https://github.com/NikoRNJ/tresmorroscoliumo.git /var/www/tres-morros
   cd /var/www/tres-morros
   cp env/example.env .env
   cp apps/web/env.local.example apps/web/.env.local
   # edita ambos archivos con tus credenciales reales
   pnpm install
   pnpm build
   ```

3. **Servicio systemd (opcional)**  
   Copia `deploy/node/systemd-example.service` a `/etc/systemd/system/tres-morros.service`, ajusta rutas y habilita:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now tres-morros
   ```

4. **Configura el reverse proxy Nginx**  
   - Usa `deploy/nginx/reverse-proxy.conf` como plantilla (`/etc/nginx/sites-available/tres-morros`).  
   - Habilita el sitio:  
     ```bash
     sudo ln -s /etc/nginx/sites-available/tres-morros /etc/nginx/sites-enabled/tres-morros
     sudo nginx -t && sudo systemctl reload nginx
     ```
   - Emite certificados TLS con Certbot si el dominio ya apunta al Droplet.

---

## 3. Apache + Node.js

Si tu infraestructura ya usa Apache como frontal, aprovecha `deploy/apache/vhost.conf`:

1. Activa los módulos necesarios:
   ```bash
   sudo a2enmod proxy proxy_http proxy_wstunnel headers
   sudo systemctl reload apache2
   ```
2. Copia el virtual host, actualiza `ServerName` y la ruta al backend (`http://127.0.0.1:3000` por defecto).
3. Habilita el sitio con `a2ensite tres-morros` y recarga Apache.

---

## 4. Comprobaciones finales

- `curl -f http://127.0.0.1:3000/api/health` en el servidor debe devolver `200 OK`.
- Verifica que el cron secreto (`CRON_SECRET`) coincida con el configurado en Jobs/CRON de DigitalOcean.
- Asegura que `FLOW_FORCE_MOCK=false` en producción y que las llaves de Flow/Supabase/SendGrid sean las reales.
- No olvides reiniciar el servicio (o re desplegar en App Platform) cada vez que cambies variables sensibles.

---

## 5. Resumen rápido de configuraciones incluidas

| Archivo | Propósito |
| --- | --- |
| `.do/app.yaml` | Spec oficial de App Platform (build/run/envs). |
| `Procfile` | Comando `web` para procesos basados en dynos (DO, Heroku, Render). |
| `deploy/nginx/reverse-proxy.conf` | Reverse proxy Nginx → Node.js (Next 3000). |
| `deploy/apache/vhost.conf` | VirtualHost Apache con `ProxyPass` listo. |
| `deploy/node/systemd-example.service` | Servicio `systemd` para mantener el proceso pnpm/Next. |

