// ===============================================
// PANEL DEL BARBERO - LÓGICA
// ===============================================

// ✅ VERIFICAR QUE backendURL EXISTE
if (typeof backendURL === 'undefined') {
  console.error('❌ CRÍTICO: backendURL no está definido');
  alert('Error de configuración. Por favor, recarga la página.');
  throw new Error('backendURL is not defined');
}

console.log('✅ backendURL disponible:', backendURL);

let fechaActual = new Date();

// ===============================================
// INICIALIZACIÓN
// ===============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 Inicializando panel del barbero...');
  
  // Verificar que el usuario es admin
  verificarRolAdmin();
  
  // Configurar fecha actual
  actualizarInputFecha();
  
  // Cargar citas del día actual
  cargarCitas();
  
  // Configurar eventos
  configurarEventos();
});

// ===============================================
// VERIFICAR ROL DE ADMIN (SIN ASYNC)
// ===============================================
function verificarRolAdmin() {
  const token = localStorage.getItem('jwtToken');
  
  if (!token) {
    alert('🔒 Debes iniciar sesión como administrador');
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    console.log('🔍 Verificando rol:', payload.data.rol);
    
    // ⭐ SOLO PERMITIR admin
    if (!payload.data.rol || payload.data.rol !== 'admin') {
      alert('⛔ Acceso denegado. Solo administradores pueden acceder a este panel.');
      window.location.href = 'home.html';
      return;
    }
    
    console.log('✅ Usuario verificado como admin');
    
  } catch (error) {
    console.error('❌ Error verificando rol:', error);
    alert('Error de autenticación');
    window.location.href = 'login.html';
  }
}

// ===============================================
// CONFIGURAR EVENTOS
// ===============================================
function configurarEventos() {
  // Botón HOY
  document.getElementById('btnHoy').addEventListener('click', () => {
    fechaActual = new Date();
    actualizarInputFecha();
    cargarCitas();
  });
  
  // Botón día anterior
  document.getElementById('btnDiaAnterior').addEventListener('click', () => {
    fechaActual.setDate(fechaActual.getDate() - 1);
    actualizarInputFecha();
    cargarCitas();
  });
  
  // Botón día siguiente
  document.getElementById('btnDiaSiguiente').addEventListener('click', () => {
    fechaActual.setDate(fechaActual.getDate() + 1);
    actualizarInputFecha();
    cargarCitas();
  });
  
  // Input de fecha manual
  document.getElementById('inputFecha').addEventListener('change', (e) => {
    fechaActual = new Date(e.target.value + 'T00:00:00');
    cargarCitas();
  });
  
  // Botón resumen semanal
  document.getElementById('btnResumenSemanal').addEventListener('click', () => {
    mostrarResumenSemanal();
  });
  
  // Cerrar sesión
  document.getElementById('btnCerrarSesion').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('usuarioNombre');
      window.location.href = 'login.html';
    }
  });
  
  // Cerrar modal
  document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('modalResumen').style.display = 'none';
  });
  
  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('modalResumen');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// ===============================================
// ACTUALIZAR INPUT DE FECHA
// ===============================================
function actualizarInputFecha() {
  const inputFecha = document.getElementById('inputFecha');
  const fechaStr = fechaActual.toISOString().split('T')[0];
  inputFecha.value = fechaStr;
}

// ===============================================
// CARGAR CITAS DEL DÍA
// ===============================================
async function cargarCitas() {
  const listaCitas = document.getElementById('listaCitas');
  const estadisticas = document.getElementById('estadisticas');
  
  listaCitas.innerHTML = '<p class="loading">⏳ Cargando citas...</p>';
  estadisticas.innerHTML = '';
  
  const fechaStr = fechaActual.toISOString().split('T')[0];
  
  try {
    const res = await fetchConAuth(`${backendURL}?action=citas_por_fecha&fecha=${fechaStr}`, {
      method: 'GET'
    });
    
    if (!res) return;
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al cargar citas');
    }
    
    // Mostrar estadísticas
    mostrarEstadisticas(data.estadisticas);
    
    // Mostrar citas
    if (data.citas.length === 0) {
      mostrarMensajeVacio(fechaStr);
    } else {
      mostrarCitas(data.citas);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    listaCitas.innerHTML = `
      <div class="mensaje-vacio">
        <p style="color: #f44336;">❌ Error al cargar citas: ${error.message}</p>
      </div>
    `;
  }
}

// ===============================================
// MOSTRAR ESTADÍSTICAS
// ===============================================
function mostrarEstadisticas(stats) {
  const estadisticas = document.getElementById('estadisticas');
  
  estadisticas.innerHTML = `
    <div class="stat-card total">
      <span class="stat-numero">${stats.total}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-card pendientes">
      <span class="stat-numero">${stats.pendientes}</span>
      <span class="stat-label">Pendientes</span>
    </div>
    <div class="stat-card realizadas">
      <span class="stat-numero">${stats.realizadas}</span>
      <span class="stat-label">Realizadas</span>
    </div>
    <div class="stat-card canceladas">
      <span class="stat-numero">${stats.canceladas}</span>
      <span class="stat-label">Canceladas</span>
    </div>
  `;
}

