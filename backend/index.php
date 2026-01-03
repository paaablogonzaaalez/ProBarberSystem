<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Manejar peticiones OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/UsuariosController.php';
require_once __DIR__ . '/controllers/BarberoController.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// ✅ PRIMERO: Conexión a la base de datos
$db = (new Database())->getConnection();

// ✅ DESPUÉS: Crear controlador
$usuarioController = new UsuarioController($db);

// ===============================================
// FUNCIONES DE EMAIL
// ===============================================

/**
 * Envía email de confirmación de cita
 */
function enviarEmailConfirmacion($db, $citaId) {
    try {
        // Obtener datos de la cita
        $stmt = $db->prepare("
            SELECT 
                c.fecha,
                c.hora,
                c.tipo_servicio,
                cl.nombre,
                cl.email
            FROM citas c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.id = :cita_id
        ");
        $stmt->execute([':cita_id' => $citaId]);
        $cita = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$cita) {
            error_log("❌ No se encontró la cita ID: $citaId");
            return false;
        }
        
        // Formatear fecha y hora
        $fechaObj = new DateTime($cita['fecha']);
        $fechaFormateada = $fechaObj->format('d/m/Y');
        $horaFormateada = substr($cita['hora'], 0, 5);
        
        // 📧 CARGAR PLANTILLA HTML DESDE ARCHIVO EXTERNO
        $rutaPlantilla = __DIR__ . '/../pages/email_confirmacion.html';
        
        if (!file_exists($rutaPlantilla)) {
            error_log("❌ No se encontró el archivo: $rutaPlantilla");
            return false;
        }
        
        $htmlTemplate = file_get_contents($rutaPlantilla);
        
        // Reemplazar placeholders con datos reales
        $mensaje = str_replace(
            ['{{NOMBRE}}', '{{FECHA}}', '{{HORA}}', '{{SERVICIO}}'],
            [$cita['nombre'], $fechaFormateada, $horaFormateada, $cita['tipo_servicio']],
            $htmlTemplate
        );
        
        // Configurar headers
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: ProBarberSystem <noreply@probarber.com>" . "\r\n";
        
        // Enviar email
        if (mail($cita['email'], "✅ Cita Confirmada - ProBarberSystem", $mensaje, $headers)) {
            error_log("✅ Email de confirmación enviado a: {$cita['email']}");
            return true;
        }
        
        error_log("❌ Error al enviar email a: {$cita['email']}");
        return false;
        
    } catch (Exception $e) {
        error_log("❌ Error en enviarEmailConfirmacion: " . $e->getMessage());
        return false;
    }
}

/**
 * Envía email de cancelación de cita
 */
function enviarEmailCancelacion($db, $citaId) {
    try {
        $stmt = $db->prepare("
            SELECT 
                c.fecha,
                c.hora,
                c.tipo_servicio,
                cl.nombre,
                cl.email
            FROM citas c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            WHERE c.id = :cita_id
        ");
        $stmt->execute([':cita_id' => $citaId]);
        $cita = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$cita) return false;
        
        $fechaObj = new DateTime($cita['fecha']);
        $fechaFormateada = $fechaObj->format('d/m/Y');
        $horaFormateada = substr($cita['hora'], 0, 5);
        
        // 📧 CARGAR PLANTILLA HTML DESDE ARCHIVO EXTERNO
        $rutaPlantilla = __DIR__ . '/../pages/email_cancelacion.html';
        
        if (!file_exists($rutaPlantilla)) {
            error_log("❌ No se encontró el archivo: $rutaPlantilla");
            return false;
        }
        
        $htmlTemplate = file_get_contents($rutaPlantilla);
        
        // Reemplazar placeholders
        $mensaje = str_replace(
            ['{{NOMBRE}}', '{{FECHA}}', '{{HORA}}', '{{SERVICIO}}'],
            [$cita['nombre'], $fechaFormateada, $horaFormateada, $cita['tipo_servicio']],
            $htmlTemplate
        );
        
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: ProBarberSystem <noreply@probarber.com>" . "\r\n";
        
        if (mail($cita['email'], "❌ Cita Cancelada - ProBarberSystem", $mensaje, $headers)) {
            error_log("✅ Email de cancelación enviado a: {$cita['email']}");
            return true;
        }
        
        return false;
        
    } catch (Exception $e) {
        error_log("❌ Error en enviarEmailCancelacion: " . $e->getMessage());
        return false;
    }
}

