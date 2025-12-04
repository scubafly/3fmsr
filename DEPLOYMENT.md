# 🐳 Docker Deployment Guide

Complete gids om de 3FM Serious Request display te deployen op je NAS en naar de wereld te exposen.

## 📋 Vereisten

- Docker geïnstalleerd op je NAS
- Docker Compose (meestal al bij Docker)
- Poort 3000 beschikbaar (of kies een andere)
- Optioneel: Reverse proxy (Nginx Proxy Manager, Traefik, Caddy)

## 🚀 Quick Start

### 1. Bestanden naar NAS kopiëren

```bash
# Op je laptop - kopieer naar NAS
scp -r /Users/jack/Sites/3fmsr user@nas-ip:/path/to/docker/3fm-display

# Of gebruik rsync
rsync -avz /Users/jack/Sites/3fmsr/ user@nas-ip:/path/to/docker/3fm-display/
```

### 2. Bouwen en Starten

```bash
# SSH naar je NAS
ssh user@nas-ip

# Ga naar de directory
cd /path/to/docker/3fm-display

# Build en start de container
docker-compose up -d

# Check de logs
docker-compose logs -f
```

### 3. Testen

```bash
# Lokaal op NAS (via host-poort 8082)
curl http://localhost:8082/api

# Vanaf je laptop (vervang NAS-IP)
curl http://192.168.1.xxx:8082/api
```

## 🌍 Naar de Wereld Exposen

Je hebt **3 opties** om de display naar de wereld te exposen:

### **Optie 1: Direct Port Forwarding (Simpel)** ⚠️

**Stappen:**
1. Log in op je router
2. Forward poort `8082` (of `80`/`443`) naar je NAS IP
3. Vind je publieke IP: `curl ifconfig.me`
4. Toegang via: `http://[jouw-publieke-ip]:8082`

**Nadelen:**
- Geen HTTPS (onveilig)
- Publiek IP kan veranderen
- Geen mooie domeinnaam

### **Optie 2: Cloudflare Tunnel (Aanbevolen)** ⭐

**Voordelen:**
- ✅ Gratis HTTPS
- ✅ Geen port forwarding nodig
- ✅ Eigen domeinnaam
- ✅ DDoS bescherming
- ✅ Verbergt je IP

**Setup:**

1. **Maak Cloudflare account** (gratis): https://dash.cloudflare.com

2. **Voeg domein toe** (of gebruik gratis subdomain)

3. **Installeer Cloudflared op NAS:**

```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Login
cloudflared tunnel login

# Maak tunnel
cloudflared tunnel create 3fm-display

# Configureer tunnel
nano ~/.cloudflared/config.yml
```

4. **Config bestand** (`~/.cloudflared/config.yml`):

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/user/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: 3fm.jouwdomein.nl
    service: http://localhost:8082
  - service: http_status:404
```

5. **DNS instellen** in Cloudflare dashboard:
   - Type: `CNAME`
   - Name: `3fm`
   - Target: `<TUNNEL-ID>.cfargotunnel.com`
   - Proxy: ✅ Enabled

6. **Start tunnel:**

```bash
cloudflared tunnel run 3fm-display
```

7. **Als service (auto-start):**

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

**Toegang:** `https://3fm.jouwdomein.nl` 🎉

### **Optie 3: Reverse Proxy met Let's Encrypt** 🔒

Als je al een reverse proxy hebt (Nginx Proxy Manager, Traefik, Caddy):

