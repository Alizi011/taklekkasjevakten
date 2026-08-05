<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Hent alle henvendelser til Admin Dashboard
    $stmt = $pdo->query("SELECT * FROM inquiries ORDER BY created_at DESC");
    $data = $stmt->fetchAll();
    echo json_encode($data);
    exit();
}

if ($method === 'POST') {
    // Ta imot ny henvendelse fra skjema eller kalkulator
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['customer_name']) || !isset($input['phone'])) {
        echo json_encode(["success" => false, "message" => "Ugyldig data"]);
        exit();
    }

    $sql = "INSERT INTO inquiries (inquiry_type, customer_name, phone, email, address, city, roof_type, roof_area_sqm, leak_severity, estimated_price, notes) 
            VALUES (:type, :name, :phone, :email, :address, :city, :roof_type, :area, :severity, :price, :notes)";
    
    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute([
        ':type' => $input['inquiry_type'] ?? 'standard',
        ':name' => $input['customer_name'],
        ':phone' => $input['phone'],
        ':email' => $input['email'] ?? '',
        ':address' => $input['address'] ?? '',
        ':city' => $input['city'] ?? '',
        ':roof_type' => $input['roof_type'] ?? '',
        ':area' => $input['roof_area_sqm'] ?? null,
        ':severity' => $input['leak_severity'] ?? '',
        ':price' => $input['estimated_price'] ?? '',
        ':notes' => $input['notes'] ?? ''
    ]);

    echo json_encode(["success" => $success, "id" => $pdo->lastInsertId()]);
    exit();
}

if ($method === 'PUT') {
    // Oppdater status (f.eks. fra "ny" til "kontaktet") fra Admin Dashboard
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['id']) && isset($input['status'])) {
        $stmt = $pdo->prepare("UPDATE inquiries SET status = :status WHERE id = :id");
        $success = $stmt->execute([
            ':status' => $input['status'],
            ':id' => $input['id']
        ]);
        echo json_encode(["success" => $success]);
        exit();
    }
}