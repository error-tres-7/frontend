<?php
require_once __DIR__ . '/conexion_be.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../frontend/Inicio%20de%20secion/logout.html');
    exit();
}

$nombre = trim($_POST['nombre'] ?? '');
$correo = trim($_POST['correo'] ?? '');
$contrasena = $_POST['contraseña'] ?? '';
$rol = $_POST['rol'] ?? 'cliente';

if ($nombre === '' || !filter_var($correo, FILTER_VALIDATE_EMAIL) || strlen($contrasena) < 8) {
    header('Location: ../frontend/Inicio%20de%20secion/logout.html?error=datos');
    exit();
}

if (!in_array($rol, ['cliente', 'comerciante'], true)) {
    $rol = 'cliente';
}

$verificar_correo = mysqli_prepare($conexion, 'SELECT id_usuario FROM Usuarios WHERE correo = ?');
mysqli_stmt_bind_param($verificar_correo, 's', $correo);
mysqli_stmt_execute($verificar_correo);
mysqli_stmt_store_result($verificar_correo);

if (mysqli_stmt_num_rows($verificar_correo) > 0) {
    mysqli_stmt_close($verificar_correo);
    mysqli_close($conexion);
    header('Location: ../frontend/Inicio%20de%20secion/logout.html?error=correo');
    exit();
}
mysqli_stmt_close($verificar_correo);

$hash = password_hash($contrasena, PASSWORD_DEFAULT);
$registro = mysqli_prepare(
    $conexion,
    'INSERT INTO Usuarios (nombre, correo, contraseña, rol) VALUES (?, ?, ?, ?)'
);
mysqli_stmt_bind_param($registro, 'ssss', $nombre, $correo, $hash, $rol);
$registro_exitoso = mysqli_stmt_execute($registro);
mysqli_stmt_close($registro);
mysqli_close($conexion);

if ($registro_exitoso) {
    header('Location: ../frontend/Inicio%20de%20secion/logout.html?registro=exitoso');
    exit();
}

header('Location: ../frontend/Inicio%20de%20secion/logout.html?error=registro');
