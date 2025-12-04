# 3FM Serious Request - Maasland Merry Miles Display

Een live display voor de "Maasland Merry Miles" actie van 3FM Serious Request. Toont het opgehaalde bedrag, voortgang en recente donaties.

## 🎯 Voor Gobride / Digital Signage

Deze setup is speciaal gemaakt voor gebruik op een **Gobride** (Google Chromebox) of ander digital signage apparaat.

### Architectuur

```
┌─────────────────┐         ┌──────────────────┐
│   Server        │         │   Gobride        │
│  (je laptop/    │◄────────│  (Chrome OS)     │
│   Raspberry Pi) │  HTTP   │                  │
│                 │         │  Browser toont:  │
│  Node.js        │         │  http://IP:3000  │
│  Scraped 3FM    │         │                  │
└─────────────────┘         └──────────────────┘
```

## 🚀 Snelstart

### 1. Server Starten (lokaal)

Op je laptop, Raspberry Pi, of andere machine:

```bash
cd /Users/jack/Sites/3fmsr
node server.js
```

Je ziet:

```
============================================================
🎉 3FM Serious Request Display Server
============================================================
📡 Server running on port 3000
🌐 Local:   http://localhost:3000
🌐 Network: http://[your-ip]:3000

📋 Endpoints:
   Display: http://localhost:3000/
   API:     http://localhost:3000/api
============================================================
```

## 🧊 NAS / Portainer / Cloudflare Tunnel

### 1. Project op je NAS zetten

- Kopieer de map `3fmsr` naar je NAS (bijvoorbeeld naar `/volume1/docker/3fm-display` op een Synology).
- Zorg dat `Dockerfile`, `docker-compose.yml` en de andere bestanden in dezelfde map staan.

### 2. Stack in Portainer

1. Open Portainer op je NAS.
2. Ga naar **Stacks** → **Add stack**.
3. Kies **Web editor** en plak de inhoud van `docker-compose.yml`, of kies **Upload** en upload het bestand vanaf de NAS.
4. Controleer dat poort **8082:3000** wordt gepubliceerd.
5. Klik op **Deploy the stack**.

Als de stack draait, is de display lokaal beschikbaar op `http://NAS-IP:8082`.

### 3. Cloudflare Tunnel koppelen

De uitgebreide stappen staan in `DEPLOYMENT.md` onder **Optie 2: Cloudflare Tunnel**. Kort:

1. Installeer `cloudflared` op je NAS.
2. Maak een tunnel aan die naar `http://localhost:8082` wijst.
3. Koppel een hostname, bijvoorbeeld `3fm.jouwdomein.nl`, aan de tunnel.
4. Start de tunnel als service, zodat hij automatisch mee opstart.

Daarna kun je de display veilig bereiken via `https://3fm.jouwdomein.nl`.

### 2. IP Adres Vinden

De server draait op **alle netwerk interfaces** (`0.0.0.0`), dus je kunt vanaf elk apparaat op hetzelfde netwerk verbinden.

**Je IP adres vinden:**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

Bijvoorbeeld: `192.168.1.100`

### 3. Gobride Configureren

Op de Gobride:

1. Open Chrome browser
2. Navigeer naar: `http://[jouw-ip]:3000`
   - Bijvoorbeeld: `http://192.168.1.100:3000`
3. Zet browser in **fullscreen** (F11)
4. Optioneel: Gebruik een Chrome extensie om de pagina automatisch te refreshen

## 📁 Bestanden

```
3fmsr/
├── server.js       # Node.js server (scraping + web server)
├── index.html      # Display pagina
├── styles.css      # Styling (dark mode, gradients, animaties)
├── app.js          # Client-side logic (fetch data, update UI)
└── README.md       # Deze file
```

## 🔧 Hoe het werkt

1. **Server (`server.js`)**:
   - Scraped ongeveer elke 5 minuten de NPO 3FM website
   - Haalt `collectedAmount`, `targetAmount` en `donations` op
   - Serveert de HTML/CSS/JS bestanden
   - Biedt een `/api` endpoint voor de data

2. **Client (`app.js`)**:
   - Fetcht data van `/api` elke 5 minuten
   - Animeert het bedrag met smooth counting
   - Update de progress bar
   - Toont recente donaties in cards

## 🌐 Endpoints

- **`http://[ip]:3000/`** - Display pagina (voor Gobride)
- **`http://[ip]:3000/api`** - JSON API met data

### API Response Voorbeeld

```json
{
  "amount": 2227,
  "target": 5000,
  "donations": [
    {
      "name": "Renske",
      "message": "Go Go Jacq!!!",
      "amount": 15
    },
    {
      "name": "Anoniem",
      "message": null,
      "amount": 30
    }
  ]
}
```

## 🎨 Features

- ✅ **Dark mode** met 3FM branding (paars/magenta)
- ✅ **Live updates** ongeveer elke 5 minuten
- ✅ **Smooth animaties** voor bedragen en progress
- ✅ **Responsive design** (werkt op elk scherm)
- ✅ **Glow effects** en micro-animaties
- ✅ **Auto-refresh** bij tab focus

## 🔒 Beveiliging

- Server heeft **directory traversal** bescherming
- Draait op `0.0.0.0` voor netwerk toegang
- CORS headers voor API endpoint

## 🐛 Troubleshooting

### Server start niet

```bash
# Check of port 3000 al in gebruik is
lsof -i :3000

# Kill het proces
kill -9 [PID]
```

### Gobride kan niet verbinden

1. **Firewall**: Zorg dat port 3000 open staat
2. **Netwerk**: Gobride en server moeten op hetzelfde netwerk zitten
3. **IP adres**: Controleer of je het juiste IP gebruikt

### Data laadt niet

1. Check server logs (je ziet elke request)
2. Test API: `curl http://localhost:3000/api`
3. Check browser console (F12)

## 🚀 Productie Tips

### Als achtergrond proces draaien

```bash
# Met nohup
nohup node server.js > server.log 2>&1 &

# Met PM2 (aanbevolen)
npm install -g pm2
pm2 start server.js --name "3fm-display"
pm2 save
pm2 startup
```

### Auto-start bij boot (systemd)

Maak `/etc/systemd/system/3fm-display.service`:

```ini
[Unit]
Description=3FM Display Server
After=network.target

[Service]
Type=simple
User=jack
WorkingDirectory=/Users/jack/Sites/3fmsr
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Activeer:

```bash
sudo systemctl enable 3fm-display
sudo systemctl start 3fm-display
```

## 📱 Mobiel / Tablet

De display werkt ook perfect op tablets of mobiele apparaten. Gewoon navigeren naar `http://[ip]:3000`.

## 🎄 Veel succes met de actie!

Elke donatie telt. Samen maken we het verschil! 💪

---

**Gemaakt voor**: Maasland Merry Miles - 3FM Serious Request
**Tech Stack**: Node.js, Vanilla HTML/CSS/JS
**Update Interval**: 5 minuten (aanpasbaar in `app.js` en `server.js`)
**Port**: 3000
