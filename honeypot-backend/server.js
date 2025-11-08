const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'miclavesecretaparaelhoneypot123';

// === MAPA DE REQUESTS PARA RATE LIMITING ===
const requestCounts = new Map();

// Middleware
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("Error abriendo la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
    }
});

// Crear tablas si no existen
db.serialize(() => {
    
    db.run(`CREATE TABLE IF NOT EXISTS creators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        bio TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS coffees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creator_id INTEGER NOT NULL,
        supporter_name TEXT NOT NULL,
        message TEXT,
        coffee_count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES creators(id)
    )`);

    db.get("SELECT COUNT(*) as count FROM creators", (err, row) => {
        if (row && row.count === 0) {
            const creators = [
                ['alex_dev', 'Alex Developer', 'Creando contenido sobre programación y ciberseguridad.', 'alex@dev.io', 'pass123'],
                ['maria_art', 'María Artista', 'Ilustradora digital y diseñadora gráfica.', 'maria@art.com', 'artista456'],
                ['carlos_music', 'Carlos Música', 'Compositor y productor musical independiente.', 'carlos@music.net', 'guitarra789']
            ];
            
            const stmt = db.prepare("INSERT INTO creators (username, display_name, bio, email, password) VALUES (?, ?, ?, ?, ?)");
            creators.forEach(creator => {
                stmt.run(creator);
            });
            stmt.finalize();
            console.log("Creadores de ejemplo insertados con email y password.");
        }
    });
});

// === FUNCIONES DE DETECCIÓN DE ATAQUES ===

// Detectar SQL Injection
function detectSQLInjection(input) {
    const sqlPatterns = [
        "' OR '1'='1",
        "' OR 1=1--",
        "admin'--",
        "' UNION SELECT",
        "'; DROP TABLE",
        "' OR 'a'='a",
        "1' OR '1' = '1",
        "OR 1=1",
        "' OR ''='",
        "1' AND '1'='1",
        "' OR '1'='1' --",
        "' OR '1'='1' /*",
        "' OR '1'='1' #",
        "1' OR '1'='1",
        "admin' #",
        "admin' /*",
        "' UNION ALL SELECT",
        "' AND 1=1--",
        "' AND 'a'='a"
    ];
    
    const combinedInput = String(input).toLowerCase();
    
    for (let pattern of sqlPatterns) {
        if (combinedInput.includes(pattern.toLowerCase())) {
            return {
                detected: true,
                pattern: pattern,
                severity: 'HIGH'
            };
        }
    }
    
    return { detected: false };
}

// Detectar XSS
function detectXSS(input) {
    const xssPatterns = [
        '<script',
        'javascript:',
        'onerror=',
        'onload=',
        '<iframe',
        '<img src=x onerror=',
        '<svg',
        'onclick=',
        'onmouseover=',
        '<body onload=',
        'eval(',
        'alert(',
        'prompt(',
        'confirm('
    ];
    
    const combinedInput = String(input).toLowerCase();
    
    for (let pattern of xssPatterns) {
        if (combinedInput.includes(pattern)) {
            return {
                detected: true,
                pattern: pattern,
                severity: 'HIGH'
            };
        }
    }
    
    return { detected: false };
}

// Detectar Path Traversal
function detectPathTraversal(url) {
    const pathPatterns = [
        '../',
        '..\\',
        '/etc/passwd',
        '/etc/shadow',
        'C:\\Windows\\',
        '%2e%2e%2f',
        '..%2F',
        '%252e%252e%252f',
        'etc/passwd',
        'etc/shadow'
    ];
    
    const decodedUrl = decodeURIComponent(url).toLowerCase();
    
    for (let pattern of pathPatterns) {
        if (decodedUrl.includes(pattern.toLowerCase())) {
            return {
                detected: true,
                pattern: pattern,
                severity: 'CRITICAL'
            };
        }
    }
    
    return { detected: false };
}

