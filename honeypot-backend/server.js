const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'miclavesecretaparaelhoneypot123';

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

// Logging middleware
app.use((req, res, next) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
    };
    fs.appendFileSync('access.log', JSON.stringify(logEntry) + '\n');
    console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - ${logEntry.ip}`);
    next();
});

// --- MIDDLEWARE DE AUTENTICACIÓN ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // CORREGIDO: era res.sentStatus(403)
        req.user = user;
        next();
    });
}

// --- RUTAS API ---

// Obtener lista de creadores
app.get('/api/creators', (req, res) => {
    db.all("SELECT id, username, display_name, bio, created_at FROM creators ORDER BY created_at DESC", (err, creators) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(creators);
    });
});

// Obtener perfil de un creador específico
app.get('/api/creator/:username', (req, res) => {
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

// Enviar un café
app.post('/api/coffee', (req, res) => {
    const { creator_username, supporter_name, message, coffee_count } = req.body;
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

// --- RUTA DE LOGIN (HONEYPOT) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Log del honeypot
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'LOGIN_ATTEMPT',
        email_attempted: email,
        password_attempted: password,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
    };
    fs.appendFileSync('login_attempts.log', JSON.stringify(logEntry) + '\n');

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

// --- RUTA PROTEGIDA PARA EL DASHBOARD ---
app.get('/api/dashboard/my-coffees', authenticateToken, (req, res) => {
    const creatorId = req.user.id; 

    const query = "SELECT * FROM coffees WHERE creator_id = ? ORDER BY created_at DESC";
    
    db.all(query, [creatorId], (err, coffees) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(coffees);
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Servidor backend iniciado en http://localhost:${PORT}`);
});