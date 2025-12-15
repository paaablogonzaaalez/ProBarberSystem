<?php
ob_start();
ini_set('display_errors', 0); // evita mostrar errores en HTML
error_reporting(E_ALL);

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/UsuariosController.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Conexión a la base de datos
$db = (new Database())->getConnection();
$usuarioController = new UsuarioController($db);

// Cabeceras generales
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Capturar acción
$action = $_GET['action'] ?? '';

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
    // Ruta protegida
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

            if (!isset($data['fecha'], $data['hora'], $data['servicio_id'], $data['cliente_id'])) {
                http_response_code(400);
                ob_clean();
                echo json_encode(["success" => false, "error" => "Datos incompletos"]);
                break;
            }

            require_once __DIR__ . '/models/Cita.php';
            $citaModel = new Cita($db);

            // Prevención de cita duplicada: solo por fecha y hora
            $stmt = $db->prepare("SELECT COUNT(*) FROM citas WHERE fecha = :fecha AND hora = :hora");
            $stmt->execute([
                ':fecha' => $data['fecha'],
                ':hora' => $data['hora']
            ]);

            if ($stmt->fetchColumn() > 0) {
                http_response_code(409);
                ob_clean();
                echo json_encode(["success" => false, "error" => "Hora no disponible"]);
                break;
            }

            // Crear cita
            if ($citaModel->crearCita($data)) {
                ob_clean();
                echo json_encode(["success" => true, "message" => "Cita registrada correctamente"]);
            } else {
                http_response_code(500);
                ob_clean();
                echo json_encode(["success" => false, "error" => "No se pudo registrar la cita"]);
            }

        } catch (Exception $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode(["success" => false, "error" => "Excepción: " . $e->getMessage()]);
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
?>
