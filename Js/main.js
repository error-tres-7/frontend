/**
 * main.js - Lógica interactiva para la aplicación Barrio Popular
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initActionButtons();
});

/**
 * Gestiona el estado activo de los botones de navegación
 */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase activa de todos los botones
            navButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('nav-btn-primary');
            });

            // Asignar clase activa al botón clickeado
            button.classList.add('active');
            button.classList.add('nav-btn-primary');

            const sectionName = button.textContent.trim();
            showToast(`Navegando a: ${sectionName}`, 'bi-check2-circle');
        });
    });
}

/**
 * Inicializa las acciones de los botones de icono (derecha)
 */
function initActionButtons() {
    const btnStats = document.getElementById('btn-stats');
    const btnLogout = document.getElementById('btn-logout');

    if (btnStats) {
        btnStats.addEventListener('click', () => {
            showToast('Panel de Estadísticas abierto', 'bi-graph-up-arrow');
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            showToast('Sesión cerrada correctamente', 'bi-box-arrow-in-left');
        });
    }
}

/**
 * Muestra una notificación emergente estilizada en pantalla
 * @param {string} message - Texto de la notificación
 * @param {string} iconClass - Clase del icono de Bootstrap Icons
 */
function showToast(message, iconClass = 'bi-info-circle') {
    let toast = document.getElementById('toast-notification');

    // Crear el elemento si aún no existe en el DOM
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <i class="bi ${iconClass}"></i>
        <span>${message}</span>
    `;

    toast.classList.add('show');

    // Ocultar automáticamente tras 3 segundos
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
