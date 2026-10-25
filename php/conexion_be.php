<?php
$conexion = mysqli_connect('localhost', 'root', '', 'plataforma_mercados');

if (!$conexion) {
    exit('No fue posible conectar con la base de datos.');
}

mysqli_set_charset($conexion, 'utf8mb4');
