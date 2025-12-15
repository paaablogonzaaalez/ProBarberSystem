<?php
class Cita {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function crearCita($data): bool {
        $sql = "INSERT INTO citas (fecha, hora, servicio_id, cliente_id) 
                VALUES (:fecha, :hora, :servicio_id, :cliente_id)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':fecha' => $data['fecha'],
            ':hora' => $data['hora'],
            ':servicio_id' => $data['servicio_id'],
            ':cliente_id' => $data['cliente_id']
        ]);
    }
}
?>
