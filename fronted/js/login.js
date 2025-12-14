const loginForm = document.getElementById("loginForm");
const mensajeDiv = document.getElementById("mensaje");
const backendURL = "http://localhost/ProBarberSystem/backend/index.php";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("logEmail").value;
  const password = document.getElementById("logPassword").value;

  try {
    const res = await fetch(`${backendURL}?action=login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // ✅ Guardar token JWT para futuras reservas
      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("usuarioNombre", data.usuario.nombre);
      mensajeDiv.textContent = "✅ Login correcto. Redirigiendo...";
      mensajeDiv.style.color = "green";

      // Redirigir a la página de selección de fecha
      setTimeout(() => {
        window.location.href = "../pages/seleccionar_fecha.html";
      }, 1000);
    } else {
      mensajeDiv.textContent = "❌ " + (data.error || "Correo / Contraseña incorrectas.");
      mensajeDiv.style.color = "red";
    }
  } catch (err) {
    mensajeDiv.textContent = "❌ Error de conexión: " + err;
    mensajeDiv.style.color = "red";
  }
});