// === MIDDLEWARE DE LOGGING AVANZADO ===
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const now = Date.now();
    
    // Logging básico de acceso
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer') || 'direct'
    };
    fs.appendFileSync('access.log', JSON.stringify(logEntry) + '\n');
    console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - ${ip}`);
    
    // Detección de Path Traversal
    const pathTraversal = detectPathTraversal(req.url);
    if (pathTraversal.detected) {
        const attackLog = {
            timestamp: new Date().toISOString(),
            type: 'PATH_TRAVERSAL_ATTEMPT',
            severity: pathTraversal.severity,
            ip: ip,
            url: req.url,
            pattern: pathTraversal.pattern,
            userAgent: req.get('User-Agent'),
            method: req.method
        };
        fs.appendFileSync('path_traversal_attempts.log', JSON.stringify(attackLog) + '\n');
        console.log(`⚠️  PATH TRAVERSAL DETECTED from ${ip}: ${pathTraversal.pattern}`);
    }
    
    // Rate Limiting Detection
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    const recentRequests = requests.filter(time => now - time < 60000);
    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    
    if (recentRequests.length > 50) {
        const attackLog = {
            timestamp: new Date().toISOString(),
            type: 'RATE_LIMIT_EXCEEDED',
            severity: 'MEDIUM',
            ip: ip,
            requests_per_minute: recentRequests.length,
            url: req.url,
            method: req.method,
            userAgent: req.get('User-Agent')
        };
        fs.appendFileSync('rate_limit_attacks.log', JSON.stringify(attackLog) + '\n');
        console.log(`⚠️  RATE LIMIT EXCEEDED from ${ip}: ${recentRequests.length} requests/min`);
    }
    
    next();
});

// === MIDDLEWARE DE AUTENTICACIÓN ===
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// === RUTAS API ===

// Obtener lista de creadores
app.get('/api/creators', (req, res) => {
    db.all("SELECT id, username, display_name, bio, created_at FROM creators ORDER BY created_at DESC", (err, creators) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(creators);
    });
});

// Obtener perfil de un creador específico
app.get('/api/creator/:username', (req, res) => {
    // Detección de SQL Injection en parámetros de URL
    const sqliCheck = detectSQLInjection(req.params.username);
    if (sqliCheck.detected) {
        const attackLog = {
            timestamp: new Date().toISOString(),
            type: 'SQL_INJECTION_URL_PARAM',
            severity: sqliCheck.severity,
            ip: req.ip,
            parameter: 'username',
            value: req.params.username,
            pattern: sqliCheck.pattern,
            userAgent: req.get('User-Agent')
        };
        fs.appendFileSync('sql_injection_attempts.log', JSON.stringify(attackLog) + '\n');
        console.log(`⚠️  SQL INJECTION ATTEMPT from ${req.ip}: ${sqliCheck.pattern}`);
    }
    
    db.get("SELECT id, username, display_name, bio, email, created_at FROM creators WHERE username = ?", [req.params.username], (err, creator) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!creator) return res.status(404).json({ error: 'Creador no encontrado' });
        res.json(creator);
    });
});

// Obtener cafés/mensajes de un creador
app.get('/api/creator/:username/coffees', (req, res) => {
    const query = `
        SELECT c.supporter_name, c.message, c.coffee_count, c.created_at
        FROM coffees c
        JOIN creators cr ON c.creator_id = cr.id
        WHERE cr.username = ?
        ORDER BY c.created_at DESC
        LIMIT 50`;
    db.all(query, [req.params.username], (err, coffees) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(coffees);
    });
});

// Enviar un café (con detección de XSS)
app.post('/api/coffee', (req, res) => {
    const { creator_username, supporter_name, message, coffee_count } = req.body;
    
    // Detección de XSS en los campos
    const xssCheckName = detectXSS(supporter_name);
    const xssCheckMessage = detectXSS(message);
    
    if (xssCheckName.detected || xssCheckMessage.detected) {
        const attackLog = {
            timestamp: new Date().toISOString(),
            type: 'XSS_ATTEMPT',
            severity: 'HIGH',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            payload: {
                supporter_name: supporter_name,
                message: message
            },
            pattern_detected: xssCheckName.detected ? xssCheckName.pattern : xssCheckMessage.pattern,
            field: xssCheckName.detected ? 'supporter_name' : 'message'
        };
        fs.appendFileSync('xss_attempts.log', JSON.stringify(attackLog) + '\n');
        console.log(`⚠️  XSS ATTEMPT from ${req.ip}: ${attackLog.pattern_detected}`);
    }
    
    if (!creator_username || !supporter_name) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    db.get("SELECT id FROM creators WHERE username = ?", [creator_username], (err, creator) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!creator) return res.status(404).json({ error: 'Creador no encontrado' });
        
        const coffeeCount = parseInt(coffee_count) || 1;
        const query = "INSERT INTO coffees (creator_id, supporter_name, message, coffee_count) VALUES (?, ?, ?, ?)";
        db.run(query, [creator.id, supporter_name, message || '', coffeeCount], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ success: true, message: '¡Café enviado con éxito!', coffee_id: this.lastID });
        });
    });
});

// Estadísticas
app.get('/api/stats', (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM creators) as total_creators,
            (SELECT COUNT(*) FROM coffees) as total_coffees,
            (SELECT SUM(coffee_count) FROM coffees) as total_coffee_count`;
    db.get(query, (err, stats) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(stats);
    });
});

