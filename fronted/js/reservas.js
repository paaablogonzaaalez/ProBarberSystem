// =======================================
// VARIABLES COMUNES
// =======================================
const backendURL = "http://localhost/ProBarberSystem/backend/index.php";
let reserva = {
  fecha: "",
  hora: "",
  servicio_id: null,
  servicio_nombre: "", // 👈 Añadimos el nombre del servicio
  cliente_id: null
};

// 0️⃣ Obtener cliente_id del usuario logueado (JWT)
function obtenerClienteID() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    console.error("❌ No hay token JWT");
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log("✅ Cliente ID obtenido:", payload.data.cliente_id);
    return payload.data.cliente_id;
  } catch (error) {
    console.error("❌ Error al decodificar JWT:", error);
    return null;
  }
}

// 1️⃣ Seleccionar fecha
function guardarFecha() {
  const fechaInput = document.getElementById("fecha");
  const btnSiguiente = document.getElementById("btnSiguienteFecha");
  if (!fechaInput || !btnSiguiente) return;

  // Establecer fecha mínima como hoy
  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.setAttribute('min', hoy);

  btnSiguiente.addEventListener("click", (e) => {
    e.preventDefault();
    
    if (!fechaInput.value) {
      alert("⚠️ Selecciona una fecha");
      return;
    }

    // Validar que la fecha no sea pasada
    const fechaSeleccionada = new Date(fechaInput.value);
    const hoyDate = new Date();
    hoyDate.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoyDate) {
      alert("⚠️ No puedes seleccionar una fecha pasada");
      return;
    }

    reserva.fecha = fechaInput.value;
    reserva.cliente_id = obtenerClienteID(); // 👈 Obtenemos cliente_id desde el inicio
    
    if (!reserva.cliente_id) {
      alert("❌ Debes iniciar sesión primero");
      window.location.href = "login.html";
      return;
    }

    localStorage.setItem("reserva", JSON.stringify(reserva));
    console.log("✅ Fecha guardada:", reserva);
    window.location.href = "seleccionar_hora.html";
  });
}

// 2️⃣ Seleccionar hora
function cargarHorasDisponibles() {
  const horaSelect = document.getElementById("hora");
  const btnSiguiente = document.getElementById("btnSiguienteHora");
  if (!horaSelect || !btnSiguiente) return;

  const horasDisponibles = [
    "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
    "12:30", "13:00", "13:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00", "20:30"
  ];

  horaSelect.innerHTML = '<option value="">-- Selecciona una hora --</option>';
  horasDisponibles.forEach(h => {
    const option = document.createElement("option");
    option.value = h;
    option.textContent = h;
    horaSelect.appendChild(option);
  });

  btnSiguiente.addEventListener("click", (e) => {
    e.preventDefault();
    
    if (!horaSelect.value) {
      alert("⚠️ Selecciona una hora");
      return;
    }

    reserva = JSON.parse(localStorage.getItem("reserva")) || {};
    reserva.hora = horaSelect.value;
    localStorage.setItem("reserva", JSON.stringify(reserva));
    console.log("✅ Hora guardada:", reserva);
    window.location.href = "seleccionar_servicio.html";
  });
}

// 3️⃣ Seleccionar servicio
function guardarServicio() {
  const servicioSelect = document.getElementById("servicio");
  const btnSiguiente = document.getElementById("btnSiguienteServicio");
  if (!servicioSelect || !btnSiguiente) return;

  btnSiguiente.addEventListener("click", (e) => {
    e.preventDefault();
    
    if (!servicioSelect.value) {
      alert("⚠️ Selecciona un servicio");
      return;
    }

    reserva = JSON.parse(localStorage.getItem("reserva")) || {};

    // 👇 Guardar tanto el ID como el nombre del servicio
    reserva.servicio_id = parseInt(servicioSelect.value);
    reserva.servicio_nombre = servicioSelect.options[servicioSelect.selectedIndex].text;

    // Asegurar que cliente_id esté presente
    if (!reserva.cliente_id) {
      reserva.cliente_id = obtenerClienteID();
    }

    if (!reserva.cliente_id) {
      alert("❌ Debes iniciar sesión primero");
      window.location.href = "login.html";
      return;
    }

    localStorage.setItem("reserva", JSON.stringify(reserva));
    console.log("✅ Servicio guardado:", reserva);
    window.location.href = "resumen_cita.html";
  });
}

