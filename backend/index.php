<?php
ob_start();
ini_set('display_errors', 0);
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

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
    // Reservar cita (CON DEBUG)
    // ----------------------
    case 'reservar':
        try {
            // 🔍 Obtener datos crudos
            $rawData = file_get_contents("php://input");
            
            // 🔍 Log de datos recibidos
            error_log("====== RESERVAR CITA - DEBUG ======");
            error_log("Datos crudos recibidos: " . $rawData);
            
            $data = json_decode($rawData, true);
            
            // 🔍 Log después de decodificar
            error_log("Datos decodificados: " . print_r($data, true));
            error_log("Tipo de data: " . gettype($data));
            
            // Verificar si el JSON es válido
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    "success" => false, 
                    "error" => "JSON inválido: " . json_last_error_msg()
                ]);
                error_log("Error JSON: " . json_last_error_msg());
                break;
            }

            // 🔍 Verificar cada campo individualmente
            $camposFaltantes = [];
            if (!isset($data['fecha'])) $camposFaltantes[] = 'fecha';
            if (!isset($data['hora'])) $camposFaltantes[] = 'hora';
            if (!isset($data['servicio_id'])) $camposFaltantes[] = 'servicio_id';
            if (!isset($data['cliente_id'])) $camposFaltantes[] = 'cliente_id';

            if (!empty($camposFaltantes)) {
                http_response_code(400);
                ob_clean();
                error_log("Campos faltantes: " . implode(', ', $camposFaltantes));
                echo json_encode([
                    "success" => false, 
                    "error" => "Faltan estos campos: " . implode(', ', $camposFaltantes),
                    "datos_recibidos" => $data,
                    "campos_faltantes" => $camposFaltantes
                ]);
                break;
            }

            // 🔍 Log de validación de tipos
            error_log("Validación de campos:");
            error_log("  - fecha: " . $data['fecha'] . " (tipo: " . gettype($data['fecha']) . ")");
            error_log("  - hora: " . $data['hora'] . " (tipo: " . gettype($data['hora']) . ")");
            error_log("  - servicio_id: " . $data['servicio_id'] . " (tipo: " . gettype($data['servicio_id']) . ")");
            error_log("  - cliente_id: " . $data['cliente_id'] . " (tipo: " . gettype($data['cliente_id']) . ")");

            require_once __DIR__ . '/models/Cita.php';
            $citaModel = new Cita($db);

            // Prevención de cita duplicada
            $stmt = $db->prepare("SELECT COUNT(*) FROM citas WHERE fecha = :fecha AND hora = :hora");
            $stmt->execute([
                ':fecha' => $data['fecha'],
                ':hora' => $data['hora']
            ]);

            if ($stmt->fetchColumn() > 0) {
                http_response_code(409);
                ob_clean();
                error_log("Hora no disponible: " . $data['fecha'] . " " . $data['hora']);
                echo json_encode(["success" => false, "error" => "Hora no disponible"]);
                break;
            }

            // 🔍 Intentar crear cita
            error_log("Intentando crear cita...");
            
            if ($citaModel->crearCita($data)) {
                ob_clean();
                error_log("✅ Cita creada correctamente");
                echo json_encode(["success" => true, "message" => "Cita registrada correctamente"]);
            } else {
                http_response_code(500);
                ob_clean();
                error_log("❌ Error al crear cita en la BD");
                echo json_encode(["success" => false, "error" => "No se pudo registrar la cita"]);
            }

        } catch (PDOException $e) {
            http_response_code(500);
            ob_clean();
            error_log("❌ Error PDO: " . $e->getMessage());
            echo json_encode(["success" => false, "error" => "Error de base de datos: " . $e->getMessage()]);
        } catch (Exception $e) {
            http_response_code(500);
            ob_clean();
            error_log("❌ Excepción general: " . $e->getMessage());
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