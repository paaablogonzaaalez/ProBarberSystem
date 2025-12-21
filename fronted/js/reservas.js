// =======================================
// VARIABLES COMUNES
// =======================================
const backendURL = "http://192.168.1.39/ProBarberSystem/backend/index.php";
let reserva = {
  fecha: "",
  hora: "",
  servicio_id: null,
  servicio_nombre: "",
  cliente_id: null
};

// 0️⃣ Obtener cliente_id del usuario logueado (JWT)
function obtenerClienteID() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    console.error("No hay token JWT");
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log("Cliente ID obtenido:", payload.data.cliente_id);
    return payload.data.cliente_id;
  } catch (error) {
    console.error("Error al decodificar JWT:", error);
    return null;
  }
}

// 1️⃣ Seleccionar fecha
function guardarFecha() {
  const fechaInput = document.getElementById("fecha");
  const fechaForm = document.getElementById("fechaForm");
  if (!fechaInput || !fechaForm) return;

  const hoy = new Date().toISOString().split('T')[0];
  fechaInput.setAttribute('min', hoy);

  fechaForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!fechaInput.value) {
      alert("Selecciona una fecha");
      return;
    }

    const fechaSeleccionada = new Date(fechaInput.value);
    const hoyDate = new Date();
    hoyDate.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoyDate) {
      alert("No puedes seleccionar una fecha pasada");
      return;
    }

    reserva.fecha = fechaInput.value;
    reserva.cliente_id = obtenerClienteID();

    if (!reserva.cliente_id) {
      alert("Debes iniciar sesión primero");
      window.location.href = "login.html";
      return;
    }

    localStorage.setItem("reserva", JSON.stringify(reserva));
    console.log("Fecha guardada:", reserva);
    window.location.href = "seleccionar_hora.html";
  });
}

// 2️⃣ Seleccionar hora
function cargarHorasDisponibles() {
  const horasGrid = document.getElementById("horasGrid");
  const horaForm = document.getElementById("horaForm");
  const btnSiguiente = document.getElementById("btnSiguienteHora");

  if (!horasGrid || !horaForm || !btnSiguiente) return;

  const horasDisponibles = [
    "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
    "12:30", "13:00", "13:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00", "20:30"
  ];

  btnSiguiente.disabled = true;
  horasGrid.innerHTML = "";

  horasDisponibles.forEach(hora => {
    const div = document.createElement("div");
    div.className = "hora-btn"; 
    div.textContent = hora;

    div.addEventListener("click", () => {
      document.querySelectorAll(".hora-btn")
        .forEach(h => h.classList.remove("selected"));

      div.classList.add("selected");

      reserva = JSON.parse(localStorage.getItem("reserva")) || {};
      reserva.hora = hora;
      localStorage.setItem("reserva", JSON.stringify(reserva));

      btnSiguiente.disabled = false;
    });

    horasGrid.appendChild(div);
  });

  horaForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!reserva.hora) {
      alert("Selecciona una hora");
      return;
    }

    window.location.href = "seleccionar_servicio.html";
  });
}

// 3️⃣ Seleccionar servicio
function guardarServicio() {
  const servicioSelect = document.getElementById("servicio");
  const servicioForm = document.getElementById("servicioForm");
  if (!servicioSelect || !servicioForm) return;

  servicioForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!servicioSelect.value) {
      alert("Selecciona un servicio");
      return;
    }

    reserva = JSON.parse(localStorage.getItem("reserva")) || {};

    reserva.servicio_id = parseInt(servicioSelect.value);
    reserva.servicio_nombre = servicioSelect.options[servicioSelect.selectedIndex].text;

    if (!reserva.cliente_id) {
      reserva.cliente_id = obtenerClienteID();
    }

    if (!reserva.cliente_id) {
      alert("Debes iniciar sesión primero");
      window.location.href = "login.html";
      return;
    }

    localStorage.setItem("reserva", JSON.stringify(reserva));
    console.log("Servicio guardado:", reserva);
    window.location.href = "resumen_cita.html";
  });
}

