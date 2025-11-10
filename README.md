# ☕ Honeypot Coffee Project

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
![Security](https://img.shields.io/badge/purpose-honeypot-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

*Plataforma web estilo "Buy Me a Coffee" utilizada como honeypot para detección y análisis de ataques cibernéticos*

</div>

---

## 🎯 Propósito

Este proyecto funciona como **honeypot web avanzado** deployado en un VPS para:

- 🔍 Detectar y registrar intentos de **SQL Injection**
- 🔓 Capturar ataques de **Cross-Site Scripting (XSS)**
- 📂 Identificar intentos de **Path Traversal**
- ⏱️ Detectar violaciones de **Rate Limiting** y ataques DDoS
- 🔐 Registrar intentos de acceso no autorizado
- 📊 Analizar patrones de ataque y comportamientos maliciosos
- 🤖 Estudiar técnicas de atacantes reales y bots automatizados
- 📈 Generar datos para investigación en ciberseguridad

## ⚠️ Advertencia

**Este proyecto es para fines educativos y de investigación en seguridad.**

- Sistema diseñado como **trampa para atacantes**
- Los logs capturan información sensible **por diseño**
- Implementa detección avanzada de múltiples vectores de ataque
- **NO usar en producción real** - es un sistema señuelo

---

## 🛡️ Sistema de Detección de Ataques

### Vectores de Ataque Detectados

#### 💉 SQL Injection
- Detecta 40+ patrones de inyección SQL
- Patrones básicos: `' OR '1'='1`, `admin'--`, `UNION SELECT`
- Patrones avanzados: `SLEEP()`, `BENCHMARK()`, `EXTRACTVALUE()`
- Compatible con herramientas como **SQLmap**
- Clasificación de severidad: LOW, MEDIUM, HIGH, CRITICAL

#### 🔓 Cross-Site Scripting (XSS)
- Detección de payloads XSS en formularios
- Patrones: `<script>`, `<img>`, `<svg>`, eventos JavaScript
- Validación en campos de nombre, mensaje y entrada de usuario
- Registro detallado de intentos de exfiltración

#### 📂 Path Traversal
- Detecta intentos de acceso a archivos del sistema
- Patrones: `../`, `..\\`, codificación URL (`%2e%2e`)
- Protección contra acceso a `/etc/passwd`, archivos de sistema
- Monitoreo de rutas sensibles

#### ⏱️ Rate Limiting
- Umbral: 50 requests por minuto por IP
- Detección de ataques DDoS y fuerza bruta
- Tracking por IP y User-Agent
- Compatible con herramientas como **DIRB**, **Gobuster**, **Nikto**

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express.js** - Framework del servidor
- **SQLite3** - Base de datos ligera
- **JWT** - Sistema de autenticación
- **Sistema de Logging Avanzado** - JSON estructurado por tipo de ataque
- **Middleware de Seguridad** - Detección en tiempo real

### Frontend
- **Vite** - Build tool moderno
- **JavaScript (ES6+)** - SPA funcional
- **CSS moderno** - UI atractiva para el honeypot
- **Responsive Design** - Compatible con múltiples dispositivos

---

## 📂 Estructura del Proyecto
```
honeypot-coffee-project/
│
├── honeypot-backend/                  # API REST + Sistema de Detección
│   ├── server.js                     # Servidor con middlewares de seguridad
│   ├── package.json                  # Dependencias
│   ├── database.db                   # SQLite database (auto-generada)
│   │
│   ├── access.log                    # 📝 Todos los accesos HTTP
│   ├── login_attempts.log            # 🔐 Intentos de login
│   ├── sql_injection_attempts.log    # 💉 Ataques SQL Injection
│   ├── xss_attempts.log              # 🔓 Ataques XSS
│   ├── path_traversal_attempts.log   # 📂 Path Traversal
│   └── rate_limit_attacks.log        # ⏱️ Rate Limit Violations
│
└── honeypot-frontend/                 # Interfaz web
    ├── src/
    │   ├── main.js                   # Lógica principal
    │   └── style.css                 # Estilos
    ├── index.html                    # Punto de entrada
    └── package.json                  # Dependencias frontend
```

---

## 🚀 Instalación y Uso

### 1. Clonar el repositorio
```bash
git clone https://github.com/jorcidesign/honeypot-coffee-project.git
cd honeypot-coffee-project
```

### 2. Configurar Backend
```bash
cd honeypot-backend
npm install
node server.js
```

El servidor estará corriendo en `http://localhost:3000`

✅ **Características activas:**
- Sistema de detección de SQL Injection
- Sistema de detección de XSS
- Sistema de detección de Path Traversal
- Rate Limiting con threshold de 50 req/min
- Logging estructurado en JSON
- Endpoint de estadísticas: `/api/security/stats`

### 3. Configurar Frontend
```bash
cd honeypot-frontend
npm install
npm run dev
```

El frontend estará en `http://localhost:5173`

---

## 🔑 Credenciales de Demostración

El honeypot viene con 3 usuarios de ejemplo:

| Email | Password | Username | Nombre |
|-------|----------|----------|--------|
| alex@dev.io | pass123 | alex_dev | Alex Developer |
| maria@art.com | artista456 | maria_art | María Artista |
| carlos@music.net | guitarra789 | carlos_music | Carlos Música |

---

## 📊 Sistema de Logging Avanzado

### 1. access.log
Todos los accesos HTTP:
```json
{
  "timestamp": "2025-11-10T12:00:00.000Z",
  "method": "POST",
  "url": "/api/login",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### 2. sql_injection_attempts.log
```json
{
  "timestamp": "2025-11-10T12:05:00.000Z",
  "type": "SQL_INJECTION_LOGIN",
  "severity": "CRITICAL",
  "ip": "203.0.113.42",
  "email_attempted": "admin' OR '1'='1",
  "pattern": "' OR '1'='1",
  "field": "email",
  "userAgent": "sqlmap/1.6.11"
}
```

### 3. xss_attempts.log
```json
{
  "timestamp": "2025-11-10T12:10:00.000Z",
  "type": "XSS_ATTEMPT",
  "severity": "HIGH",
  "ip": "198.51.100.23",
  "payload": {
    "supporter_name": "<script>alert(1)</script>",
    "message": "test"
  },
  "pattern_detected": "<script>",
  "field": "supporter_name"
}
```

### 4. path_traversal_attempts.log
```json
{
  "timestamp": "2025-11-10T12:15:00.000Z",
  "type": "PATH_TRAVERSAL_ATTEMPT",
  "severity": "CRITICAL",
  "ip": "185.199.108.153",
  "url": "/api/../etc/passwd",
  "pattern": "../",
  "method": "GET",
  "userAgent": "curl/7.68.0"
}
```

### 5. rate_limit_attacks.log
```json
{
  "timestamp": "2025-11-10T12:20:00.000Z",
  "type": "RATE_LIMIT_EXCEEDED",
  "severity": "MEDIUM",
  "ip": "104.26.10.78",
  "requests_per_minute": 127,
  "url": "/api/creators",
  "method": "GET",
  "userAgent": "Nikto/2.1.6"
}
```

---

## 🔐 Características del Honeypot

### ✅ Sistemas de Detección Activos
- ✓ **SQL Injection Detection** - 40+ patrones
- ✓ **XSS Detection** - Múltiples vectores
- ✓ **Path Traversal Detection** - Protección de filesystem
- ✓ **Rate Limiting** - 50 req/min threshold
- ✓ **IP Tracking** - Captura de IP real (X-Forwarded-For)
- ✓ **User-Agent Analysis** - Identificación de herramientas
- ✓ **Severity Classification** - LOW/MEDIUM/HIGH/CRITICAL
- ✓ **Real-time Monitoring** - Logs en tiempo real

### 🎯 Honeypot Features
- ✓ Acepta payloads maliciosos (para análisis)
- ✓ Registra todos los intentos sin bloquear
- ✓ Simula vulnerabilidades para atraer atacantes
- ✓ Logging exhaustivo para análisis forense

---

## 📡 API Endpoints

### Públicos
```
GET  /api/stats                      # Estadísticas globales
GET  /api/security/stats             # 🆕 Estadísticas de seguridad
GET  /api/creators                   # Lista de creadores
GET  /api/creator/:username          # Perfil de creador
GET  /api/creator/:username/coffees  # Cafés recibidos
POST /api/coffee                     # Enviar un café (con XSS detection)
```

### Protegidos (JWT)
```
POST /api/login                      # Login (con SQL Injection detection)
GET  /api/dashboard/my-coffees       # Dashboard del creador
```

### Ejemplo de respuesta `/api/security/stats`:
```json
{
  "timestamp": "2025-11-10T12:30:00.000Z",
  "login_attempts": 1523,
  "sql_injection_attempts": 247,
  "xss_attempts": 89,
  "path_traversal_attempts": 156,
  "rate_limit_violations": 34
}
```

---

## 🐳 Deploy en VPS

### Configuración en DigitalOcean
```bash
# En el VPS (Ubuntu)
git clone https://github.com/jorcidesign/honeypot-coffee-project.git
cd honeypot-coffee-project/honeypot-backend

# Instalar dependencias
npm install

# Iniciar con PM2
pm2 start server.js --name honeypot-backend
pm2 save
pm2 startup

# Verificar logs
pm2 logs honeypot-backend
```

### Configuración de Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /var/www/honeypot-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Análisis de Datos

### Monitoreo en Tiempo Real
```bash
# Ver todos los ataques
tail -f honeypot-backend/*.log

# SQL Injection
tail -f honeypot-backend/sql_injection_attempts.log | jq

# XSS
tail -f honeypot-backend/xss_attempts.log | jq

# Path Traversal
tail -f honeypot-backend/path_traversal_attempts.log | jq

# Rate Limiting
tail -f honeypot-backend/rate_limit_attacks.log | jq
```

### Análisis Estadístico
```bash
# Top 10 IPs atacantes
cat login_attempts.log | jq -r '.ip' | sort | uniq -c | sort -rn | head -10

# Patrones SQL Injection más usados
cat sql_injection_attempts.log | jq -r '.pattern' | sort | uniq -c | sort -rn

# Herramientas detectadas
cat sql_injection_attempts.log | jq -r '.userAgent' | sort | uniq -c

# Requests por hora
cat rate_limit_attacks.log | jq -r '.timestamp' | cut -dT -f2 | cut -d: -f1 | sort | uniq -c
```

---

## 🧪 Testing del Honeypot

### Probar Detección de SQL Injection
```bash
# Con curl
curl -X POST http://localhost:3000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"test"}'

# Con SQLmap
sqlmap -u "http://localhost:3000/api/login" \
       --data='{"email":"test","password":"test"}' \
       --method=POST \
       --batch
```

### Probar Detección de XSS
```bash
curl -X POST http://localhost:3000/api/coffee \
     -H "Content-Type: application/json" \
     -d '{"creator_username":"alex_dev","supporter_name":"<script>alert(1)</script>","message":"test","coffee_count":1}'
```

### Probar Path Traversal
```bash
curl "http://localhost:3000/api/../etc/passwd"
curl "http://localhost:3000/api/../../database.db"
```

### Probar Rate Limiting
```bash
for i in {1..100}; do
    curl -s http://localhost:3000/api/creators > /dev/null &
done
```

---

## 🛠️ Herramientas Compatibles

El honeypot ha sido probado con:

- ✅ **SQLmap** - SQL injection automation
- ✅ **Nikto** - Web server scanner
- ✅ **DIRB/Gobuster** - Directory brute forcing
- ✅ **Burp Suite** - Web vulnerability scanner
- ✅ **OWASP ZAP** - Security testing tool
- ✅ **Hydra** - Login brute forcing
- ✅ **curl/wget** - Command line tools
- ✅ **Custom scripts** - Python, Bash, etc.

---

## 📈 Métricas del Honeypot

El sistema trackea en tiempo real:

- ✓ Total de ataques por categoría
- ✓ IPs atacantes únicas
- ✓ Herramientas más utilizadas
- ✓ Patrones de ataque más comunes
- ✓ Distribución temporal de ataques
- ✓ Severidad de las amenazas
- ✓ Rate de éxito/fallo de ataques

---

## 🎓 Casos de Uso Educativos

1. **Análisis de SQL Injection**
   - Estudiar técnicas de inyección SQL
   - Identificar patrones comunes de SQLmap
   
2. **Detección de XSS**
   - Analizar payloads de Cross-Site Scripting
   - Entender vectores de ataque client-side
   
3. **Path Traversal Analysis**
   - Identificar intentos de acceso a archivos sensibles
   - Estudiar técnicas de directory traversal

4. **Análisis de Bots y Scripts**
   - Identificar User-Agents maliciosos
   - Estudiar comportamientos automatizados

5. **Rate Limiting & DDoS**
   - Detectar patrones de ataque distribuido
   - Analizar herramientas de fuzzing

---

## 🔄 Actualizaciones
```bash
# En el VPS
cd /opt/honeypot-coffee-project
git pull origin main
cd honeypot-backend
npm install
pm2 restart honeypot-backend
pm2 logs honeypot-backend
```

---

## 🤝 Contribuciones

Proyecto educativo open-source. Contribuciones bienvenidas:

1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/nueva-deteccion`)
3. Commit cambios (`git commit -m 'Add: detección de XXE'`)
4. Push (`git push origin feature/nueva-deteccion`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - Ver archivo `LICENSE`

---

## 📞 Contacto

**Autor:** Jorge Del Aguila  
**GitHub:** [@jorcidesign](https://github.com/jorcidesign)  
**Proyecto:** [honeypot-coffee-project](https://github.com/jorcidesign/honeypot-coffee-project)

---

## 🙏 Agradecimientos

- Inspirado en [Buy Me a Coffee](https://www.buymeacoffee.com/)
- Comunidad de honeypots y threat intelligence
- OWASP por la documentación de vectores de ataque
- Comunidad de ciberseguridad

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

<div align="center">

**⚠️ DISCLAIMER ⚠️**

*Este honeypot está diseñado exclusivamente para investigación educativa en ciberseguridad.*  
*El sistema registra y almacena todas las interacciones para análisis académico.*  
*Usar con responsabilidad y con fines éticos.*

**🐝 Happy Honeypotting! 🐝**

</div>
