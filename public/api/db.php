<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'c2d9sf1au.mysql.service.one.com';
$db   = 'c2d9sf1au_taklekkasjevakten';
$user = 'c2d9sf1au_taklekkasjevakten';
$pass = 'DITT_DATABASE_PASSORD'; // Bytt ut med passordet du satte i One.com

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Kunne ikke koble til databasen: " . $e->getMessage()]);
    exit();
}