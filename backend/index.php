<?php
ob_start();
ini_set('display_errors', 0); // evita que los errores aparezcan en HTML
error_reporting(E_ALL);

// ==============================
// Backend Router - ProBarberSystem
// ==============================

// Cargar Composer y librerías
require_once __DIR__ . '/../vendor/autoload.php';

// Cargar configuración y clases
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/UsuariosController.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Conexión a base de datos
$db = (new Database())->getConnection();

// Instanciar controlador de usuario
$usuarioController = new UsuarioController($db);

// Configurar cabeceras generales para JSON y CORS (útil para PWA)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Capturar acción desde GET
$action = $_GET['action'] ?? '';

// ==============================
// RUTAS
// ==============================

switch($action) {

    // ----------------------
    // Registro de usuario
    // ----------------------
    case 'register':
        $usuarioController->registrar();
        break;

    // ----------------------
    // Login
    // ----------------------
    case 'login':
        $usuarioController->login();
        break;

    // ----------------------
    // Ruta de prueba protegida (requiere token JWT)
    // ----------------------
    case 'perfil':
        $usuarioData = AuthMiddleware::verificarToken();
        ob_clean();
        echo json_encode([
            "mensaje" => "Ruta protegida funcionando",
            "usuario" => $usuarioData
        ]);
        break;

    // ----------------------
    // Reservar cita
    // ----------------------
    case 'reservar':
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['fecha'], $data['hora'], $data['servicio'], $data['cliente_id'])) {
            http_response_code(400);
            ob_clean();
            echo json_encode(["error" => "Datos incompletos"]);
            break;
        }

        require_once __DIR__ . '/models/Cita.php';
        $citaModel = new Cita($db);

        if ($citaModel->crearCita($data)) {
            ob_clean();
            echo json_encode(["mensaje" => "Cita registrada correctamente"]);
        } else {
            http_response_code(500);
            ob_clean();
            echo json_encode(["error" => "No se pudo registrar la cita"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        ob_clean();
        echo json_encode(["error" => "Excepción: ".$e->getMessage()]);
    }
    break;


    // ----------------------
    // Ruta por defecto
    // ----------------------
    default:
        ob_clean();
        echo json_encode([
            "mensaje" => "API ProBarberSystem funcionando. Accede a /index.php?action=register o login."
        ]);
        break;
}
