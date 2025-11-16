# 🚀 ITERACIÓN 8: Deploy en DigitalOcean

**OBJETIVO:** Desplegar la aplicación completa en producción usando DigitalOcean Droplet con configuración de Nginx, SSL, y optimizaciones de rendimiento.

**DURACIÓN ESTIMADA:** 4-5 horas

**ESTADO:** 🔴 Pendiente

**DEPENDENCIAS:** Iteración 7 completada ✅

---

## **📋 PRE-REQUISITOS**

Antes de comenzar, verifica que:

- [ ] Iteración 7 está 100% completada
- [ ] Todo funciona correctamente en local
- [ ] Tienes cuenta de DigitalOcean creada
- [ ] Tienes credenciales de Flow en producción (no sandbox)
- [ ] Tienes dominio propio o estás listo para usar IP temporal

---

## **🎯 OBJETIVOS DE ESTA ITERACIÓN**

Al finalizar, deberás tener:

1. ✅ Droplet de DigitalOcean configurado
2. ✅ Node.js 20 LTS instalado
3. ✅ Nginx como reverse proxy
4. ✅ SSL/HTTPS configurado con Let's Encrypt
5. ✅ PM2 para gestión de procesos
6. ✅ Variables de entorno de producción
7. ✅ Aplicación corriendo en producción
8. ✅ Dominio apuntando al servidor (opcional)
9. ✅ Backups automáticos configurados
10. ✅ Monitoreo básico

---

## **PASO 1: Crear Droplet en DigitalOcean**

### **Instrucciones:**

1. **Ir a DigitalOcean Dashboard**
   - https://cloud.digitalocean.com

2. **Crear nuevo Droplet**
   - Click en "Create" → "Droplets"

3. **Configuración del Droplet:**
   ```
   Región: San Francisco 3 (o la más cercana a Chile)
   Imagen: Ubuntu 22.04 LTS x64
   Plan: Basic
   CPU: Regular - $6/mes (1 GB RAM, 1 vCPU, 25 GB SSD)
   ```

4. **Autenticación:**
   ```
   Opción 1: SSH Key (recomendado)
   - Agrega tu clave SSH pública
   
   Opción 2: Password
   - DigitalOcean te enviará la contraseña por email
   ```

5. **Hostname:**
   ```
   tres-morros-coliumo
   ```

6. **Opciones adicionales:**
   - ✅ Monitoring (gratis)
   - ✅ IPv6
   - ❌ Backups ($1.20/mes - opcional pero recomendado)

7. **Click en "Create Droplet"**
   - Esperar 1-2 minutos a que se cree

8. **Anotar la IP pública**
   ```
   Ejemplo: 167.99.123.45
   ```

---

## **PASO 2: Configuración Inicial del Servidor**

### **Conectarse al servidor:**

```bash
# Desde tu computador local
ssh root@167.99.123.45

# Si usas SSH key:
ssh -i ~/.ssh/id_rsa root@167.99.123.45
```

### **Actualizar el sistema:**

```bash
# Actualizar paquetes
apt update && apt upgrade -y

# Instalar paquetes esenciales
apt install -y curl wget git build-essential
```

### **Crear usuario no-root:**

```bash
# Crear usuario 'deploy'
adduser deploy

# Agregar a grupo sudo
usermod -aG sudo deploy

# Copiar SSH keys al nuevo usuario (si usas SSH)
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Cambiar a usuario deploy
su - deploy
```

---

## **PASO 3: Instalar Node.js 20 LTS**

```bash
# Como usuario 'deploy'

# Instalar NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recargar configuración
source ~/.bashrc

# Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x
```

---

## **PASO 4: Instalar PM2**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar
pm2 --version

# Configurar PM2 para iniciar con el sistema
pm2 startup

# Ejecutar el comando que te muestra PM2
# Ejemplo: sudo env PATH=$PATH:/home/deploy/.nvm/versions/node/v20.x.x/bin...
```

---

## **PASO 5: Clonar el Proyecto**

```bash
# Ir al home del usuario
cd ~

# Clonar desde GitHub
git clone https://github.com/NikoRNJ/tres-morros-coliumo.git

# O si el repo es privado:
# git clone https://<TOKEN>@github.com/NikoRNJ/tres-morros-coliumo.git

# Entrar al proyecto
cd tres-morros-coliumo
```

---

## **PASO 6: Configurar Variables de Entorno de Producción**

### **Crear archivo `.env.production`:**

```bash
nano .env.production
```

### **Contenido del archivo:**

```env
# ==============================================
# PRODUCCIÓN - Tres Morros de Coliumo
# ==============================================

