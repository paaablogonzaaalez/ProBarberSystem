<?php
class Usuario
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // Crear usuario
    public function crearUsuario(array $data): bool
{
    if (empty($data['nombre']) || empty($data['email']) || empty($data['password'])) {
        return false;
    }

    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

    $sql = "INSERT INTO usuarios (nombre, apellidos, telefono, email, password, rol, fecha_registro)
            VALUES (:nombre, :apellidos, :telefono, :email, :password, :rol, NOW())";

    $query = $this->db->prepare($sql);
    return $query->execute([
        ':nombre'    => $data['nombre'],
        ':apellidos' => $data['apellidos'] ?? null,
        ':telefono'  => $data['telefono'],
        ':email'     => strtolower($data['email']),
        ':password'  => $passwordHash,
        ':rol'       => $data['rol'] ?? 'usuario'
    ]);
}


    // Verificar si un email ya existe
    public function verificarEmail(string $email): bool
    {
        $sql = "SELECT id FROM usuarios WHERE email = :email LIMIT 1";
        $query = $this->db->prepare($sql);
        $query->execute([':email' => strtolower($email)]);
        return (bool)$query->fetch();
    }

    // Login
    public function login(string $email, string $password): ?array
    {
        $sql = "SELECT * FROM usuarios WHERE email = :email LIMIT 1";
        $query = $this->db->prepare($sql);
        $query->execute([':email' => strtolower($email)]);
        $usuario = $query->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) return null;

        if (password_verify($password, $usuario['password'])) {
            unset($usuario['password']); // Nunca devolver contraseña
            return $usuario;
        }

        return null;
    }
}
