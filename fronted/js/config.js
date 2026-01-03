const backendURL = (() => {
  const hostname = location.hostname;
  
  // ✅ SIEMPRE usar HTTP en desarrollo local
  // Solo cambiar a HTTPS cuando tengas un certificado SSL válido en producción
  if (hostname === "localhost" || 
      hostname === "127.0.0.1" || 
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.20.") ||
      hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") ||
      hostname.startsWith("172.23.") ||
      hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") ||
      hostname.startsWith("172.26.") ||
      hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") ||
      hostname.startsWith("172.29.") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.")) {
    return `http://${hostname}/ProBarberSystem/backend/index.php`;
  }
  
  // ⚠️ Producción: Solo usar HTTPS si tienes certificado SSL válido
  // Si no tienes certificado, cambiar a http://
  return `http://${hostname}/ProBarberSystem/backend/index.php`;
})();

console.log("✅ Backend URL configurada:", backendURL);