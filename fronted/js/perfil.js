

let datosUsuario = null;

// Verificar sesión al cargar
window.addEventListener('DOMContentLoaded', function() {
  console.log("Cargando perfil...");
  
  const token = localStorage.getItem("jwtToken");
  
  if (!token) {
    alert("Debes iniciar sesión primero");
    window.location.href = "login.html";
    return;
  }
  
  cargarPerfil(token);
  configurarEventos();
});

// Cargar datos del perfil
async function cargarPerfil(token) {
  const perfilView = document.getElementById("perfilView");
  const mensajeDiv = document.getElementById("mensaje");
  
  try {
    console.log("Solicitando datos del perfil...");
    
    const res = await fetchConAuth(`${backendURL}?action=obtener_perfil`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });
    
    console.log("Respuesta recibida:", res.status);
    
    const data = await res.json();
    console.log("Datos:", data);
    
    if (!res.ok) {
      throw new Error(data.error || "Error al cargar perfil");
    }
    
    if (data.success && data.usuario) {
      datosUsuario = data.usuario;
      mostrarPerfil(data.usuario);
      perfilView.style.display = "block";
    } else {
      throw new Error("No se recibieron datos del usuario");
    }
    
  } catch (error) {
    console.error("Error:", error);
    mensajeDiv.textContent = "" + error.message;
    mensajeDiv.style.color = "red";
    
    // Si el token expiró, redirigir
    if (error.message.includes("Token") || error.message.includes("sesión")) {
      setTimeout(() => {
        localStorage.removeItem("jwtToken");
        window.location.href = "login.html";
      }, 2000);
    }
  }
}

// Mostrar datos del perfil
function mostrarPerfil(usuario) {
  console.log("Mostrando perfil:", usuario);
  
  // Nombre completo
  const nombreCompleto = usuario.apellidos 
    ? `${usuario.nombre} ${usuario.apellidos}` 
    : usuario.nombre;
  document.getElementById("viewNombre").textContent = nombreCompleto;
  
  // Email
  document.getElementById("viewEmail").textContent = usuario.email;
  
  // Teléfono
  document.getElementById("viewTelefono").textContent = usuario.telefono || "No especificado";
  
  // Fecha de registro
  if (usuario.fecha_registro) {
    const fecha = new Date(usuario.fecha_registro);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("viewFechaRegistro").textContent = fecha.toLocaleDateString('es-ES', opciones);
  }
  
  // Total de citas
  document.getElementById("viewTotalCitas").textContent = usuario.total_citas || 0;
}

// Configurar eventos
function configurarEventos() {
  // Botón editar perfil
  document.getElementById("btnEditarPerfil").addEventListener("click", function() {
    mostrarFormularioEdicion();
  });
  
  // Botón cancelar edición
  document.getElementById("btnCancelarEdicion").addEventListener("click", function() {
    ocultarFormularioEdicion();
  });
  
  // Formulario de edición
  document.getElementById("perfilForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    await guardarCambios();
  });
  
  // Botón cerrar sesión
  document.getElementById("btnCerrarSesion").addEventListener("click", function() {
    cerrarSesion();
  });
}

// Mostrar formulario de edición
function mostrarFormularioEdicion() {
  console.log("Activando modo edición");
  
  // Rellenar campos con datos actuales
  document.getElementById("editNombre").value = datosUsuario.nombre;
  document.getElementById("editApellidos").value = datosUsuario.apellidos || "";
  document.getElementById("editTelefono").value = datosUsuario.telefono;
  
  // Cambiar vistas
  document.getElementById("perfilView").style.display = "none";
  document.getElementById("perfilEdit").style.display = "block";
  
  // Limpiar mensaje
  document.getElementById("mensaje").textContent = "";
}

// Ocultar formulario de edición
function ocultarFormularioEdicion() {
  console.log("Volviendo a modo visualización");
  
  document.getElementById("perfilView").style.display = "block";
  document.getElementById("perfilEdit").style.display = "none";
  
  // Limpiar mensaje
  document.getElementById("mensaje").textContent = "";
}

// Guardar cambios del perfil
async function guardarCambios() {
  const token = localStorage.getItem("jwtToken");
  const mensajeDiv = document.getElementById("mensaje");
  const btnSubmit = document.querySelector("#perfilForm button[type='submit']");
  
  if (!token) {
    alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
    window.location.href = "login.html";
    return;
  }
  
  // Obtener valores del formulario
  const nombre = document.getElementById("editNombre").value.trim();
  const apellidos = document.getElementById("editApellidos").value.trim();
  const telefono = document.getElementById("editTelefono").value.trim();
  
  if (!nombre || !telefono) {
    mensajeDiv.textContent = "Completa los campos obligatorios";
    mensajeDiv.style.color = "#ff6b6b";
    return;
  }
  
  // Validar teléfono (9 dígitos)
  if (!/^[0-9]{9}$/.test(telefono)) {
    mensajeDiv.textContent = "El teléfono debe tener 9 dígitos";
    mensajeDiv.style.color = "#ff6b6b";
    return;
  }
  
  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Guardando...";
    
    console.log("📤 Enviando actualización...");
    
    const res = await fetchConAuth(`${backendURL}?action=actualizar_perfil`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        nombre: nombre,
        apellidos: apellidos,
        telefono: telefono
      })
    });
    
    const data = await res.json();
    console.log("📥 Respuesta:", data);
    
    if (res.ok && data.success) {
      mensajeDiv.textContent = "Perfil actualizado correctamente";
      mensajeDiv.style.color = "#4caf50";
      
      // Actualizar localStorage
      localStorage.setItem("usuarioNombre", nombre);
      
      // Recargar datos
      setTimeout(async () => {
        await cargarPerfil(token);
        ocultarFormularioEdicion();
        mensajeDiv.textContent = "";
      }, 1500);
      
    } else {
      throw new Error(data.error || "Error al actualizar perfil");
    }
    
  } catch (error) {
    console.error("Error:", error);
    mensajeDiv.textContent = "" + error.message;
    mensajeDiv.style.color = "#ff6b6b";
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Guardar";
  }
}

// Cerrar sesión
function cerrarSesion() {
  if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
    console.log("Cerrando sesión...");
    
    // Limpiar localStorage
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("usuarioNombre");
    localStorage.removeItem("reserva");
    
    // Redirigir a login
    window.location.href = "login.html";
  }
}

console.log("perfil.js cargado correctamente");