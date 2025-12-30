<?php

require_once __DIR__ . '/../config/JWTConfig.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

class AuthMiddleware
{
    public static function verificarToken()
    {
        $headers = getallheaders();

        if (!isset($headers["Authorization"])) {
            http_response_code(401);
            echo json_encode([
                "error" => "Token no proporcionado",
                "codigo" => "TOKEN_MISSING"
            ]);
            exit;
        }

        $token = str_replace("Bearer ", "", $headers["Authorization"]);

        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET_KEY, 'HS256'));
            
            // Registrar último acceso (opcional, para estadísticas)
            error_log("✅ Token válido - Usuario ID: " . $decoded->data->id);
            
            return $decoded->data;
            
        } catch (ExpiredException $e) {
            http_response_code(401);
            echo json_encode([
                "error" => "Token expirado",
                "codigo" => "TOKEN_EXPIRED",
                "mensaje" => "Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente."
            ]);
            exit;
            
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                "error" => "Token inválido",
                "codigo" => "TOKEN_INVALID",
                "mensaje" => "Token corrupto o manipulado"
            ]);
            exit;
        }
    }
}