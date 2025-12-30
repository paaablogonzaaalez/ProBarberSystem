<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class BarberoController
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
        header("Content-Type: application/json; charset=UTF-8");
    }

    /**
     * Obtener todas las citas de una fecha específica
     */
    public function obtenerCitasPorFecha()
    {
        // Verificar que el usuario es barbero
        $usuarioData = AuthMiddleware::verificarToken();
        
        if (!isset($usuarioData->rol) || $usuarioData->rol !== 'barbero') {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "error" => "Acceso denegado. Solo barberos pueden acceder."
            ]);
            return;
        }

        $fecha = $_GET['fecha'] ?? date('Y-m-d');

        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.id,
                    c.fecha,
                    c.hora,
                    c.estado,
                    c.tipo_servicio,
                    c.nombre_cliente,
                    c.telefono_cliente,
                    cl.email,
                    cl.notas
                FROM citas c
                LEFT JOIN clientes cl ON c.cliente_id = cl.id
                WHERE c.fecha = :fecha
                ORDER BY c.hora ASC
            ");

            $stmt->execute([':fecha' => $fecha]);
            $citas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Estadísticas del día
            $total = count($citas);
            $pendientes = 0;
            $realizadas = 0;
            $canceladas = 0;

            foreach ($citas as $cita) {
                switch ($cita['estado']) {
                    case 'pendiente':
                        $pendientes++;
                        break;
                    case 'realizada':
                        $realizadas++;
                        break;
                    case 'cancelada':
                        $canceladas++;
                        break;
                }
            }

            echo json_encode([
                "success" => true,
                "citas" => $citas,
                "estadisticas" => [
                    "total" => $total,
                    "pendientes" => $pendientes,
                    "realizadas" => $realizadas,
                    "canceladas" => $canceladas
                ]
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "error" => "Error al obtener citas: " . $e->getMessage()
            ]);
        }
    }

    /**
     * Marcar cita como realizada
     */
    public function marcarComoRealizada()
    {
        $usuarioData = AuthMiddleware::verificarToken();
        
        if (!isset($usuarioData->rol) || $usuarioData->rol !== 'barbero') {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "error" => "Acceso denegado"
            ]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['cita_id'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => "ID de cita no proporcionado"
            ]);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE citas 
                SET estado = 'realizada' 
                WHERE id = :cita_id AND estado = 'pendiente'
            ");

            if ($stmt->execute([':cita_id' => $data['cita_id']])) {
                echo json_encode([
                    "success" => true,
                    "message" => "Cita marcada como realizada"
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "error" => "No se pudo actualizar la cita"
                ]);
            }

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "error" => "Error: " . $e->getMessage()
            ]);
        }
    }

    /**
     * Obtener resumen semanal
     */
    public function obtenerResumenSemanal()
    {
        $usuarioData = AuthMiddleware::verificarToken();
        
        if (!isset($usuarioData->rol) || $usuarioData->rol !== 'barbero') {
            http_response_code(403);
            echo json_encode(["success" => false, "error" => "Acceso denegado"]);
            return;
        }

        try {
            // Obtener lunes y domingo de la semana actual
            $hoy = new DateTime();
            $diaSemana = $hoy->format('N'); // 1 (lunes) a 7 (domingo)
            $lunes = clone $hoy;
            $lunes->modify('-' . ($diaSemana - 1) . ' days');
            $domingo = clone $lunes;
            $domingo->modify('+6 days');

            $stmt = $this->db->prepare("
                SELECT 
                    DATE(fecha) as dia,
                    COUNT(*) as total_citas,
                    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado = 'realizada' THEN 1 ELSE 0 END) as realizadas
                FROM citas
                WHERE fecha BETWEEN :lunes AND :domingo
                GROUP BY DATE(fecha)
                ORDER BY fecha ASC
            ");

            $stmt->execute([
                ':lunes' => $lunes->format('Y-m-d'),
                ':domingo' => $domingo->format('Y-m-d')
            ]);

            $resumen = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "resumen" => $resumen,
                "rango" => [
                    "inicio" => $lunes->format('Y-m-d'),
                    "fin" => $domingo->format('Y-m-d')
                ]
            ]);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "error" => "Error: " . $e->getMessage()
            ]);
        }
    }
}
?>