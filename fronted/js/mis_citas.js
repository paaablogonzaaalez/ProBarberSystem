const backendURL = "http://192.168.1.34/ProBarberSystem/backend/index.php";

// Esperar a que el DOM esté completamente cargado
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM cargado, iniciando...");
 
  const token = localStorage.getItem("jwtToken");
  console.log("🔑 Token encontrado:", token ? "Sí" : "No");
 
  // Verificar sesión
  if (!token) {
    alert("⚠️ Debes iniciar sesión primero");
    window.location.href = "login.html";
    return;
  }

  // Verificar que los elementos existen
  const contenedor = document.getElementById("citasContainer");
  const btnNuevaReserva = document.getElementById("btnNuevaReserva");
 
  console.log("📦 Contenedor encontrado:", contenedor ? "Sí" : "No");
  console.log("🔘 Botón encontrado:", btnNuevaReserva ? "Sí" : "No");
 
  if (!contenedor) {
    console.error("No se encontró el elemento citasContainer");
    alert("Error: No se pudo cargar la página correctamente");
    return;
  }

  // Cargar citas
  cargarCitas(token, contenedor);

  // Configurar botón de nueva reserva
  if (btnNuevaReserva) {
    btnNuevaReserva.addEventListener("click", function() {
      localStorage.removeItem("reserva");
      window.location.href = "seleccionar_fecha.html";
    });
  }
});

// Función para cargar citas del usuario
async function cargarCitas(token, contenedor) {
  try {
    console.log("Iniciando carga de citas...");
    console.log("URL:", `${backendURL}?action=mis_citas`);
   
    const res = await fetch(`${backendURL}?action=mis_citas`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    console.log("Respuesta recibida");
    console.log("   Status:", res.status);
    console.log("   OK:", res.ok);

    const data = await res.json();
    console.log("Datos JSON:", data);

    if (!res.ok) {
      throw new Error(data.error || "Error al cargar citas");
    }

    // Verificar si hay citas en la respuesta
    if (!data.citas || data.citas.length === 0) {
      console.log("No hay citas en la base de datos");
      contenedor.innerHTML = `
        <div style="
          text-align: center; 
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          margin: 20px 0;
        ">
          <div style="font-size: 4rem; margin-bottom: 16px; opacity: 0.9;">
          </div>
          <h2 style="
            font-size: 1.3rem; 
            margin-bottom: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
          ">
            No tienes citas reservadas
          </h2>
          <p style="
            opacity: 0.8; 
            font-size: 0.95rem;
            line-height: 1.6;
            max-width: 280px;
            margin: 0 auto;
          ">
          </p>
        </div>
      `;
      return;
    }

    // 🔄 FILTRAR SOLO CITAS NO CANCELADAS
    const citasActivas = data.citas.filter(cita => cita.estado !== 'cancelada');
    
    console.log("📊 Total citas en BD:", data.citas.length);
    console.log("✅ Citas activas (sin canceladas):", citasActivas.length);

    // Verificar si hay citas activas después del filtrado
    if (citasActivas.length === 0) {
      console.log("No hay citas activas (todas están canceladas)");
      contenedor.innerHTML = `
        <div style="
          text-align: center; 
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          margin: 20px 0;
        ">
          <div style="font-size: 4rem; margin-bottom: 16px; opacity: 0.9;">
            
          </div>
          <h2 style="
            font-size: 1.3rem; 
            margin-bottom: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
          ">
            No tienes citas reservadas
          </h2>
          <p style="
            opacity: 0.8; 
            font-size: 0.95rem;
            line-height: 1.6;
            max-width: 280px;
            margin: 0 auto;
          ">
          
          </p>
        </div>
      `;
      return;
    }

    // Limpiar contenedor
    contenedor.innerHTML = "";
   
    // Crear tarjetas solo de citas activas
    citasActivas.forEach(function(cita, index) {
      console.log("📋 Procesando cita activa", index + 1, ":", cita);
     
      const div = document.createElement("div");
      div.className = "cita-card";
     
      // Formatear fecha
      const fechaFormateada = new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Estado con color
      let estadoHTML = "";
      switch(cita.estado) {
        case "pendiente":
          estadoHTML = '<span class="estado-badge pendiente">✅ Cita Reservada</span>';
          break;
        case "realizada":
          estadoHTML = '<span class="estado-badge realizada">✓ Realizada</span>';
          break;
        default:
          estadoHTML = '<span class="estado-badge pendiente">' + cita.estado + '</span>';
      }

      div.innerHTML = `
        <div class="cita-info">
          <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
          <p><strong>🕐 Hora:</strong> ${cita.hora.slice(0,5)}</p>
          <p><strong>💈 Servicio:</strong> ${cita.tipo_servicio || 'Corte de pelo'}</p>
          <div style="margin-top: 12px;">
            ${estadoHTML}
          </div>
        </div>
        ${
          cita.estado === "pendiente"
            ? `<button onclick="cancelarCita(${cita.id})" class="btn-cancelar">❌ Cancelar cita</button>`
            : ""
        }
      `;
     
      contenedor.appendChild(div);
    });

    console.log("✅ Todas las citas activas mostradas correctamente");

  } catch (error) {
    console.error("❌ Error completo:", error);
    console.error("   Mensaje:", error.message);
    console.error("   Stack:", error.stack);
   
    contenedor.innerHTML = `
      <div style="
        text-align: center; 
        padding: 30px 20px; 
        background: rgba(244, 67, 54, 0.15);
        border-radius: 14px;
        border: 1px solid rgba(244, 67, 54, 0.3);
      ">
        <p style="font-size: 2.5rem; margin-bottom: 12px;">⚠️</p>
        <p style="font-weight: 600; margin-bottom: 8px;">Error al cargar las citas</p>
        <p style="font-size: 0.85rem; opacity: 0.7;">
          ${error.message}
        </p>
      </div>
    `;
  }
}

// Función global para cancelar una cita
window.cancelarCita = async function(citaId) {
  console.log("🗑️ Iniciando cancelación de cita ID:", citaId);
 
  const token = localStorage.getItem("jwtToken");
  const contenedor = document.getElementById("citasContainer");
 
  if (!token) {
    alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
    window.location.href = "login.html";
    return;
  }

  if (!confirm("¿Estás seguro de que quieres cancelar esta cita?")) {
    console.log("❌ Cancelación abortada por el usuario");
    return;
  }

  try {
    console.log("📤 Enviando solicitud de cancelación...");
   
    const res = await fetch(`${backendURL}?action=cancelar_cita`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ cita_id: citaId })
    });

    console.log("📥 Respuesta recibida, status:", res.status);
   
    const data = await res.json();
    console.log("📦 Datos:", data);

    if (res.ok && data.success) {
      alert("✅ Cita cancelada correctamente");
      console.log("🔄 Recargando lista de citas...");
      // Recargar la lista (las citas canceladas ya no aparecerán)
      await cargarCitas(token, contenedor);
    } else {
      const errorMsg = data.error || data.message || "Error desconocido";
      console.error("❌ Error del servidor:", errorMsg);
      alert("❌ No se pudo cancelar la cita: " + errorMsg);
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error);
    alert("⚠️ Error de conexión al cancelar la cita");
  }
}

console.log("✅ Script mis_citas.js cargado correctamente");