// 4️⃣ Mostrar resumen y confirmar cita
function mostrarResumen() {
  const output = document.getElementById("output");
  const btnConfirmar = document.getElementById("btnConfirmarCita");
  if (!output || !btnConfirmar) return;

  reserva = JSON.parse(localStorage.getItem("reserva")) || {};
  if (!reserva.cliente_id) {
    reserva.cliente_id = obtenerClienteID();
  }

  if (!reserva.fecha || !reserva.hora || !reserva.servicio_id || !reserva.cliente_id) {
    output.innerHTML = `
      <p style="color: red;">Faltan datos de la reserva.</p>
      <p>Por favor, completa el proceso desde el inicio.</p>
    `;
    btnConfirmar.disabled = true;
    return;
  }

  output.innerHTML = `
    <h2>Confirmación de Cita</h2>
    <div>
      <p><strong> Fecha:</strong> ${formatearFecha(reserva.fecha)}</p>
      <p><strong> Hora:</strong> ${reserva.hora}</p>
      <p><strong> Servicio:</strong> ${reserva.servicio_nombre || 'Servicio seleccionado'}</p>
    </div>
    <p>Por favor, revisa que todos los datos sean correctos antes de confirmar.</p>
  `;

  console.log(" Datos a enviar:", reserva);

  btnConfirmar.addEventListener("click", async () => {
    if (!reserva.fecha || !reserva.hora || !reserva.servicio_id || !reserva.cliente_id) {
      alert(" Datos incompletos. Por favor, reinicia el proceso de reserva.");
      return;
    }

    const datosEnviar = {
      fecha: reserva.fecha,
      hora: reserva.hora,
      servicio_id: reserva.servicio_id,
      cliente_id: reserva.cliente_id
    };

    try {
      const jsonString = JSON.stringify(datosEnviar);
      console.log(" JSON que se enviará:", jsonString);
      console.log(" URL destino:", `${backendURL}?action=reservar`);

      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Procesando...";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${backendURL}?action=reservar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: jsonString,
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      console.log(" Respuesta del servidor - Status:", res.status);
      console.log(" Headers:", [...res.headers.entries()]);

      const responseText = await res.text();
      console.log(" Respuesta RAW:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(" Error parseando JSON:", parseError);
        throw new Error(`Respuesta no válida del servidor: ${responseText.substring(0, 100)}`);
      }

      console.log(" Respuesta del servidor - Data:", data);

      if (res.ok && data.success) {
        alert(" ¡Cita confirmada correctamente!");
        localStorage.removeItem("reserva");
        //  CAMBIO: Redirigir a mis_citas.html en lugar de home.html
        window.location.href = "mis_citas.html";
      } else {
        throw new Error(data.error || data.message || 'No se pudo reservar la cita');
      }
    } catch (err) {
      console.error("❌ Error completo:", err);
     
      let mensajeError = "Error de conexión";
     
      if (err.name === 'AbortError') {
        mensajeError = " Tiempo de espera agotado. Verifica tu conexión a internet.";
      } else if (err.message.includes('Failed to fetch') || err.message.includes('Load failed')) {
        mensajeError = ` No se puede conectar al servidor.
       
Verifica:
• Tu móvil está en la misma red WiFi que el PC
• La IP del servidor es correcta: ${backendURL}
• El firewall de Windows permite conexiones entrantes
• Apache está ejecutándose en el PC`;
      } else {
        mensajeError = ` ${err.message}`;
      }
     
      alert(mensajeError);
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Confirmar Cita";
    }
  });
}

// Formatear fecha
function formatearFecha(fecha) {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaObj = new Date(fecha + 'T00:00:00');
  return fechaObj.toLocaleDateString('es-ES', opciones);
}

// =======================================
// TEST DE CONECTIVIDAD (útil para debug)
// =======================================
async function testConexion() {
  try {
    console.log(" Probando conexión a:", backendURL);
    const res = await fetch(backendURL, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache'
    });
    console.log(" Conexión OK, status:", res.status);
    return true;
  } catch (err) {
    console.error(" Error de conexión:", err);
    return false;
  }
}

// =======================================
// EJECUTAR SEGÚN PÁGINA
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  console.log(" reservas.js cargado");
  
  // Test de conectividad al cargar (opcional)
  testConexion();
  
  if (document.getElementById("fecha")) guardarFecha();
  if (document.getElementById("horasGrid")) cargarHorasDisponibles();
  if (document.getElementById("servicio")) guardarServicio();
  if (document.getElementById("output")) mostrarResumen();
});


