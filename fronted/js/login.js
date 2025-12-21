const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const mensajeDiv = document.getElementById("mensaje");
  const backendURL = "http://192.168.1.39/ProBarberSystem/backend/index.php";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("logEmail").value;
    const password = document.getElementById("logPassword").value;

    try {
      const res = await fetch(`${backendURL}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("usuarioNombre", data.usuario.nombre);

        mensajeDiv.textContent = "Inicio de sesión exitoso";
        mensajeDiv.style.color = "green";

        setTimeout(() => {
          window.location.href = "../pages/seleccionar_fecha.html";
        }, 1000);

      } else {
        mensajeDiv.textContent =
          "" + (data.error || "Correo / Contraseña incorrectas.");
        mensajeDiv.style.color = "red";
      }

    } catch (err) {
      mensajeDiv.textContent = " Error de conexión con el servidor";
      mensajeDiv.style.color = "red";
      console.error(err);
    }
  });
}
