const registerForm = document.getElementById("registerForm");
const mensajeDiv = document.getElementById("mensaje");
const backendURL = "http://192.168.1.34/ProBarberSystem/backend/index.php";

registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("regNombre").value;
      const apellidos = document.getElementById("regApellidos").value;
      const telefono = document.getElementById("regTelefono").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;


      // Preparar objeto para enviar al backend
      const datosRegistro = {
        nombre,
        apellidos,
        telefono,
        email,
        password  
      };

      try {
        const res = await fetch(`${backendURL}?action=register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosRegistro)
        });

        const data = await res.json();

        if (res.ok) {
          mensajeDiv.textContent = "Registro completado con éxito";
          mensajeDiv.style.color = "green";

          setTimeout(() => {
            window.location.href = "login.html";
          }, 1000);
        } else {
          mensajeDiv.textContent = "" + (data.error || "Error al registrarse");
          mensajeDiv.style.color = "red";
        }
      } catch (err) {
        mensajeDiv.textContent = " Error de conexión: " + err;
        mensajeDiv.style.color = "red";
      }
    });
