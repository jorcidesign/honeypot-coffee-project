// --- CONFIGURACIÓN Y ESTADO ---
const API_BASE_URL = 'http://localhost:3000';
let currentCreator = null;
let selectedCoffees = 1;
let authToken = null; // NUEVO: Token de autenticación
let currentUser = null; // NUEVO: Datos del usuario logueado

// --- FUNCIONES DE AUTENTICACIÓN ---

// Cargar estado de autenticación al iniciar
function loadAuthState() {
    authToken = localStorage.getItem('authToken');
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    updateUIForAuthState();
}

// Actualizar UI según estado de autenticación
function updateUIForAuthState() {
    const nav = document.querySelector('nav');
    
    // Remover todos los botones dinámicos anteriores
    const existingAuthBtn = document.getElementById('auth-btn');
    const existingLogoutBtn = document.getElementById('logout-btn');
    
    if (existingAuthBtn) {
        existingAuthBtn.remove();
    }
    if (existingLogoutBtn) {
        existingLogoutBtn.remove();
    }
    
    if (authToken && currentUser) {
        // Usuario autenticado - mostrar dashboard y logout
        const authBtn = document.createElement('button');
        authBtn.id = 'auth-btn';
        authBtn.textContent = `Dashboard (${currentUser.username})`;
        authBtn.onclick = loadCreatorDashboard;
        
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = 'Cerrar Sesión';
        logoutBtn.onclick = logout;
        
        nav.appendChild(authBtn);
        nav.appendChild(logoutBtn);
    } else {
        // Usuario no autenticado - mostrar login
        const authBtn = document.createElement('button');
        authBtn.id = 'auth-btn';
        authBtn.textContent = 'Login Creador';
        authBtn.onclick = () => document.getElementById('loginModal').style.display = 'block';
        
        nav.appendChild(authBtn);
    }
}

// Intentar login
async function attemptLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            errorEl.textContent = result.error || 'Credenciales incorrectas';
            errorEl.style.display = 'block';
        } else {
            // Guardar token y usuario en localStorage
            authToken = result.token;
            currentUser = {
                username: result.username,
                email: email
            };
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            errorEl.style.display = 'none';
            closeLoginModal();
            
            // Actualizar UI y cargar dashboard
            updateUIForAuthState();
            loadCreatorDashboard();
        }
    } catch (error) {
        errorEl.textContent = 'Error de conexión con el servidor.';
        errorEl.style.display = 'block';
    }
}

// Cerrar sesión
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateUIForAuthState();
    loadHomePage();
}

// Cerrar modal de login
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').style.display = 'none';
}

// --- DASHBOARD DEL CREADOR ---

