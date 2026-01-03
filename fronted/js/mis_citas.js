// Esperar a que el DOM esté completamente cargado
window.addEventListener('DOMContentLoaded', function() {
  console.log("✅ DOM cargado, iniciando...");
 
  const token = localStorage.getItem("jwtToken");
  console.log("🔑 Token encontrado:", token ? "Sí" : "No");
 
  // Verificar sesión
  if (!token) {
    alert("Debes iniciar sesión primero");
    window.location.href = "login.html";
    return;
  }

  // Verificar que los elementos existen
  const contenedor = document.getElementById("citasContainer");
  const btnNuevaReserva = document.getElementById("btnNuevaReserva");
 
  console.log("📦 Contenedor encontrado:", contenedor ? "Sí" : "No");
  console.log("🔘 Botón encontrado:", btnNuevaReserva ? "Sí" : "No");
 
  if (!contenedor) {
    console.error("❌ No se encontró el elemento citasContainer");
    alert("Error: No se pudo cargar la página correctamente");
    return;
  }

  // Cargar citas
  cargarCitas(contenedor);

  // Configurar botón de nueva reserva
  if (btnNuevaReserva) {
    btnNuevaReserva.addEventListener("click", function() {
      localStorage.removeItem("reserva");
      window.location.href = "seleccionar_fecha.html";
    });
  }
});

// Función para cargar citas del usuario
async function cargarCitas(contenedor) {
  console.log("🔄 === INICIANDO CARGA DE CITAS ===");
  
  try {
    console.log("📍 URL:", `${backendURL}?action=mis_citas`);
   
    // ⭐ USAR fetchConAuth
    console.log("📤 Llamando a fetchConAuth...");
    const res = await fetchConAuth(`${backendURL}?action=mis_citas`, {
      method: "GET"
    });

    console.log("📥 Respuesta de fetchConAuth:", res);

    // Si fetchConAuth devuelve null, ya se encargó de redirigir
    if (!res) {
      console.error("❌ fetchConAuth devolvió null - usuario redirigido");
      return;
    }

    console.log("📡 Status:", res.status);
    console.log("✅ OK:", res.ok);

    // Parsear JSON
    const data = await res.json();
    console.log("📦 Datos JSON completos:", JSON.stringify(data, null, 2));

    // Verificar si la respuesta es OK
    if (!res.ok) {
      console.error("❌ Response no OK:", data);
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }

    // Verificar success en la respuesta
    if (data.success === false) {
      console.error("❌ Success = false:", data.error);
      throw new Error(data.error || "El servidor devolvió success: false");
    }

    // Verificar si hay citas
    if (!data.citas) {
      console.warn("⚠️ No hay propiedad 'citas' en la respuesta");
      throw new Error("Respuesta inválida del servidor");
    }

    if (data.citas.length === 0) {
      console.log("ℹ️ Array de citas vacío");
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
    
    console.log("📊 Total citas:", data.citas.length);
    console.log("📊 Citas activas:", citasActivas.length);

    if (citasActivas.length === 0) {
      console.log("ℹ️ No hay citas activas");
      contenedor.innerHTML = `
        <div style="
          text-align: center; 
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          margin: 20px 0;
        ">
          <div style="font-size: 4rem; margin-bottom: 16px; opacity: 0.9;">
            📅
          </div>
          <h2 style="
            font-size: 1.3rem; 
            margin-bottom: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
          ">
            No tienes citas activas
          </h2>
          <p style="
            opacity: 0.8; 
            font-size: 0.95rem;
            line-height: 1.6;
            max-width: 280px;
            margin: 0 auto;
          ">
            Todas tus citas han sido canceladas
          </p>
        </div>
      `;
      return;
    }

    // Limpiar contenedor
    contenedor.innerHTML = "";
   
    // Crear tarjetas
    citasActivas.forEach(function(cita, index) {
      console.log(`✅ Cita ${index + 1}:`, cita);
     
      const div = document.createElement("div");
      div.className = "cita-card";
     
      // Formatear fecha
      const fechaFormateada = new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Estado
      let estadoHTML = "";
      if (cita.estado === "pendiente") {
        estadoHTML = '<span class="estado-badge pendiente">⏳ Cita Reservada</span>';
      } else if (cita.estado === "realizada") {
        estadoHTML = '<span class="estado-badge realizada">✓ Realizada</span>';
      } else {
        estadoHTML = `<span class="estado-badge">${cita.estado}</span>`;
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
        ${cita.estado === "pendiente" 
          ? `<button onclick="cancelarCita(${cita.id})" class="btn-cancelar">❌ Cancelar cita</button>`
          : ""
        }
      `;
     
      contenedor.appendChild(div);
    });

    console.log("✅ === CITAS CARGADAS EXITOSAMENTE ===");

  } catch (error) {
    console.error("❌ === ERROR EN CARGAR CITAS ===");
    console.error("Tipo:", error.name);
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
   
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
        <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 16px;">
          ${error.message}
        </p>
        <button onclick="location.reload()" style="
          padding: 10px 20px;
          background: var(--accent, #c44bd6);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">
          🔄 Reintentar
        </button>
      </div>
    `;
  }
}

// Función para cancelar cita
window.cancelarCita = async function(citaId) {
  console.log("🗑️ === INICIANDO CANCELACIÓN ===");
  console.log("Cita ID:", citaId);
 
  const contenedor = document.getElementById("citasContainer");

  if (!confirm("¿Estás seguro de que quieres cancelar esta cita?")) {
    console.log("❌ Cancelación abortada");
    return;
  }

  try {
    console.log("📤 Enviando solicitud...");
   
    const res = await fetchConAuth(`${backendURL}?action=cancelar_cita`, {
      method: "POST",
      body: JSON.stringify({ cita_id: citaId })
    });

    if (!res) {
      console.error("❌ fetchConAuth devolvió null");
      return;
    }

    console.log("📡 Status:", res.status);
   
    const data = await res.json();
    console.log("📦 Respuesta:", data);

    if (res.ok && data.success) {
      alert("✅ Cita cancelada correctamente");
      console.log("🔄 Recargando citas...");
      await cargarCitas(contenedor);
    } else {
      const errorMsg = data.error || data.message || "Error desconocido";
      console.error("❌ Error:", errorMsg);
      alert("No se pudo cancelar: " + errorMsg);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    alert("Error de conexión");
  }
}

console.log("✅ mis_citas.js cargado");