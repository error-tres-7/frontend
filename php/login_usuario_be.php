<?php
session_start();
require_once __DIR__ . '/conexion_be.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../frontend/Inicio%20de%20secion/logout.html');
    exit();
}

$correo = trim($_POST['correo'] ?? '');
$contrasena = $_POST['contraseña'] ?? '';

if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || $contrasena === '') {
    header('Location: ../frontend/Inicio%20de%20secion/logout.html?error=credenciales');
    exit();
}

$consulta = mysqli_prepare($conexion, 'SELECT id_usuario, nombre, correo, contraseña, rol FROM Usuarios WHERE correo = ?');
mysqli_stmt_bind_param($consulta, 's', $correo);
mysqli_stmt_execute($consulta);
$resultado = mysqli_stmt_get_result($consulta);
$usuario = mysqli_fetch_assoc($resultado);
mysqli_stmt_close($consulta);
mysqli_close($conexion);

if (!$usuario || !password_verify($contrasena, $usuario['contraseña'])) {
    header('Location: ../frontend/Inicio%20de%20secion/logout.html?error=credenciales');
    exit();
}

session_regenerate_id(true);
$_SESSION['id_usuario'] = $usuario['id_usuario'];
$_SESSION['nombre'] = $usuario['nombre'];
$_SESSION['correo'] = $usuario['correo'];
$_SESSION['rol'] = $usuario['rol'];

header('Location: ../frontend/index.html');
exit();
