const backendURL = (() => {
  const hostname = location.hostname;
  
  // Desarrollo local
  if (hostname === "localhost" || 
      hostname === "127.0.0.1" || 
      hostname.startsWith("192.168.1.40") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")) {
    return `http://${hostname}/ProBarberSystem/backend/index.php`;
  }
  
  // Producción (con dominio real)
  return `https://${hostname}/backend/index.php`;
})();

console.log("Backend URL configurada:", backendURL);