// 4️⃣ Mostrar resumen y confirmar cita
function mostrarResumen() {
  const output = document.getElementById("output");
  const btnConfirmar = document.getElementById("btnConfirmarCita");
  if (!output || !btnConfirmar) return;

  // Cargar datos de localStorage
  reserva = JSON.parse(localStorage.getItem("reserva")) || {};

  // Verificar que cliente_id esté presente
  if (!reserva.cliente_id) {
    reserva.cliente_id = obtenerClienteID();
  }

  // Validar datos completos
  if (!reserva.fecha || !reserva.hora || !reserva.servicio_id || !reserva.cliente_id) {
    output.innerHTML = `
      <p style="color: red;">❌ Faltan datos de la reserva.</p>
      <p>Por favor, completa el proceso desde el inicio.</p>
    `;
    btnConfirmar.disabled = true;
    return;
  }

  // Mostrar resumen con formato bonito
  output.innerHTML = `
    <h2 style="color: #222; margin-bottom: 20px;">📋 Confirmación de Cita</h2>
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p><strong>📅 Fecha:</strong> ${formatearFecha(reserva.fecha)}</p>
      <p><strong>⏰ Hora:</strong> ${reserva.hora}</p>
      <p><strong>💈 Servicio:</strong> ${reserva.servicio_nombre || 'Servicio seleccionado'}</p>
    </div>
    <p style="color: #666; font-size: 0.9em;">
      Por favor, revisa que todos los datos sean correctos antes de confirmar.
    </p>
  `;

  console.log("📋 Datos a enviar:", reserva);

  // Evento del botón confirmar
  btnConfirmar.addEventListener("click", async () => {
    // Validación final antes de enviar
    if (!reserva.fecha || !reserva.hora || !reserva.servicio_id || !reserva.cliente_id) {
      alert("❌ Datos incompletos. Por favor, reinicia el proceso de reserva.");
      return;
    }

    // Preparar datos para enviar (solo los necesarios para el backend)
    const datosEnviar = {
      fecha: reserva.fecha,
      hora: reserva.hora,
      servicio_id: reserva.servicio_id,
      cliente_id: reserva.cliente_id
    };

    console.log("📤 Enviando al backend:", datosEnviar);

    // Deshabilitar botón mientras se procesa
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Procesando...";

    try {
      const res = await fetch(`${backendURL}?action=reservar`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datosEnviar)
      });

      console.log("📥 Respuesta del servidor - Status:", res.status);

      const data = await res.json();
      console.log("📥 Respuesta del servidor - Data:", data);

      if (res.ok && data.success) {
        alert("✅ ¡Cita confirmada correctamente!");
        localStorage.removeItem("reserva");
        window.location.href = "home.html"; // O la página que corresponda
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo reservar la cita'}`);
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Confirmar Cita";
      }
    } catch (err) {
      console.error("❌ Error de conexión:", err);
      alert(`❌ Error de conexión: ${err.message}`);
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Confirmar Cita";
    }
  });
}

// Función auxiliar para formatear fecha
function formatearFecha(fecha) {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaObj = new Date(fecha + 'T00:00:00'); // Evitar problemas de zona horaria
  return fechaObj.toLocaleDateString('es-ES', opciones);
}

// =======================================
// EJECUTAR SEGÚN PÁGINA
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ reservas.js cargado");
  
  if (document.getElementById("fecha")) {
    console.log("📅 Cargando página de selección de fecha");
    guardarFecha();
  }
  if (document.getElementById("hora")) {
    console.log("⏰ Cargando página de selección de hora");
    cargarHorasDisponibles();
  }
  if (document.getElementById("servicio")) {
    console.log("💈 Cargando página de selección de servicio");
    guardarServicio();
  }
  if (document.getElementById("output")) {
    console.log("📋 Cargando página de resumen");
    mostrarResumen();
  }
});