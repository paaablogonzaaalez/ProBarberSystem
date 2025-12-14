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

        // Validar email
        if (!filter_var($data["email"], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "Email inválido"]);
            return;
        }

        // Comprobar duplicado
        if ($this->usuarioModel->verificarEmail($data["email"])) {
            http_response_code(409);
            echo json_encode(["error" => "Este email ya está registrado"]);
            return;
        }

        $usuarioData = [
            'nombre'    => htmlspecialchars($data['nombre']),
            'apellidos' => htmlspecialchars($data['apellidos'] ?? ''),
            'telefono'  => $data['telefono'] ?? '',
            'email'     => strtolower($data['email']),
            'password'  => $data['password'],
            'rol'       => 'usuario'
];


        if ($this->usuarioModel->crearUsuario($usuarioData)) {
            echo json_encode(["mensaje" => "Usuario registrado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al registrar usuario"]);
        }
    }

    // ======================
    // Login
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

        $payload = [
            "iss" => "ProBarberSystem",
            "aud" => "ProBarberClients",
            "iat" => time(),
            "exp" => time() + (24 * 60 * 60),
            "data" => [
                "id" => $usuario["id"],
                "nombre" => $usuario["nombre"],
                "apellidos" => $usuario["apellidos"] ?? '',
                "email" => $usuario["email"]
            ]
        ];

        $jwt = JWT::encode($payload, JWT_SECRET_KEY, 'HS256');

        echo json_encode([
            "mensaje" => "Login correcto",
            "token" => $jwt,
            "usuario" => [
                "id" => $usuario["id"],
                "nombre" => $usuario["nombre"],
                "apellidos" => $usuario["apellidos"] ?? '',
                "email" => $usuario["email"]
            ]
        ]);
    }
}