**Nginx Proxy Manager:**
1. Add Proxy Host
2. Domain: `3fm.jouwdomein.nl`
3. Forward to: `3fm-serious-request:3000`
4. Enable SSL (Let's Encrypt)

**Traefik (docker-compose.yml):**

```yaml
version: '3.8'

services:
  3fm-display:
    build: .
    container_name: 3fm-serious-request
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.3fm.rule=Host(`3fm.jouwdomein.nl`)"
      - "traefik.http.routers.3fm.entrypoints=websecure"
      - "traefik.http.routers.3fm.tls.certresolver=letsencrypt"
      - "traefik.http.services.3fm.loadbalancer.server.port=3000"

networks:
  traefik:
    external: true
```

## 🔧 Docker Commands Cheatsheet

```bash
# Start container
docker-compose up -d

# Stop container
docker-compose down

# Restart container
docker-compose restart

# View logs
docker-compose logs -f

# View logs (laatste 100 regels)
docker-compose logs --tail=100

# Rebuild na code wijziging
docker-compose up -d --build

# Container status
docker-compose ps

# Resource gebruik
docker stats 3fm-serious-request

# Shell in container
docker exec -it 3fm-serious-request sh

# Verwijder alles (inclusief image)
docker-compose down --rmi all
```

## 📊 Monitoring & Maintenance

### Health Check

De container heeft een ingebouwde health check:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' 3fm-serious-request
```

### Logs Bekijken

```bash
# Real-time logs
docker-compose logs -f

# Laatste 50 regels
docker-compose logs --tail=50

# Logs van laatste uur
docker-compose logs --since 1h
```

### Auto-Update met Watchtower

Optioneel: automatisch updaten bij nieuwe builds:

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 300 \
  --label-enable
```

## 🔒 Beveiliging Tips

1. **Gebruik HTTPS** (via Cloudflare of Let's Encrypt)
2. **Firewall**: Alleen poort 443 (HTTPS) open naar buiten
3. **Rate limiting**: Via Cloudflare of reverse proxy
4. **Monitoring**: Stel alerts in voor downtime
5. **Updates**: Houd Docker image up-to-date

## 🐛 Troubleshooting

### Container start niet

```bash
# Check logs
docker-compose logs

# Check port conflict voor host-poort 8082
sudo lsof -i :8082

# Rebuild
docker-compose up -d --build --force-recreate
```

### Kan niet verbinden

```bash
# Test binnen container
docker exec 3fm-serious-request wget -O- http://localhost:3000/api

# Test vanaf NAS (via host-poort 8082)
curl http://localhost:8082/api

# Check firewall
sudo ufw status
```

### Data laadt niet

```bash
# Check of NPO 3FM bereikbaar is
docker exec 3fm-serious-request wget -O- https://www.npo3fm.nl

# Check DNS
docker exec 3fm-serious-request nslookup npo3fm.nl
```

## 📱 Synology NAS Specifiek

Als je een Synology NAS hebt:

1. **Docker installeren** via Package Center
2. **SSH inschakelen** in Control Panel
3. **Bestanden uploaden** via File Station naar `/docker/3fm-display`
4. **Via SSH:**

```bash
cd /volume1/docker/3fm-display
sudo docker-compose up -d
```

5. **In Docker GUI:**
   - Container verschijnt automatisch
   - Logs bekijken via GUI
   - Auto-restart instellen

## 🎯 Productie Checklist

- [ ] Docker container draait stabiel
- [ ] Health checks zijn groen
- [ ] Logs tonen geen errors
- [ ] API endpoint reageert: `/api`
- [ ] Display pagina laadt: `/`
- [ ] HTTPS werkt (via Cloudflare/proxy)
- [ ] Auto-restart enabled (`restart: unless-stopped`)
- [ ] Monitoring/alerts ingesteld
- [ ] Backup van configuratie
- [ ] Domeinnaam geconfigureerd

## 🌐 Voorbeeld URLs

Na deployment:

- **Lokaal netwerk**: `http://nas-ip:8082`
- **Met Cloudflare**: `https://3fm.jouwdomein.nl`
- **Met reverse proxy**: `https://3fm.jouwdomein.nl`
- **Direct (port forward)**: `http://jouw-publieke-ip:3000`

## 📞 Support

Bij problemen:
1. Check de logs: `docker-compose logs -f`
2. Test de API: `curl http://localhost:8082/api`
3. Verify health: `docker inspect 3fm-serious-request`

---

**Veel succes met de deployment! 🚀**