// === RUTA DE LOGIN (HONEYPOT MEJORADO) ===
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    // Detección de SQL Injection en login
    const sqliCheckEmail = detectSQLInjection(email);
    const sqliCheckPassword = detectSQLInjection(password);
    
    // Log completo del honeypot
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'LOGIN_ATTEMPT',
        ip: ip,
        email_attempted: email,
        password_attempted: password,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer') || 'direct',
        sql_injection_detected: sqliCheckEmail.detected || sqliCheckPassword.detected,
        sql_injection_details: {
            email: sqliCheckEmail,
            password: sqliCheckPassword
        }
    };
    fs.appendFileSync('login_attempts.log', JSON.stringify(logEntry) + '\n');
    
    // Si se detectó SQL Injection, log adicional
    if (sqliCheckEmail.detected || sqliCheckPassword.detected) {
        const attackLog = {
            timestamp: new Date().toISOString(),
            type: 'SQL_INJECTION_LOGIN',
            severity: 'CRITICAL',
            ip: ip,
            email_attempted: email,
            password_attempted: password,
            pattern: sqliCheckEmail.detected ? sqliCheckEmail.pattern : sqliCheckPassword.pattern,
            field: sqliCheckEmail.detected ? 'email' : 'password',
            userAgent: req.get('User-Agent')
        };
        fs.appendFileSync('sql_injection_attempts.log', JSON.stringify(attackLog) + '\n');
        console.log(`⚠️  SQL INJECTION LOGIN ATTEMPT from ${ip}: ${attackLog.pattern}`);
    }

    db.get("SELECT * FROM creators WHERE email = ?", [email], (err, creator) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        if (!creator) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        if (creator.password !== password) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: creator.id, username: creator.username, email: creator.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.json({ 
            success: true, 
            message: 'Login exitoso', 
            token: token,
            username: creator.display_name
        });
    });
});

// === RUTA PROTEGIDA PARA EL DASHBOARD ===
app.get('/api/dashboard/my-coffees', authenticateToken, (req, res) => {
    const creatorId = req.user.id; 

    const query = "SELECT * FROM coffees WHERE creator_id = ? ORDER BY created_at DESC";
    
    db.all(query, [creatorId], (err, coffees) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(coffees);
    });
});

// === NUEVA RUTA: ESTADÍSTICAS DE ATAQUES (PARA ANÁLISIS) ===
app.get('/api/security/stats', (req, res) => {
    const stats = {
        timestamp: new Date().toISOString(),
        login_attempts: 0,
        sql_injection_attempts: 0,
        xss_attempts: 0,
        path_traversal_attempts: 0,
        rate_limit_violations: 0
    };
    
    // Contar login attempts
    if (fs.existsSync('login_attempts.log')) {
        const loginLines = fs.readFileSync('login_attempts.log', 'utf-8').split('\n').filter(line => line.trim());
        stats.login_attempts = loginLines.length;
    }
    
    // Contar SQL injection
    if (fs.existsSync('sql_injection_attempts.log')) {
        const sqliLines = fs.readFileSync('sql_injection_attempts.log', 'utf-8').split('\n').filter(line => line.trim());
        stats.sql_injection_attempts = sqliLines.length;
    }
    
    // Contar XSS
    if (fs.existsSync('xss_attempts.log')) {
        const xssLines = fs.readFileSync('xss_attempts.log', 'utf-8').split('\n').filter(line => line.trim());
        stats.xss_attempts = xssLines.length;
    }
    
    // Contar Path Traversal
    if (fs.existsSync('path_traversal_attempts.log')) {
        const pathLines = fs.readFileSync('path_traversal_attempts.log', 'utf-8').split('\n').filter(line => line.trim());
        stats.path_traversal_attempts = pathLines.length;
    }
    
    // Contar Rate Limit
    if (fs.existsSync('rate_limit_attacks.log')) {
        const rateLines = fs.readFileSync('rate_limit_attacks.log', 'utf-8').split('\n').filter(line => line.trim());
        stats.rate_limit_violations = rateLines.length;
    }
    
    res.json(stats);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] 🚀 Servidor backend iniciado en http://localhost:${PORT}`);
    console.log(`[${new Date().toISOString()}] 🐝 Honeypot activo - Logging habilitado`);
});