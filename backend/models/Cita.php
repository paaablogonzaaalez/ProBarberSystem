<?php
class Cita {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function crearCita($data): bool {
        // Primero, obtener el nombre del servicio
        $stmtServicio = $this->db->prepare("SELECT nombre FROM servicios WHERE id = :servicio_id");
        $stmtServicio->execute([':servicio_id' => $data['servicio_id']]);
        $servicio = $stmtServicio->fetch(PDO::FETCH_ASSOC);
        $tipo_servicio = $servicio ? $servicio['nombre'] : 'Servicio desconocido';

        // Obtener datos del cliente
        $stmtCliente = $this->db->prepare("SELECT nombre, telefono FROM clientes WHERE id = :cliente_id");
        $stmtCliente->execute([':cliente_id' => $data['cliente_id']]);
        $cliente = $stmtCliente->fetch(PDO::FETCH_ASSOC);

        $sql = "INSERT INTO citas (fecha, hora, servicio_id, tipo_servicio, cliente_id, nombre_cliente, telefono_cliente)
                VALUES (:fecha, :hora, :servicio_id, :tipo_servicio, :cliente_id, :nombre_cliente, :telefono_cliente)";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':fecha' => $data['fecha'],
            ':hora' => $data['hora'],
            ':servicio_id' => $data['servicio_id'],
            ':tipo_servicio' => $tipo_servicio,
            ':cliente_id' => $data['cliente_id'],
            ':nombre_cliente' => $cliente['nombre'] ?? 'Desconocido',
            ':telefono_cliente' => $cliente['telefono'] ?? ''
        ]);
    }
}
?>