// --- ACTION REQUIRED: PASTE YOUR CLIENT ID HERE ---
const GOOGLE_CLIENT_ID = "950667770576-co9jsdsr5ic6a02kam05hjfg6q2hhvd2.apps.googleusercontent.com";

// DOM Elements
const productGrid = document.getElementById('product-grid');
const authBtn = document.getElementById('auth-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
const loginModal = document.getElementById('login-modal');
const closeLoginBtn = document.getElementById('close-login');
const loginStatus = document.getElementById('login-status');

function init() {
    renderFeatures();
    checkAuthStatus();
    setupEventListeners();
}

function renderFeatures() {
    productGrid.innerHTML = products.map(feat => `
        <div class="card">
            <div class="card-icon">${feat.icon}</div>
            <h4>${feat.title}</h4>
            <p>${feat.desc}</p>
            <div class="card-link">View Documentation →</div>
        </div>
    `).join('');
}

function checkAuthStatus() {
    const token = localStorage.getItem('stitchd_token'); 
    const userStr = localStorage.getItem('stitchd_user');
    
    if (token && userStr) {
        const user = JSON.parse(userStr);
        authBtn.style.display = 'none';
        dashboardBtn.style.display = 'block';
        dashboardBtn.innerText = `Console (${user.name})`;
    } else {
        authBtn.style.display = 'block';
        dashboardBtn.style.display = 'none';
    }
}

// Called automatically by Google when the user successfully signs in
async function handleCredentialResponse(response) {
    try {
        loginStatus.innerHTML = `> Authenticating with server...`;
        loginStatus.style.display = "block";
        loginStatus.style.color = "#4ade80";

        // Send Google's JWT to our backend to verify and exchange for our own JWT
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });

        const data = await res.json();
        
        if (data.token) {
            localStorage.setItem('stitchd_token', data.token);
            localStorage.setItem('stitchd_user', JSON.stringify(data.user));
            
            loginStatus.innerHTML = `> status: 200 OK<br>> token_issued: true<br>> role: ${data.user.role}<br>> redirecting to secure console...`;
            
            setTimeout(() => {
                loginModal.classList.remove('open');
                checkAuthStatus();
                loginStatus.style.display = "none";
            }, 2000);
        } else {
            throw new Error("Server verification failed");
        }
    } catch (error) {
        console.error("Login failed:", error);
        loginStatus.innerHTML = `> ERR_CONNECTION_REFUSED<br>> Could not verify Google Token`;
        loginStatus.style.color = "#ef4444";
    }
}

function setupEventListeners() {
    // Initialize Google Identity Services
    window.onload = function () {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse
        });
        
        // Render the official Google button inside our modal
        google.accounts.id.renderButton(
            document.getElementById("google-btn-container"),
            { theme: "filled_black", size: "large", width: 335 }
        );
    };

    // Login Modal Toggles
    authBtn.addEventListener('click', () => loginModal.classList.add('open'));
    closeLoginBtn.addEventListener('click', () => loginModal.classList.remove('open'));
    
    // Clicking outside modal closes it
    loginModal.addEventListener('click', (e) => {
        if(e.target === loginModal) loginModal.classList.remove('open');
    });

    // Logout
    dashboardBtn.addEventListener('click', () => {
        if(confirm("Logout from NexusKits Console?")) {
            localStorage.removeItem('stitchd_token');
            localStorage.removeItem('stitchd_user');
            checkAuthStatus();
            google.accounts.id.disableAutoSelect(); // Optional: revoke Google session
        }
    });

    // Copy command
    document.querySelector('.copy-btn').addEventListener('click', function() {
        this.innerText = "Copied!";
        setTimeout(() => this.innerText = "Copy", 2000);
    });

    // Scroll Reveal Animation Logic
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(section => {
        observer.observe(section);
    });
}

// Boot
init();