# SUPABASE (mismo proyecto de desarrollo)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# FLOW (PRODUCCIÓN - NO SANDBOX)
FLOW_API_KEY=tu-api-key-PRODUCCION
FLOW_SECRET_KEY=tu-secret-key-PRODUCCION
FLOW_BASE_URL=https://www.flow.cl/api

# SENDGRID
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=no-reply@tresmorroscoliumo.cl
SENDGRID_FROM_NAME=Tres Morros de Coliumo

# APLICACIÓN
NEXT_PUBLIC_SITE_URL=https://tresmorroscoliumo.cl
NEXT_PUBLIC_SITE_NAME=Tres Morros de Coliumo
NODE_ENV=production

# ADMIN
ADMIN_PASSWORD=CAMBIAR-POR-CONTRASEÑA-SEGURA-PRODUCCION
ADMIN_EMAIL=contacto@tresmorroscoliumo.cl

# SEGURIDAD
CRON_SECRET=genera-un-string-aleatorio-MUY-largo-y-seguro-64-caracteres
FLOW_WEBHOOK_SECRET=otro-string-aleatorio-MUY-largo-y-seguro-64-caracteres
```

### **Guardar y salir:**
```bash
# Ctrl + O (guardar)
# Enter
# Ctrl + X (salir)
```

### **Proteger el archivo:**
```bash
chmod 600 .env.production
```

---

## **PASO 7: Instalar Dependencias y Build**

```bash
# Instalar dependencias
npm ci --production=false

# Build de producción
npm run build

