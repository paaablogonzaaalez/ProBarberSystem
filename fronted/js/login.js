// ===============================================
// LOGIN CON REDIRECCIÓN POR ROL + DEBUG
// ===============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Login page cargada');
  
  const form = document.getElementById('loginForm');
  
  // Verificar si ya hay sesión activa
  const token = localStorage.getItem('jwtToken');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (payload.exp > Date.now() / 1000) {
        console.log('✅ Ya hay sesión activa, redirigiendo...');
        redirigirSegunRol(payload.data.rol);
        return;
      }
    } catch (error) {
      console.log('⚠️ Token inválido, limpiando...');
      localStorage.clear();
    }
  }
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      realizarLogin();
    });
  }
});

// ===============================================
// REALIZAR LOGIN CON DEBUG
// ===============================================
function realizarLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btnLogin = document.getElementById('btnLogin');
  
  if (!email || !password) {
    alert('⚠️ Por favor, completa todos los campos');
    return;
  }
  
  if (!email.includes('@')) {
    alert('⚠️ Email inválido');
    return;
  }
  
  if (btnLogin) {
    btnLogin.disabled = true;
    btnLogin.textContent = '⏳ Iniciando sesión...';
  }
  
  console.log('📤 Enviando credenciales...');
  console.log('📧 Email:', email);
  console.log('🔗 URL:', `${backendURL}?action=login`);
  
  fetch(`${backendURL}?action=login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => {
    console.log('📡 Respuesta recibida:', response.status);
    console.log('📋 Content-Type:', response.headers.get('content-type'));
    
    // 🔥 NUEVO: Capturar el texto completo para ver el error
    return response.text().then(text => {
      console.log('📄 Respuesta RAW del servidor:', text);
      
      // Intentar parsear como JSON
      try {
        const data = JSON.parse(text);
        return { ok: response.ok, data: data };
      } catch (e) {
        console.error('❌ No es JSON válido, es HTML/texto:', text.substring(0, 500));
        throw new Error('El servidor devolvió un error: ' + text.substring(0, 200));
      }
    });
  })
  .then(({ ok, data }) => {
    console.log('📦 Datos parseados:', data);
    
    if (!ok) {
      throw new Error(data.error || 'Error en el servidor');
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (!data.token) {
      throw new Error('No se recibió token del servidor');
    }
    
    // ✅ Guardar token y datos del usuario
    localStorage.setItem('jwtToken', data.token);
    localStorage.setItem('usuarioNombre', data.usuario.nombre);
    
    const payload = JSON.parse(atob(data.token.split('.')[1]));
    const rol = payload.data.rol || data.usuario.rol || 'usuario';
    
    console.log('✅ Login exitoso');
    console.log('👤 Usuario:', data.usuario.nombre);
    console.log('🔑 Rol detectado:', rol);
    
    redirigirSegunRol(rol);
    
  })
  .catch(error => {
    console.error('❌ Error en login:', error);
    alert(`❌ Error: ${error.message}`);
    
    if (btnLogin) {
      btnLogin.disabled = false;
      btnLogin.textContent = 'INICIAR SESIÓN';
    }
  });
}

// ===============================================
// REDIRECCIONAR SEGÚN ROL
// ===============================================
function redirigirSegunRol(rol) {
  console.log('🔀 Función redirigirSegunRol llamada');
  console.log('🔑 Rol recibido:', rol);
  
  if (rol === 'admin') {
    console.log('➡️ Admin detectado → Redirigiendo a panel_barbero.html');
    window.location.href = 'panel_barbero.html';
  } else {
    console.log('➡️ Usuario normal → Redirigiendo a mis_citas.html');
    window.location.href = 'mis_citas.html';
  }
}

console.log('✅ login.js cargado');