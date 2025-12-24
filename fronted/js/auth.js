// Crear interceptor global en un nuevo archivo auth.js
async function fetchConAuth(url, options = {}) {
  const token = localStorage.getItem("jwtToken");
  
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  const res = await fetch(url, options);
  
  // Si el token expiró, redirigir a login
  if (res.status === 401) {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("usuarioNombre");
    alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
    window.location.href = "login.html";
    return null;
  }
  
  return res;
}

// Usar en lugar de fetch normal:
// const res = await fetchConAuth(`${backendURL}?action=mis_citas`);