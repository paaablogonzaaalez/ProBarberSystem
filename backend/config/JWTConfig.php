<?php
// ===============================================
// CONFIGURACIÓN DE JWT - CLAVE FIJA
// ===============================================

// CLAVE FIJA - NO CAMBIAR UNA VEZ EN PRODUCCIÓN
define("JWT_SECRET_KEY", "ProBarberSystem_MiClaveSecreta_2025_NoModificar_XyZ789");

// Constantes de tiempo
define("JWT_DURACION_SEGUNDOS", 60 * 24 * 60 * 60); // 60 días
define("JWT_EMISOR", "ProBarberSystem");
define("JWT_AUDIENCIA", "ProBarberClients");

// IMPORTANTE: 
// - NO cambiar JWT_SECRET_KEY después de que usuarios hayan iniciado sesión
// - Si la cambias, todos los tokens antiguos dejarán de funcionar
// - Los usuarios tendrán que volver a iniciar sesión
?>