# Verificar que se creó la carpeta .next
ls -la .next
```

---

## **PASO 8: Configurar PM2**

### **Crear archivo de configuración de PM2:**

```bash
nano ecosystem.config.js
```

### **Contenido:**

```javascript
module.exports = {
  apps: [
    {
      name: 'tres-morros',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/deploy/tres-morros-coliumo',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env.production',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
```

### **Crear carpeta de logs:**

```bash
mkdir -p logs
```

### **Iniciar la aplicación con PM2:**

```bash
# Iniciar
pm2 start ecosystem.config.js

# Verificar que está corriendo
pm2 status

# Ver logs
pm2 logs tres-morros --lines 50

# Guardar configuración
pm2 save
```

---

## **PASO 9: Instalar y Configurar Nginx**

```bash
# Como root o con sudo
sudo apt install -y nginx

# Verificar que está corriendo
sudo systemctl status nginx

# Habilitar para que inicie con el sistema
sudo systemctl enable nginx
```

### **Crear configuración de Nginx:**

```bash
sudo nano /etc/nginx/sites-available/tres-morros
```

### **Contenido (sin SSL por ahora):**

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name tresmorroscoliumo.cl www.tresmorroscoliumo.cl;
    # Si no tienes dominio aún, usa la IP:
    # server_name 167.99.123.45;

    # Logs
    access_log /var/log/nginx/tres-morros-access.log;
    error_log /var/log/nginx/tres-morros-error.log;

    # Aumentar límite de tamaño de upload (para imágenes)
    client_max_body_size 10M;

    # Proxy a Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache de archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Cache de imágenes
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

### **Activar el sitio:**

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/tres-morros /etc/nginx/sites-enabled/

# Eliminar sitio default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si todo está bien, reiniciar Nginx
sudo systemctl restart nginx
```

### **Verificar:**

```bash
# Abrir navegador en:
http://167.99.123.45

# Debe mostrar tu sitio funcionando
```

---

## **PASO 10: Configurar SSL con Let's Encrypt**

### **Instalar Certbot:**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### **Obtener certificado SSL:**

```bash
# Si tienes dominio configurado:
sudo certbot --nginx -d tresmorroscoliumo.cl -d www.tresmorroscoliumo.cl

# Responder las preguntas:
# Email: tu-email@ejemplo.com
# Términos: Y (Yes)
# Compartir email: N (No)
# Redirect HTTP a HTTPS: 2 (Yes, redirect)
```

### **Verificar renovación automática:**

```bash
# Certbot instala un cron automáticamente
sudo certbot renew --dry-run

# Si funciona, el certificado se renovará automáticamente
```

### **Verificar:**

```bash
# Abrir navegador en:
https://tresmorroscoliumo.cl

# Debe mostrar el candado verde (SSL activo)
```

---

## **PASO 11: Configurar Firewall**

```bash
# Habilitar UFW (Uncomplicated Firewall)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar estado
sudo ufw status

# Debe mostrar:
# 22/tcp (OpenSSH) - ALLOW
# 80/tcp (Nginx HTTP) - ALLOW
# 443/tcp (Nginx HTTPS) - ALLOW
```

---

## **PASO 12: Configurar Dominio (Opcional)**

### **Si tienes dominio propio:**

1. **Ir a tu proveedor de DNS** (GoDaddy, Namecheap, etc.)

2. **Crear registros DNS:**
   ```
   Tipo A:
   Host: @
   Value: 167.99.123.45
   TTL: 3600

   Tipo A:
   Host: www
   Value: 167.99.123.45
   TTL: 3600
   ```

3. **Esperar propagación** (5 minutos a 48 horas)

4. **Verificar:**
   ```bash
   nslookup tresmorroscoliumo.cl
   # Debe mostrar tu IP
   ```

---

## **PASO 13: Crear Script de Deploy**

### **Archivo: `scripts/deploy.sh`** (en tu proyecto local)

```bash
#!/bin/bash

# Script de deploy automático
# Uso: ./scripts/deploy.sh

set -e

echo "🚀 Iniciando deploy a producción..."

# Variables
SERVER="deploy@167.99.123.45"
PROJECT_DIR="/home/deploy/tres-morros-coliumo"

# 1. Conectar al servidor y hacer pull
echo "📥 Descargando últimos cambios..."
ssh $SERVER << 'ENDSSH'
cd /home/deploy/tres-morros-coliumo
git pull origin main
ENDSSH

# 2. Instalar dependencias y build
echo "📦 Instalando dependencias..."
ssh $SERVER << 'ENDSSH'
cd /home/deploy/tres-morros-coliumo
npm ci --production=false
npm run build
ENDSSH

# 3. Reiniciar PM2
echo "🔄 Reiniciando aplicación..."
ssh $SERVER << 'ENDSSH'
pm2 restart tres-morros
pm2 save
ENDSSH

# 4. Verificar estado
echo "✅ Verificando estado..."
ssh $SERVER << 'ENDSSH'
pm2 status
ENDSSH

echo "🎉 Deploy completado exitosamente!"
```

### **Dar permisos de ejecución:**

```bash
chmod +x scripts/deploy.sh
```

### **Uso:**

```bash
# Desde tu computador local, después de hacer commit
git push origin main
./scripts/deploy.sh
```

---

## **PASO 14: Configurar Backups Automáticos**

### **Crear script de backup:**

```bash
# En el servidor
sudo nano /usr/local/bin/backup-tres-morros.sh
```

### **Contenido:**

```bash
#!/bin/bash

# Backup de Tres Morros de Coliumo
# Ejecutar diariamente a las 3 AM

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/home/deploy/backups"
PROJECT_DIR="/home/deploy/tres-morros-coliumo"

# Crear directorio de backups
mkdir -p $BACKUP_DIR

# Backup de archivos
echo "Creando backup de archivos..."
tar -czf $BACKUP_DIR/tres-morros-files-$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='logs' \
  $PROJECT_DIR

# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "tres-morros-files-*.tar.gz" -type f -mtime +7 -delete

echo "Backup completado: tres-morros-files-$DATE.tar.gz"
```

### **Dar permisos:**

```bash
sudo chmod +x /usr/local/bin/backup-tres-morros.sh
```

### **Configurar cron:**

```bash
sudo crontab -e
```

### **Agregar línea:**

```cron
# Backup diario a las 3 AM
0 3 * * * /usr/local/bin/backup-tres-morros.sh >> /var/log/backup-tres-morros.log 2>&1
```

---

## **PASO 15: Configurar Cron Jobs de la Aplicación**

### **Editar crontab:**

```bash
crontab -e
```

### **Agregar jobs:**

```cron
# Expirar holds cada 5 minutos
*/5 * * * * curl -X POST http://localhost:3000/api/jobs/expire-holds -H "x-cron-secret: TU-CRON-SECRET" >> /home/deploy/tres-morros-coliumo/logs/cron-expire-holds.log 2>&1

# Enviar recordatorios diarios a las 9 AM
0 9 * * * curl -X POST http://localhost:3000/api/jobs/send-reminders -H "x-cron-secret: TU-CRON-SECRET" >> /home/deploy/tres-morros-coliumo/logs/cron-reminders.log 2>&1
```

---

## **PASO 16: Monitoreo Básico**

### **Instalar herramientas de monitoreo:**

```bash
# htop para monitoreo en tiempo real
sudo apt install -y htop

# netdata para dashboard visual
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Acceder a Netdata en:
# http://167.99.123.45:19999
```

### **Configurar alertas de PM2:**

```bash
# Instalar pm2-logrotate
pm2 install pm2-logrotate

# Configurar
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## **PASO 17: Optimizaciones de Rendimiento**

### **Configurar compresión gzip en Nginx:**

```bash
sudo nano /etc/nginx/nginx.conf
```

### **Agregar en http block:**

```nginx
# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### **Reiniciar Nginx:**

```bash
sudo systemctl restart nginx
```

---

## **PASO 18: Configurar Flow Webhook en Producción**

### **Actualizar URL del webhook en Flow:**

1. Ir a Flow Dashboard (producción)
2. Configuración → Notificaciones
3. URL de Confirmación: `https://tresmorroscoliumo.cl/api/payments/flow/webhook`
4. Guardar

### **Verificar que el webhook es accesible:**

```bash
curl https://tresmorroscoliumo.cl/api/payments/flow/webhook
# Debe devolver: {"status":"ok",...}
```

---

## **✅ VALIDACIÓN DE LA ITERACIÓN 8**

### **Checklist de Validación:**

```bash
# 1. Servidor accesible
ping 167.99.123.45

# 2. Sitio carga correctamente
curl -I https://tresmorroscoliumo.cl
# Debe devolver: HTTP/2 200

# 3. SSL activo
openssl s_client -connect tresmorroscoliumo.cl:443 -servername tresmorroscoliumo.cl
# Debe mostrar certificado válido

# 4. PM2 corriendo
ssh deploy@167.99.123.45 "pm2 status"
# Debe mostrar: tres-morros | online

# 5. Logs sin errores
ssh deploy@167.99.123.45 "pm2 logs tres-morros --lines 20 --nostream"

# 6. Health check API
curl https://tresmorroscoliumo.cl/api/health
# Debe devolver: {"status":"ok",...}

# 7. Probar flujo completo
# - Crear una reserva de prueba
# - Completar pago (con tarjeta de prueba si es sandbox)
# - Verificar que llega el email
# - Verificar que aparece en panel admin

# 8. Verificar cron jobs
ssh deploy@167.99.123.45 "crontab -l"
# Deben aparecer los 2 jobs configurados

# 9. Verificar backups
ssh deploy@167.99.123.45 "ls -lah /home/deploy/backups"
# Debe aparecer al menos un backup

# 10. Performance
# Abrir https://pagespeed.web.dev/
# Analizar: https://tresmorroscoliumo.cl
# Objetivo: Performance > 80
```

---

## **📝 CHECKLIST FINAL ITERACIÓN 8**

- [ ] Droplet creado en DigitalOcean
- [ ] Node.js 20 instalado
- [ ] PM2 configurado y corriendo
- [ ] Proyecto clonado y build exitoso
- [ ] Variables de entorno de producción configuradas
- [ ] Nginx instalado y configurado
- [ ] SSL/HTTPS funcionando (candado verde)
- [ ] Dominio apuntando al servidor (o IP accesible)
- [ ] Firewall configurado
- [ ] Backups automáticos configurados
- [ ] Cron jobs funcionando
- [ ] Webhook de Flow actualizado
- [ ] Sitio accesible y funcional
- [ ] Performance > 80 en PageSpeed
- [ ] No hay errores en logs de PM2
- [ ] Script de deploy funciona

---

## **🎯 PRÓXIMOS PASOS**

Si TODOS los checks están ✅:

```bash
# En local
git add scripts/deploy.sh
git commit -m "feat: iteration 8 - deploy scripts and production config"
git push origin main
```

**SIGUIENTE:** 09-ITERATION-9.md (Testing y Validación Final)

---

## **🆘 TROUBLESHOOTING COMÚN**

### **Problema: PM2 no inicia**
```bash
# Ver logs detallados
pm2 logs tres-morros --err --lines 100

# Verificar variables de entorno
pm2 env 0

# Reiniciar desde cero
pm2 delete all
pm2 start ecosystem.config.js
```

### **Problema: Error 502 Bad Gateway en Nginx**
```bash
# Verificar que Next.js está corriendo
pm2 status

# Verificar que escucha en puerto 3000
sudo netstat -tulpn | grep :3000

# Ver logs de Nginx
sudo tail -f /var/log/nginx/tres-morros-error.log
```

### **Problema: SSL no funciona**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Ver logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### **Problema: Webhook de Flow no llega**
```bash
# Verificar que el endpoint es accesible desde internet
curl https://tresmorroscoliumo.cl/api/payments/flow/webhook

# Ver logs de la API
pm2 logs tres-morros | grep webhook

# Verificar en Flow Dashboard que la URL está correcta
```

---

**ESTADO:** 🔴 Pendiente → 🟢 Completada  
**PRÓXIMO ARCHIVO:** AI-INSTRUCTIONS/09-ITERATION-9.md

---

**FIN DE LA ITERACIÓN 8**