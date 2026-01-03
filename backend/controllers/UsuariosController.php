<?php
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../config/JWTConfig.php';

use Firebase\JWT\JWT;

class UsuarioController
{
    private $db;
    private $usuarioModel;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
        $this->usuarioModel = new Usuario($dbConnection);
        header("Content-Type: application/json; charset=UTF-8");
    }

    // ======================
    // Registro
    // ======================
    public function registrar()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || !isset($data["nombre"], $data["email"], $data["password"], $data["telefono"])) {
            http_response_code(400);
            echo json_encode(["error" => "Datos incompletos"]);
            return;
        }

        if (!filter_var($data["email"], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "Email inválido"]);
            return;
        }

        if ($this->usuarioModel->verificarEmail($data["email"])) {
            http_response_code(409);
            echo json_encode(["error" => "Este email ya está registrado"]);
            return;
        }

        // Insertar usuario
        $usuarioData = [
            'nombre'    => htmlspecialchars($data['nombre']),
            'apellidos' => htmlspecialchars($data['apellidos'] ?? ''),
            'telefono'  => $data['telefono'] ?? '',
            'email'     => strtolower($data['email']),
            'password'  => $data['password'],
            'rol'       => 'usuario'
        ];

        if (!$this->usuarioModel->crearUsuario($usuarioData)) {
            http_response_code(500);
            echo json_encode(["error" => "Error al crear usuario"]);
            return;
        }

        $usuario_id = $this->db->lastInsertId();
        if (!$usuario_id) {
            http_response_code(500);
            echo json_encode(["error" => "No se pudo obtener el usuario_id"]);
            return;
        }

        // Insertar cliente
        $stmt = $this->db->prepare("INSERT INTO clientes (nombre, telefono, email) VALUES (:nombre, :telefono, :email)");
        if (!$stmt->execute([
            ':nombre' => $usuarioData['nombre'],
            ':telefono' => $usuarioData['telefono'],
            ':email' => $usuarioData['email']
        ])) {
            http_response_code(500);
            echo json_encode(["error" => "No se pudo crear el cliente"]);
            return;
        }

        $cliente_id = $this->db->lastInsertId();
        if (!$cliente_id) {
            http_response_code(500);
            echo json_encode(["error" => "No se pudo obtener el cliente_id"]);
            return;
        }

        // ACTUALIZAR usuarios.cliente_id
        $stmtUpdate = $this->db->prepare("UPDATE usuarios SET cliente_id = :cliente_id WHERE id = :usuario_id");
        $stmtUpdate->execute([
            ':cliente_id' => $cliente_id,
            ':usuario_id' => $usuario_id
        ]);

        // Crear JWT con cliente_id Y rol
        $payload = [
            "iss" => "ProBarberSystem",
            "aud" => "ProBarberClients",
            "iat" => time(),
            "exp" => time() + (60 * 24 * 60 * 60), 
            "data" => [
                "id" => $usuario_id,
                "cliente_id" => $cliente_id,
                "nombre" => $usuarioData["nombre"],
                "apellidos" => $usuarioData["apellidos"],
                "email" => $usuarioData["email"],
                "rol" => "usuario" // 
            ]
        ];

        $jwt = JWT::encode($payload, JWT_SECRET_KEY, 'HS256');

        echo json_encode([
            "mensaje" => "Usuario registrado correctamente",
            "token" => $jwt,
            "usuario" => [
                "id" => $usuario_id,
                "cliente_id" => $cliente_id,
                "nombre" => $usuarioData["nombre"],
                "apellidos" => $usuarioData["apellidos"],
                "email" => $usuarioData["email"],
                "rol" => "usuario"
            ]
        ]);
    }

    // ======================
    // Login (CORREGIDO)
    // ======================
    public function login()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data["email"], $data["password"])) {
            http_response_code(400);
            echo json_encode(["error" => "Datos incompletos"]);
            return;
        }

        $usuario = $this->usuarioModel->login($data["email"], $data["password"]);
        if (!$usuario) {
            http_response_code(401);
            echo json_encode(["error" => "Credenciales incorrectas"]);
            return;
        }

        // BUSCAR O CREAR cliente_id automáticamente
        $stmt = $this->db->prepare("SELECT id FROM clientes WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $usuario['email']]);
        $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $cliente_id = null;

        if ($cliente) {
            // Cliente ya existe
            $cliente_id = $cliente['id'];
        } else {
            // Cliente NO existe, lo creamos automáticamente
            $stmtInsert = $this->db->prepare(
                "INSERT INTO clientes (nombre, telefono, email, notas) 
                 VALUES (:nombre, :telefono, :email, :notas)"
            );
            
            $nombreCompleto = trim($usuario['nombre'] . ' ' . ($usuario['apellidos'] ?? ''));
            
            $stmtInsert->execute([
                ':nombre' => $nombreCompleto,
                ':telefono' => $usuario['telefono'] ?? '',
                ':email' => $usuario['email'],
                ':notas' => 'Cliente creado automáticamente al hacer login'
            ]);

            $cliente_id = $this->db->lastInsertId();
            
            if (!$cliente_id) {
                http_response_code(500);
                echo json_encode(["error" => "No se pudo crear el cliente automáticamente"]);
                return;
            }
        }

        if (!$cliente_id) {
            http_response_code(500);
            echo json_encode(["error" => "No se encontró cliente_id para este usuario"]);
            return;
        }

        // ACTUALIZAR usuarios.cliente_id si no lo tiene
        if (!isset($usuario['cliente_id']) || $usuario['cliente_id'] != $cliente_id) {
            $stmtUpdate = $this->db->prepare("UPDATE usuarios SET cliente_id = :cliente_id WHERE id = :usuario_id");
            $stmtUpdate->execute([
                ':cliente_id' => $cliente_id,
                ':usuario_id' => $usuario['id']
            ]);
        }

        // JWT con cliente_id Y rol garantizados
        $payload = [
            "iss" => "ProBarberSystem",
            "aud" => "ProBarberClients",
            "iat" => time(),
            "exp" => time() + (60 * 24 * 60 * 60), 
            "data" => [
                "id" => $usuario["id"],
                "cliente_id" => $cliente_id,
                "nombre" => $usuario["nombre"],
                "apellidos" => $usuario["apellidos"] ?? '',
                "email" => $usuario["email"],
                "rol" => $usuario["rol"] ?? "usuario" 
            ]
        ];

        $jwt = JWT::encode($payload, JWT_SECRET_KEY, 'HS256');

        echo json_encode([
            "mensaje" => "Login correcto",
            "token" => $jwt,
            "usuario" => [
                "id" => $usuario["id"],
                "cliente_id" => $cliente_id,
                "nombre" => $usuario["nombre"],
                "apellidos" => $usuario["apellidos"] ?? '',
                "email" => $usuario["email"],
                "rol" => $usuario["rol"] ?? "usuario"
            ]
        ]);
    }
}
?>