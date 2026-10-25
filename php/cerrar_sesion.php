<?php
session_start();
$_SESSION = [];
session_destroy();
header('Location: ../frontend/Inicio%20de%20secion/logout.html');
exit();
