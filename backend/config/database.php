<?php

class Database
{
    private $host = "localhost";
    private $db_name = "ProBarberSystem";
    private $username = "root";
    private $password = "";
    private $conn;

    public function getConnection()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4",
                $this->username,
                $this->password
            );

            // 🔒 Configuración profesional de PDO
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // excepciones
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // fetch limpio
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // seguridad total en prepared statements

        } catch (PDOException $e) {
            // ❌ Nunca mostrar errores sensibles en producción
            die("❌ Error de conexión a la base de datos: " . $e->getMessage());
        }

        return $this->conn;
    }
}

