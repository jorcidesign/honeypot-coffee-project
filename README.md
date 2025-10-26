# ☕ Honeypot Coffee Project

<div align="center">

![Status](https://img.shields.io/badge/status-active-success.svg)
![Security](https://img.shields.io/badge/purpose-honeypot-orange.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

*Plataforma web estilo "Buy Me a Coffee" utilizada como honeypot para análisis de seguridad*

</div>

---

## 🎯 Propósito

Este proyecto funciona como **señuelo (honeypot)** deployado en un VPS para:

- 🔍 Detectar intentos de login maliciosos
- 📊 Analizar patrones de ataque
- 🔐 Registrar credenciales utilizadas por atacantes
- 🤖 Estudiar comportamientos de bots y scripts automatizados
- 📈 Generar datos para investigación en ciberseguridad

## ⚠️ Advertencia

**Este proyecto es para fines educativos y de investigación en seguridad.**

- Las contraseñas están en texto plano **intencionalmente** (característica del honeypot)
- Los logs capturan información sensible **por diseño**
- **NO usar en producción real** sin implementar seguridad robusta

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express.js** - Framework del servidor
- **SQLite3** - Base de datos ligera
- **JWT** - Tokens de autenticación
- **Sistema de Logging** - Captura de intentos de acceso

### Frontend
- **Vite** - Build tool moderno
- **JavaScript (ES6+)** - Lógica del cliente
- **CSS moderno** - Gradientes y animaciones
- **SPA** - Single Page Application

---

## 📂 Estructura del Proyecto

```
honeypot-coffee-project/
│
├── honeypot-backend/           # API REST + Database
│   ├── server.js              # Servidor Express
│   ├── package.json           # Dependencias backend
│   ├── access.log            # 📝 Log de todos los accesos
│   └── login_attempts.log    # 🔍 Log de intentos de login
│
└── honeypot-frontend/         # Interfaz web
    ├── src/
    │   ├── main.js           # Lógica del frontend
    │   ├── style.css         # Estilos
    │   └── counter.js        # Utilidades
    ├── index.html            # Punto de entrada
    └── package.json          # Dependencias frontend
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

| Email | Password | Nombre |
|-------|----------|--------|
| alex@dev.io | pass123 | Alex Developer |
| maria@art.com | artista456 | María Artista |
| carlos@music.net | guitarra789 | Carlos Música |

---

## 📊 Sistema de Logging

### access.log
Captura **TODOS** los accesos HTTP:
```json
{
  "timestamp": "2025-10-26T12:00:00.000Z",
  "method": "GET",
  "url": "/api/creators",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### login_attempts.log (HONEYPOT)
Captura **TODOS** los intentos de login:
```json
{
  "timestamp": "2025-10-26T12:05:00.000Z",
  "type": "LOGIN_ATTEMPT",
  "email_attempted": "admin@example.com",
  "password_attempted": "password123",
  "ip": "203.0.113.42",
  "userAgent": "curl/7.68.0"
}
```

> **💡 Nota:** Los logs incluyen contraseñas **intencionalmente** para análisis del honeypot

---

## 🔐 Características de Seguridad (Honeypot)

### ✅ Implementadas
- ✓ Logging exhaustivo de todos los intentos
- ✓ Captura de credenciales (honeypot)
- ✓ Registro de IPs y User-Agents
- ✓ Sistema de autenticación JWT funcional
- ✓ Base de datos SQLite auto-generada

### ❌ Intencionalmente Vulnerables
- ✗ Contraseñas en texto plano (para el honeypot)
- ✗ Sin rate limiting (permite análisis de bots)
- ✗ Sin CAPTCHA (facilita interacción automatizada)
- ✗ Mensajes de error específicos (información para atacantes)

---

## 📡 API Endpoints

### Públicos
```
GET  /api/stats                    # Estadísticas globales
GET  /api/creators                 # Lista de creadores
GET  /api/creator/:username        # Perfil de creador
GET  /api/creator/:username/coffees # Cafés recibidos
POST /api/coffee                   # Enviar un café
```

### Protegidos (JWT)
```
POST /api/login                    # Login (HONEYPOT)
GET  /api/dashboard/my-coffees     # Dashboard del creador
```

---

## 🐳 Deploy en VPS (DigitalOcean)

### Opción 1: Manual

```bash
# En el VPS
git clone https://github.com/jorcidesign/honeypot-coffee-project.git
cd honeypot-coffee-project

# Backend
cd honeypot-backend
npm install
pm2 start server.js --name honeypot-backend

# Frontend (build)
cd ../honeypot-frontend
npm install
npm run build

# Servir con Nginx
sudo cp -r dist/* /var/www/html/
```

### Opción 2: Con Docker (Recomendado)

```dockerfile
# Dockerfile para backend
FROM node:18-alpine
WORKDIR /app
COPY honeypot-backend/package*.json ./
RUN npm install
COPY honeypot-backend/ .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 📊 Análisis de Datos

### Ver logs en tiempo real:
```bash
# Accesos generales
tail -f honeypot-backend/access.log

# Intentos de login
tail -f honeypot-backend/login_attempts.log

# Filtrar intentos fallidos
grep "Credenciales incorrectas" honeypot-backend/login_attempts.log | wc -l
```

### Análisis de patrones:
```bash
# IPs más activas
cat access.log | jq -r '.ip' | sort | uniq -c | sort -nr | head -10

# Emails más intentados
cat login_attempts.log | jq -r '.email_attempted' | sort | uniq -c | sort -nr
```

---

## 🎓 Casos de Uso Educativos

1. **Análisis de Credential Stuffing**
   - Observar intentos con listas de contraseñas comunes
   
2. **Detección de Bots**
   - Identificar User-Agents sospechosos
   
3. **Patrones de Ataque**
   - Estudiar horarios y frecuencias de intentos
   
4. **Geolocalización de Amenazas**
   - Mapear orígenes de intentos maliciosos

---

## 📈 Métricas del Honeypot

El sistema trackea:
- ✓ Total de intentos de login
- ✓ Ratio de éxito/fallo
- ✓ Credenciales más utilizadas
- ✓ Patrones temporales
- ✓ Distribución geográfica de IPs

---

## 🔄 Actualizaciones

```bash
git pull origin main
cd honeypot-backend && npm install
pm2 restart honeypot-backend
```

---

## 🤝 Contribuciones

Este es un proyecto educativo. Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/mejora`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la branch (`git push origin feature/mejora`)
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
- Comunidad de ciberseguridad y honeypots
- Express.js y el ecosistema Node.js

---

<div align="center">

**⚠️ Usar con responsabilidad ⚠️**

*Este honeypot es para investigación educativa en ciberseguridad*

</div>