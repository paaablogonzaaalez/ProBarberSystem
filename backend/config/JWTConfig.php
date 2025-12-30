<?php

// ===============================================
// CONFIGURACIÓN SEGURA DE JWT
// ===============================================

// 1. Obtener clave secreta desde variable de entorno (PRODUCCIÓN)
// 2. Si no existe, usar clave temporal (SOLO DESARROLLO)
$jwt_secret = getenv('JWT_SECRET_KEY');

if (!$jwt_secret) {
    // IMPORTANTE: En producción, DEBES configurar JWT_SECRET_KEY en el servidor
    // Esta clave temporal es solo para desarrollo local
    $jwt_secret = 'fallback_key_solo_desarrollo_' . bin2hex(random_bytes(16));
    
    // Registrar warning en logs
    error_log("WARNING: Usando JWT_SECRET_KEY temporal. Configura una clave segura en producción.");
}

define("JWT_SECRET_KEY", $jwt_secret);

// ===============================================
// CONSTANTES DE TIEMPO
// ===============================================
define("JWT_DURACION_SEGUNDOS", 60 * 24 * 60 * 60); // 60 días
define("JWT_EMISOR", "ProBarberSystem");
define("JWT_AUDIENCIA", "ProBarberClients");