// ===============================================
// INTERCEPTOR GLOBAL CON MANEJO DE SESIÓN
// ===============================================

/**
 * Verifica si el token está próximo a expirar (menos de 7 días)
 * y alerta al usuario para que renueve su sesión
 */
function verificarProximaExpiracion(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const tiempoRestante = payload.exp - (Date.now() / 1000);
    const diasRestantes = Math.floor(tiempoRestante / (24 * 60 * 60));
    
    // Si quedan menos de 7 días, mostrar notificación amigable
    if (diasRestantes > 0 && diasRestantes <= 7) {
      const ultimaAlerta = localStorage.getItem('ultimaAlertaExpiracion');
      const hoy = new Date().toDateString();
      
      // Solo mostrar una vez al día
      if (ultimaAlerta !== hoy) {
        console.warn(`Tu sesión expirará en ${diasRestantes} días`);
        localStorage.setItem('ultimaAlertaExpiracion', hoy);
        
        // Notificación visual sutil (opcional)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('ProBarberSystem', {
            body: `Tu sesión expirará en ${diasRestantes} días. Considera volver a iniciar sesión.`,
            icon: '/images/icon-192.png'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error verificando expiración:', error);
  }
}

/**
 * Función principal para hacer peticiones autenticadas
 */
async function fetchConAuth(url, options = {}) {
  const token = localStorage.getItem("jwtToken");
  
  // Si no hay token, redirigir a login
  if (!token) {
    console.warn('No hay token, redirigiendo a login');
    alert("Debes iniciar sesión primero");
    window.location.href = "login.html";
    return null;
  }
  
  // Verificar proximidad de expiración
  verificarProximaExpiracion(token);
  
  // Añadir token a los headers
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': options.headers?.['Content-Type'] || 'application/json'
  };
  
  try {
    const res = await fetch(url, options);
    
    // Manejo de token expirado o inválido
    if (res.status === 401) {
      console.error('Token expirado o inválido');
      
      // Limpiar datos de sesión
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("usuarioNombre");
      localStorage.removeItem("reserva");
      localStorage.removeItem("ultimaAlertaExpiracion");
      
      // Mensaje claro al usuario
      alert(
        "Tu sesión ha expirado por inactividad.\n\n" +
        "Por seguridad, debes iniciar sesión nuevamente.\n\n" +
        "Tus datos están seguros."
      );
      
      window.location.href = "login.html";
      return null;
    }
    
    // Manejo de errores de servidor
    if (!res.ok && res.status >= 500) {
      console.error('Error del servidor:', res.status);
      alert(
        "Error del servidor.\n\n" +
        "Por favor, inténtalo de nuevo en unos momentos."
      );
      return null;
    }
    
    return res;
    
  } catch (error) {
    console.error('Error de conexión:', error);
    
    // Diferenciar entre error de red y otros errores
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      alert(
        "Error de conexión.\n\n" +
        "Verifica tu conexión a internet e inténtalo de nuevo."
      );
    } else {
      alert("Error inesperado. Por favor, inténtalo de nuevo.");
    }
    
    return null;
  }
}

/**
 * Verifica si hay sesión activa al cargar cualquier página protegida
 */
function verificarSesionActiva() {
  const token = localStorage.getItem("jwtToken");
  const paginasPublicas = ['home.html', 'login.html', 'register.html'];
  const paginaActual = window.location.pathname.split('/').pop();
  
  // Si es una página pública, no hacer nada
  if (paginasPublicas.includes(paginaActual)) {
    return true;
  }
  
  // Si no hay token en página protegida, redirigir
  if (!token) {
    console.warn('Acceso no autorizado a página protegida');
    alert("Debes iniciar sesión para acceder a esta página");
    window.location.href = "login.html";
    return false;
  }
  
  // Verificar si el token está expirado
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const ahora = Date.now() / 1000;
    
    if (payload.exp < ahora) {
      console.error('Token expirado detectado');
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("usuarioNombre");
      localStorage.removeItem("reserva");
      
      alert(
        "Tu sesión ha expirado.\n\n" +
        "Por favor, inicia sesión nuevamente."
      );
      
      window.location.href = "login.html";
      return false;
    }
    
    console.log('Sesión válida');
    return true;
    
  } catch (error) {
    console.error('Token corrupto:', error);
    localStorage.removeItem("jwtToken");
    alert("Error de sesión. Por favor, inicia sesión nuevamente.");
    window.location.href = "login.html";
    return false;
  }
}

// ===============================================
// EXPORTAR FUNCIONES
// ===============================================

// Verificar sesión automáticamente al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  verificarSesionActiva();
});

// Hacer disponibles globalmente
window.fetchConAuth = fetchConAuth;
window.verificarSesionActiva = verificarSesionActiva;