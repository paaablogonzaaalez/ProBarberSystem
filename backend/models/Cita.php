<?php
class Cita {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function crearCita($data): bool {
    $sql = "INSERT INTO citas (fecha, hora, servicio, cliente_id) 
            VALUES (:fecha, :hora, :servicio, :cliente_id)";
    $stmt = $this->db->prepare($sql);
    return $stmt->execute([
        ':fecha' => $data['fecha'],
        ':hora' => $data['hora'],
        ':servicio' => $data['servicio'],
        ':cliente_id' => $data['cliente_id']  // <-- importante
    ]);
}

?>