// ===============================================
// MOSTRAR CITAS
// ===============================================
function mostrarCitas(citas) {
  const listaCitas = document.getElementById('listaCitas');
  listaCitas.innerHTML = '';
  
  citas.forEach(cita => {
    const div = document.createElement('div');
    div.className = `cita-barbero ${cita.estado}`;
    
    const estadoBadge = obtenerBadgeEstado(cita.estado);
    const botonRealizar = cita.estado === 'pendiente' 
      ? `<button class="btn-accion btn-realizar" onclick="marcarComoRealizada(${cita.id})">
           ✅ Marcar como realizada
         </button>`
      : `<button class="btn-accion btn-realizar" disabled>
           ${estadoBadge}
         </button>`;
    
    div.innerHTML = `
      <div class="cita-hora">🕐 ${formatearHora(cita.hora)}</div>
      
      <div class="cita-info-grid">
        <div class="cita-info-row">
          <strong>👤 Cliente:</strong>
          <span>${cita.nombre_cliente || 'Sin nombre'}</span>
        </div>
        
        <div class="cita-info-row">
          <strong>📞 Teléfono:</strong>
          <span>
            <a href="tel:${cita.telefono_cliente}" class="telefono-link">
              ${cita.telefono_cliente || 'Sin teléfono'}
            </a>
          </span>
        </div>
        
        <div class="cita-info-row">
          <strong>✂️ Servicio:</strong>
          <span>${cita.tipo_servicio || 'No especificado'}</span>
        </div>
        
        ${cita.email ? `
          <div class="cita-info-row">
            <strong>📧 Email:</strong>
            <span>${cita.email}</span>
          </div>
        ` : ''}
        
        ${cita.notas ? `
          <div class="cita-info-row">
            <strong>📝 Notas:</strong>
            <span>${cita.notas}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="cita-acciones">
        ${botonRealizar}
      </div>
    `;
    
    listaCitas.appendChild(div);
  });
}

// ===============================================
// MOSTRAR MENSAJE VACÍO
// ===============================================
function mostrarMensajeVacio(fecha) {
  const listaCitas = document.getElementById('listaCitas');
  const fechaFormateada = formatearFecha(fecha);
  
  listaCitas.innerHTML = `
    <div class="mensaje-vacio">
      <div class="mensaje-vacio-icono">📅</div>
      <h3>No hay citas programadas</h3>
      <p>No tienes citas para el ${fechaFormateada}</p>
    </div>
  `;
}

// ===============================================
// MARCAR CITA COMO REALIZADA
// ===============================================
async function marcarComoRealizada(citaId) {
  if (!confirm('¿Marcar esta cita como realizada?')) {
    return;
  }
  
  try {
    const res = await fetchConAuth(`${backendURL}?action=marcar_realizada`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cita_id: citaId })
    });
    
    if (!res) return;
    
    const data = await res.json();
    
    if (data.success) {
      alert('✅ Cita marcada como realizada');
      cargarCitas();
    } else {
      throw new Error(data.error || 'Error al actualizar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error al marcar cita: ' + error.message);
  }
}

// ===============================================
// MOSTRAR RESUMEN SEMANAL
// ===============================================
async function mostrarResumenSemanal() {
  const modal = document.getElementById('modalResumen');
  const contenido = document.getElementById('contenidoResumen');
  
  contenido.innerHTML = '<p class="loading">⏳ Cargando resumen...</p>';
  modal.style.display = 'flex';
  
  try {
    const res = await fetchConAuth(`${backendURL}?action=resumen_semanal`, {
      method: 'GET'
    });
    
    if (!res) return;
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al cargar resumen');
    }
    
    if (data.resumen.length === 0) {
      contenido.innerHTML = `
        <div class="mensaje-vacio">
          <p>📭 No hay citas esta semana</p>
        </div>
      `;
      return;
    }
    
    let html = `
      <p style="margin-bottom: 20px; opacity: 0.8;">
        📅 Del ${formatearFecha(data.rango.inicio)} al ${formatearFecha(data.rango.fin)}
      </p>
    `;
    
    data.resumen.forEach(dia => {
      const diaSemana = obtenerNombreDia(dia.dia);
      html += `
        <div class="resumen-dia">
          <h4>${diaSemana} - ${formatearFecha(dia.dia)}</h4>
          <div class="resumen-stats">
            <span>📊 Total: <strong>${dia.total_citas}</strong></span>
            <span>⏳ Pendientes: <strong>${dia.pendientes}</strong></span>
            <span>✅ Realizadas: <strong>${dia.realizadas}</strong></span>
          </div>
        </div>
      `;
    });
    
    contenido.innerHTML = html;
    
  } catch (error) {
    console.error('Error:', error);
    contenido.innerHTML = `
      <div class="mensaje-vacio">
        <p style="color: #f44336;">Error: ${error.message}</p>
      </div>
    `;
  }
}

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================

function obtenerBadgeEstado(estado) {
  const badges = {
    'pendiente': '⏳ Pendiente',
    'confirmada': '✔️ Confirmada',
    'realizada': '✅ Realizada',
    'cancelada': '❌ Cancelada'
  };
  return badges[estado] || estado;
}

function formatearHora(hora) {
  return hora.substring(0, 5);
}

function formatearFecha(fecha) {
  const d = new Date(fecha + 'T00:00:00');
  const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('es-ES', opciones);
}

function obtenerNombreDia(fecha) {
  const d = new Date(fecha + 'T00:00:00');
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[d.getDay()];
}

// ===============================================
// FUNCIÓN FETCH CON AUTENTICACIÓN
// ===============================================
async function fetchConAuth(url, options = {}) {
  const token = localStorage.getItem('jwtToken');
  
  if (!token) {
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
    window.location.href = 'login.html';
    return null;
  }
  
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401 || response.status === 403) {
      alert('Sesión expirada o acceso denegado.');
      localStorage.removeItem('jwtToken');
      window.location.href = 'login.html';
      return null;
    }
    
    return response;
    
  } catch (error) {
    console.error('Error en la petición:', error);
    throw error;
  }
}