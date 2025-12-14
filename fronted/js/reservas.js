// =======================================
// VARIABLES COMUNES
// =======================================
const backendURL = "http://localhost/ProBarberSystem/backend/index.php";
let reserva = {
  fecha: "",
  hora: "",
  servicio: "",
  cliente_id: null  // <-- se añadirá automáticamente
};

// =======================================
// FUNCIONES PARA CADA PASO
// =======================================

// 0️⃣ Obtener cliente_id del usuario logueado (JWT)
function obtenerClienteID() {
  const token = localStorage.getItem("jwtToken"); // guarda aquí el token tras login
  if (!token) return null;

  // Decodificar payload del JWT
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.data.id; // asumiendo que el JWT tiene "data.id"
}

// 1️⃣ Seleccionar fecha
function guardarFecha() {
  const fechaInput = document.getElementById("fecha");
  const btnSiguiente = document.getElementById("btnSiguienteFecha");

  if (!fechaInput || !btnSiguiente) return;

  btnSiguiente.addEventListener("click", (e) => {
    e.preventDefault();
    if (!fechaInput.value) {
      alert("Selecciona una fecha");
      return;
    }
    reserva.fecha = fechaInput.value;
    localStorage.setItem("reserva", JSON.stringify(reserva));
    window.location.href = "seleccionar_hora.html";
  });
}

// 2️⃣ Seleccionar hora
function cargarHorasDisponibles() {
  const horaSelect = document.getElementById("hora");
  const btnSiguiente = document.getElementById("btnSiguienteHora");

  if (!horaSelect || !btnSiguiente) return;

  const horasDisponibles = [
    "09:30","10:00","10:30","11:00","11:30","12:00",
    "12:30","13:00","13:30",
    "16:00","16:30","17:00","17:30","18:00","18:30",
    "19:00","19:30","20:00","20:30"
  ];

  horaSelect.innerHTML = "";
  horasDisponibles.forEach(h => {
    const option = document.createElement("option");
    option.value = h;
    option.textContent = h;
    horaSelect.appendChild(option);
  });

  btnSiguiente.addEventListener("click", (e) => {
    e.preventDefault();
    reserva = JSON.parse(localStorage.getItem("reserva")) || {};
    reserva.hora = horaSelect.value;
    localStorage.setItem("reserva", JSON.stringify(reserva));
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
    reserva = JSON.parse(localStorage.getItem("reserva")) || {};
    reserva.servicio = servicioSelect.value;
    localStorage.setItem("reserva", JSON.stringify(reserva));
    window.location.href = "resumen_cita.html";
  });
}

// 4️⃣ Mostrar resumen y confirmar cita
function mostrarResumen() {
  const output = document.getElementById("output");
  const btnConfirmar = document.getElementById("btnConfirmarCita");

  if (!output || !btnConfirmar) return;

  reserva = JSON.parse(localStorage.getItem("reserva")) || {};
  reserva.cliente_id = obtenerClienteID(); // <- añadimos cliente_id

  output.textContent = `📅 Fecha: ${reserva.fecha}\n⏰ Hora: ${reserva.hora}\n💈 Servicio: ${reserva.servicio}`;

  btnConfirmar.addEventListener("click", async () => {
    if (!reserva.cliente_id) {
      alert("❌ Debes iniciar sesión para reservar");
      return;
    }

    try {
      const res = await fetch(`${backendURL}?action=reservar`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(reserva)
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Cita confirmada!");
        localStorage.removeItem("reserva");
        window.location.href = "home.html";
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo reservar'}`);
      }
    } catch (err) {
      alert(`❌ Error de conexión: ${err}`);
    }
  });
}

// =======================================
// EJECUTAR SEGÚN PÁGINA
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("fecha")) guardarFecha();
  if (document.getElementById("hora")) cargarHorasDisponibles();
  if (document.getElementById("servicio")) guardarServicio();
  if (document.getElementById("output")) mostrarResumen();
});