// ===============================================
// SWITCH DE ACCIONES
// ===============================================

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
            $rawData = file_get_contents("php://input");
            $data = json_decode($rawData, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    "success" => false,
                    "error" => "JSON inválido: " . json_last_error_msg()
                ]);
                break;
            }

            // Validar campos requeridos
            $camposFaltantes = [];
            if (!isset($data['fecha'])) $camposFaltantes[] = 'fecha';
            if (!isset($data['hora'])) $camposFaltantes[] = 'hora';
            if (!isset($data['servicio_id'])) $camposFaltantes[] = 'servicio_id';
            if (!isset($data['cliente_id'])) $camposFaltantes[] = 'cliente_id';

            if (!empty($camposFaltantes)) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    "success" => false,
                    "error" => "Faltan estos campos: " . implode(', ', $camposFaltantes)
                ]);
                break;
            }

            // Validar que la fecha no sea pasada
            $fechaCita = new DateTime($data['fecha']);
            $hoy = new DateTime();
            $hoy->setTime(0, 0, 0);

            if ($fechaCita < $hoy) {
                http_response_code(400);
                ob_clean();
                echo json_encode(["success" => false, "error" => "No se pueden reservar citas en fechas pasadas"]);
                break;
            }

            // Validar formato de hora (HH:MM)
            if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $data['hora'])) {
                http_response_code(400);
                ob_clean();
                echo json_encode(["success" => false, "error" => "Formato de hora inválido"]);
                break;
            }

            require_once __DIR__ . '/models/Cita.php';
            $citaModel = new Cita($db);

            // Prevención de cita duplicada
            $stmt = $db->prepare("SELECT COUNT(*) FROM citas WHERE fecha = :fecha AND hora = :hora AND estado != 'cancelada'");
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
                $citaId = $db->lastInsertId();
                
                // Enviar email de confirmación
                enviarEmailConfirmacion($db, $citaId);

                ob_clean();
                echo json_encode(["success" => true, "message" => "Cita registrada correctamente"]);
            } else {
                http_response_code(500);
                ob_clean();
                echo json_encode(["success" => false, "error" => "No se pudo registrar la cita"]);
            }

        } catch (PDOException $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode(["success" => false, "error" => "Error de base de datos: " . $e->getMessage()]);
        } catch (Exception $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode(["success" => false, "error" => "Excepción: " . $e->getMessage()]);
        }
        break;
   
    // ----------------------
    // Obtener horas ocupadas por fecha
    // ----------------------
    case 'horas_ocupadas':
        $fecha = $_GET['fecha'] ?? null;

        if (!$fecha) {
            ob_clean();
            echo json_encode([
                "success" => false,
                "horas_ocupadas" => []
            ]);
            break;
        }

        try {
            $stmt = $db->prepare("
                SELECT hora
                FROM citas
                WHERE fecha = :fecha
                AND estado != 'cancelada'
            ");

            $stmt->execute([':fecha' => $fecha]);
            $horas = $stmt->fetchAll(PDO::FETCH_COLUMN);

            ob_clean();
            echo json_encode([
                "success" => true,
                "horas_ocupadas" => $horas
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode([
                "success" => false,
                "horas_ocupadas" => [],
                "error" => $e->getMessage()
            ]);
        }
        break;

    // ----------------------
    // Obtener citas del usuario autenticado
    // ----------------------
    case 'mis_citas':
        try {
            $usuarioData = AuthMiddleware::verificarToken();
            
            if (!isset($usuarioData->cliente_id)) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    "success" => false,
                    "error" => "No se encontró cliente_id en el token"
                ]);
                break;
            }
            
            $cliente_id = $usuarioData->cliente_id;

            $stmt = $db->prepare("
                SELECT
                    c.id,
                    c.fecha,
                    c.hora,
                    c.estado,
                    c.tipo_servicio,
                    c.servicio_id
                FROM citas c
                WHERE c.cliente_id = :cliente_id
                ORDER BY c.fecha DESC, c.hora DESC
            ");
            
            $stmt->execute([':cliente_id' => $cliente_id]);
            $citas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            ob_clean();
            echo json_encode([
                'success' => true,
                'citas' => $citas
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode([
                'success' => false,
                'error' => 'Error al obtener citas: ' . $e->getMessage()
            ]);
        }
        break;

    // ----------------------
    // Cancelar cita
    // ----------------------
    case 'cancelar_cita':
        try {
            $usuarioData = AuthMiddleware::verificarToken();
            
            if (!isset($usuarioData->cliente_id)) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    "success" => false,
                    "error" => "No se encontró cliente_id en el token"
                ]);
                break;
            }
            
            $cliente_id = $usuarioData->cliente_id;
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['cita_id'])) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    'success' => false,
                    'error' => 'ID de cita no proporcionado'
                ]);
                break;
            }
            
            $cita_id = intval($data['cita_id']);
            
            $stmt = $db->prepare("
                SELECT id, estado
                FROM citas
                WHERE id = :cita_id AND cliente_id = :cliente_id
            ");
            
            $stmt->execute([
                ':cita_id' => $cita_id,
                ':cliente_id' => $cliente_id
            ]);
            
            $cita = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$cita) {
                http_response_code(404);
                ob_clean();
                echo json_encode([
                    'success' => false,
                    'error' => 'Cita no encontrada o no pertenece a este usuario'
                ]);
                break;
            }
            
            if ($cita['estado'] !== 'pendiente') {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    'success' => false,
                    'error' => 'Solo se pueden cancelar citas en estado pendiente'
                ]);
                break;
            }
            
            $updateStmt = $db->prepare("
                UPDATE citas
                SET estado = 'cancelada'
                WHERE id = :cita_id
            ");
            
            if ($updateStmt->execute([':cita_id' => $cita_id])) {
                // Enviar email de cancelación
                enviarEmailCancelacion($db, $cita_id);

                ob_clean();
                echo json_encode([
                    'success' => true,
                    'message' => 'Cita cancelada correctamente'
                ]);
            } else {
                http_response_code(500);
                ob_clean();
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al cancelar la cita'
                ]);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode([
                'success' => false,
                'error' => 'Error al cancelar cita: ' . $e->getMessage()
            ]);
        }
        break;

    // ----------------------
    // Obtener perfil
    // ----------------------
    case 'obtener_perfil':
        try {
            $usuarioData = AuthMiddleware::verificarToken();
           
            if (!isset($usuarioData->id)) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    "success" => false,
                    "error" => "No se encontró usuario_id en el token"
                ]);
                break;
            }
           
            $usuario_id = $usuarioData->id;
           
            $stmt = $db->prepare("
                SELECT
                    id,
                    nombre,
                    apellidos,
                    telefono,
                    email,
                    fecha_registro
                FROM usuarios
                WHERE id = :usuario_id
            ");
           
            $stmt->execute([':usuario_id' => $usuario_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
           
            if (!$usuario) {
                http_response_code(404);
                ob_clean();
                echo json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ]);
                break;
            }
           
            // 📊 CONTAR SOLO CITAS ACTIVAS (sin canceladas)
            $stmtCitas = $db->prepare("
                SELECT COUNT(*) as total
                FROM citas
                WHERE cliente_id = :cliente_id
                AND estado != 'cancelada'
            ");
            $stmtCitas->execute([':cliente_id' => $usuarioData->cliente_id]);
            $totalCitas = $stmtCitas->fetch(PDO::FETCH_ASSOC)['total'];
           
            ob_clean();
            echo json_encode([
                'success' => true,
                'usuario' => [
                    'nombre' => $usuario['nombre'],
                    'apellidos' => $usuario['apellidos'],
                    'telefono' => $usuario['telefono'],
                    'email' => $usuario['email'],
                    'fecha_registro' => $usuario['fecha_registro'],
                    'total_citas' => $totalCitas
                ]
            ]);
           
        } catch (Exception $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode([
                'success' => false,
                'error' => 'Error al obtener perfil: ' . $e->getMessage()
            ]);
        }
        break;

    // ----------------------
    // Actualizar perfil
    // ----------------------
    case 'actualizar_perfil':
        try {
            $usuarioData = AuthMiddleware::verificarToken();
            
            if (!isset($usuarioData->id)) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    "success" => false,
                    "error" => "Token inválido"
                ]);
                break;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['nombre']) || !isset($data['telefono'])) {
                http_response_code(400);
                ob_clean();
                echo json_encode([
                    'success' => false,
                    'error' => 'Datos incompletos'
                ]);
                break;
            }
            
            $stmt = $db->prepare("
                UPDATE usuarios
                SET nombre = :nombre,
                    apellidos = :apellidos,
                    telefono = :telefono
                WHERE id = :usuario_id
            ");
            
            $resultado = $stmt->execute([
                ':nombre' => htmlspecialchars($data['nombre']),
                ':apellidos' => htmlspecialchars($data['apellidos'] ?? ''),
                ':telefono' => $data['telefono'],
                ':usuario_id' => $usuarioData->id
            ]);
            
            if ($resultado) {
                $stmtCliente = $db->prepare("
                    UPDATE clientes
                    SET nombre = :nombre,
                        telefono = :telefono
                    WHERE id = :cliente_id
                ");
                
                $nombreCompleto = trim($data['nombre'] . ' ' . ($data['apellidos'] ?? ''));
                
                $stmtCliente->execute([
                    ':nombre' => $nombreCompleto,
                    ':telefono' => $data['telefono'],
                    ':cliente_id' => $usuarioData->cliente_id
                ]);
                
                ob_clean();
                echo json_encode([
                    'success' => true,
                    'message' => 'Perfil actualizado correctamente'
                ]);
            } else {
                http_response_code(500);
                ob_clean();
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al actualizar perfil'
                ]);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            ob_clean();
            echo json_encode([
                'success' => false,
                'error' => 'Error al actualizar perfil: ' . $e->getMessage()
            ]);
        }
        break;

    // ----------------------
    // Panel del Barbero
    // ----------------------
    case 'citas_por_fecha':
        $barberoController = new BarberoController($db);
        $barberoController->obtenerCitasPorFecha();
        break;

    case 'marcar_realizada':
        $barberoController = new BarberoController($db);
        $barberoController->marcarComoRealizada();
        break;

    case 'resumen_semanal':
        $barberoController = new BarberoController($db);
        $barberoController->obtenerResumenSemanal();
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