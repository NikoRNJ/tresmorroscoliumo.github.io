# Sistema de Métricas de Visitantes

## Descripción

Este sistema rastrea visitantes únicos del sitio usando IPs hasheadas (SHA-256) para mantener la privacidad (GDPR-compliant).

## Instalación

### 1. Ejecutar migración en Supabase

Ve al panel de Supabase → SQL Editor y ejecuta el contenido de:
```
supabase/migrations/20231210_site_visits.sql
```

### 2. (Opcional) Agregar salt personalizado

En tu archivo `.env.local` puedes agregar un salt personalizado para el hash de IPs:
```
IP_HASH_SALT=tu-salt-secreto-personalizado
```

## Cómo funciona

1. **VisitorTracker** (componente cliente): Se ejecuta en cada navegación y envía la ruta visitada a `/api/track`

2. **API /api/track**: 
   - Obtiene la IP real del visitante (soporta proxies, Cloudflare)
   - Hashea la IP con SHA-256 + salt (nunca almacena IP real)
   - Detecta tipo de dispositivo (desktop, mobile, tablet)
   - Filtra bots automáticamente
   - Guarda en tabla `site_visits`

3. **API /api/admin/metrics**:
   - Calcula visitantes únicos por día/semana/mes
   - Top páginas visitadas
   - Distribución de dispositivos
   - Todo en tiempo real

## Métricas disponibles

| Métrica | Descripción |
|---------|-------------|
| Visitantes únicos hoy | IPs únicas que visitaron hoy |
| Visitantes únicos semana | IPs únicas últimos 7 días |
| Visitantes únicos mes | IPs únicas del mes actual |
| Top páginas | Las 5 páginas más visitadas |
| Dispositivos | % de desktop/mobile/tablet |

## Notas de privacidad

- Las IPs NUNCA se almacenan en texto plano
- Solo se guarda un hash irreversible (SHA-256)
- Los bots son filtrados automáticamente
- Compatible con GDPR