async function loadCreatorDashboard() {
    if (!authToken) {
        alert('Debes iniciar sesión primero');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/my-coffees`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token inválido o expirado
                logout();
                alert('Sesión expirada. Por favor inicia sesión nuevamente.');
                return;
            }
            throw new Error('Error al cargar el dashboard');
        }
        
        const coffees = await response.json();
        
        // Calcular estadísticas
        const totalCoffees = coffees.reduce((sum, c) => sum + c.coffee_count, 0);
        const totalSupporters = new Set(coffees.map(c => c.supporter_name)).size;
        
        document.getElementById('app-content').innerHTML = `
            <div class="dashboard">
                <h1>Dashboard de ${currentUser.username}</h1>
                <p style="color: #666; margin-bottom: 2rem;">Gestiona tus apoyos recibidos</p>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <h3>${coffees.length}</h3>
                        <p>Total Mensajes</p>
                    </div>
                    <div class="stat-item">
                        <h3>${totalCoffees}</h3>
                        <p>Cafés Recibidos</p>
                    </div>
                    <div class="stat-item">
                        <h3>${totalSupporters}</h3>
                        <p>Seguidores Únicos</p>
                    </div>
                </div>
                
                <h2 style="margin-top: 2rem; margin-bottom: 1rem;">Mensajes de Apoyo</h2>
                <div class="coffees-list">
                    ${coffees.length > 0 ? coffees.map(coffee => `
                        <div class="coffee-item">
                            <div class="coffee-header">
                                <span class="coffee-supporter">${escapeHtml(coffee.supporter_name)}</span>
                                <span class="coffee-count">☕ x${coffee.coffee_count}</span>
                            </div>
                            ${coffee.message ? `<div class="coffee-message">${escapeHtml(coffee.message)}</div>` : ''}
                            <div class="coffee-date">${formatDate(coffee.created_at)}</div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: #999;">Aún no has recibido mensajes de apoyo</p>'}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        document.getElementById('app-content').innerHTML = `
            <div class="error-message" style="display: block;">
                Error al cargar el dashboard. Por favor, intenta más tarde.
            </div>
        `;
    }
}

// --- FUNCIONES PRINCIPALES ---

// Cargar página de inicio
async function loadHomePage() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        if (!response.ok) throw new Error('Network response was not ok');
        const stats = await response.json();

        document.getElementById('app-content').innerHTML = `
            <div class="stats">
                <h1>Apoya a tus creadores favoritos con un café ☕</h1>
                <p style="margin-top: 1rem; color: #666;">
                    Una plataforma simple para mostrar tu apoyo a creadores de contenido
                </p>
                <div class="stats-grid">
                    <div class="stat-item">
                        <h3>${stats.total_creators || 0}</h3>
                        <p>Creadores</p>
                    </div>
                    <div class="stat-item">
                        <h3>${stats.total_coffees || 0}</h3>
                        <p>Apoyos</p>
                    </div>
                    <div class="stat-item">
                        <h3>${stats.total_coffee_count || 0}</h3>
                        <p>Cafés enviados</p>
                    </div>
                </div>
            </div>
            <h2 style="text-align: center; color: white; margin-bottom: 1rem;">
                Creadores Destacados
            </h2>
            <div id="creators-list"></div>
        `;

        await loadCreators(true);
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        document.getElementById('app-content').innerHTML = `
             <div class="stats">
                <h1>Apoya a tus creadores favoritos con un café ☕</h1>
                <p style="margin-top: 1rem; color: #666;">
                    Una plataforma simple para mostrar tu apoyo a creadores de contenido
                </p>
             </div>
             <h2 style="text-align: center; color: white; margin-bottom: 1rem;">
                Creadores Destacados
            </h2>
            <div id="creators-list"></div>
        `;
        await loadCreators(true);
    }
}

// Cargar lista de creadores
async function loadCreators(embedded = false) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/creators`);
        if (!response.ok) throw new Error('Network response was not ok');
        const creators = await response.json();

        const creatorsHTML = `
            <div class="creators-grid">
                ${creators.map(creator => `
                    <div class="creator-card" data-username="${creator.username}">
                        <div class="creator-avatar">
                            ${creator.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div class="creator-name">${creator.display_name}</div>
                        <div class="creator-bio">${creator.bio || 'Creador de contenido'}</div>
                    </div>
                `).join('')}
            </div>
        `;

        const targetElement = embedded ? document.getElementById('creators-list') : document.getElementById('app-content');

        if (embedded) {
            targetElement.innerHTML = creatorsHTML;
        } else {
            targetElement.innerHTML = `
                <h1 style="text-align: center; color: white; margin-bottom: 1rem;">
                    Nuestros Creadores
                </h1>
                ${creatorsHTML}
            `;
        }
        
        document.querySelectorAll('.creator-card').forEach(card => {
            card.addEventListener('click', () => openCreatorProfile(card.dataset.username));
        });

    } catch (error) {
        console.error('Error cargando creadores:', error);
        document.getElementById('app-content').innerHTML = `
            <div class="error-message" style="display: block;">
                Error al cargar los creadores. Por favor, intenta más tarde.
            </div>
        `;
    }
}

// Abrir perfil de creador
async function openCreatorProfile(username) {
    try {
        const [creatorResponse, coffeesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/creator/${username}`),
            fetch(`${API_BASE_URL}/api/creator/${username}/coffees`)
        ]);

        if (!creatorResponse.ok || !coffeesResponse.ok) {
             throw new Error('Failed to load creator data');
        }

        const creator = await creatorResponse.json();
        const coffees = await coffeesResponse.json();

        currentCreator = creator;
        selectedCoffees = 1;

        document.getElementById('modal-body').innerHTML = `
            <div class="creator-profile">
                <div class="avatar">
                    ${creator.display_name.charAt(0).toUpperCase()}
                </div>
                <h2>${creator.display_name}</h2>
                <p style="color: #666;">@${creator.username}</p>
                <p style="margin-top: 1rem;">${creator.bio || 'Creador de contenido'}</p>
            </div>

            <div class="coffee-form">
                <h3>☕ Enviar un café</h3>
                <div id="success-message" class="success-message"></div>
                <div id="error-message" class="error-message"></div>
                <form id="coffee-form">
                    <div class="form-group">
                        <label for="supporter_name">Tu nombre</label>
                        <input type="text" id="supporter_name" placeholder="Anónimo">
                    </div>
                    <div class="form-group">
                        <label>Número de cafés</label>
                        <div class="coffee-selector">
                            <div class="coffee-option selected" data-count="1">☕ x1</div>
                            <div class="coffee-option" data-count="3">☕ x3</div>
                            <div class="coffee-option" data-count="5">☕ x5</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="message">Mensaje (opcional)</label>
                        <textarea id="message" placeholder="Escribe un mensaje de apoyo..."></textarea>
                    </div>
                    <button type="submit" class="submit-btn">
                        Enviar 1 café
                    </button>
                </form>
            </div>

            <div>
                <h3 style="margin-bottom: 1rem;">Mensajes de apoyo</h3>
                <div class="coffees-list">
                    ${coffees.length > 0 ? coffees.map(coffee => `
                        <div class="coffee-item">
                            <div class="coffee-header">
                                <span class="coffee-supporter">${escapeHtml(coffee.supporter_name)}</span>
                                <span class="coffee-count">☕ x${coffee.coffee_count}</span>
                            </div>
                            ${coffee.message ? `<div class="coffee-message">${escapeHtml(coffee.message)}</div>` : ''}
                            <div class="coffee-date">${formatDate(coffee.created_at)}</div>
                        </div>
                    `).join('') : '<p style="text-align: center; color: #999;">Aún no hay mensajes de apoyo</p>'}
                </div>
            </div>
        `;

        document.getElementById('creatorModal').style.display = 'block';
        addModalEventListeners();

    } catch (error) {
        console.error('Error cargando perfil:', error);
        alert('Error al cargar el perfil del creador');
    }
}

// --- MANEJO DE EVENTOS ---

function addModalEventListeners() {
    document.getElementById('coffee-form').addEventListener('submit', sendCoffee);
    
    document.querySelectorAll('.coffee-option').forEach(option => {
        option.addEventListener('click', (event) => {
            selectCoffees(parseInt(event.currentTarget.dataset.count), event.currentTarget);
        });
    });
}

function selectCoffees(count, element) {
    selectedCoffees = count;
    document.querySelectorAll('.coffee-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    document.querySelector('.submit-btn').textContent = `Enviar ${count} ${count === 1 ? 'café' : 'cafés'}`;
}

async function sendCoffee(event) {
    event.preventDefault();
    const supporterNameInput = document.getElementById('supporter_name');

    const formData = {
        creator_username: currentCreator.username,
        supporter_name: supporterNameInput.value.trim() === '' ? 'Anónimo' : supporterNameInput.value,
        message: document.getElementById('message').value,
        coffee_count: selectedCoffees
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/coffee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            const successMsg = document.getElementById('success-message');
            successMsg.textContent = '¡Café enviado con éxito! Gracias por tu apoyo.';
            successMsg.style.display = 'block';
            document.getElementById('error-message').style.display = 'none';

            document.getElementById('coffee-form').reset();

            setTimeout(() => {
                openCreatorProfile(currentCreator.username);
            }, 2000);
        } else {
            throw new Error(result.error || 'Error al enviar el café');
        }
    } catch (error) {
        const errorMsg = document.getElementById('error-message');
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
        document.getElementById('success-message').style.display = 'none';
    }
}

function closeModal() {
    document.getElementById('creatorModal').style.display = 'none';
}

// --- UTILIDADES ---

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- EXPONER FUNCIONES GLOBALMENTE PARA EL HTML ---
window.attemptLogin = attemptLogin;
window.closeLoginModal = closeLoginModal;

// --- INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Cargar estado de autenticación
    loadAuthState();
    
    // Asignar eventos a elementos estáticos
    document.getElementById('logo-btn').addEventListener('click', loadHomePage);
    document.getElementById('home-btn').addEventListener('click', loadHomePage);
    document.getElementById('creators-btn').addEventListener('click', () => loadCreators(false));
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    
    // Event listeners para el modal de login
    document.getElementById('close-login-modal-btn').addEventListener('click', closeLoginModal);
    document.getElementById('login-form').addEventListener('submit', attemptLogin);

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (event) => {
        const creatorModal = document.getElementById('creatorModal');
        const loginModal = document.getElementById('loginModal');
        
        if (event.target == creatorModal) {
            closeModal();
        }
        if (event.target == loginModal) {
            closeLoginModal();
        }
    });

    // Carga inicial
    loadHomePage();
});