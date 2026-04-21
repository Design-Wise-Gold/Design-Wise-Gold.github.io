<?php
// Archivo: public/api/procesar_formulario.php
// Valida reCAPTCHA v3 y guarda el formulario en MySQL

// 1. Cabeceras de seguridad
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Ajusta a tu dominio en producción
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
    exit;
}

// 2. Credenciales de Base de Datos
define('DB_HOST',     'localhost');
define('DB_NAME',     'u574102851_contact_forms');
define('DB_USER',     'u574102851_contact_user');
define('DB_PASS',     'Contact1q2w3e$R%T&Y');
define('DB_CHARSET',  'utf8mb4');

// 3. Clave privada reCAPTCHA v3 (Secret Key — solo en servidor)
$secretKey = "6LehwK0sAAAAAOHOI8vdKaRkj0Prxh7FUndm-zz4";

// 4. Leer payload JSON del frontend
$jsonString = file_get_contents('php://input');
$payload    = json_decode($jsonString, true);

if (!$payload || !isset($payload['recaptcha']) || !isset($payload['data'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos o inválidos."]);
    exit;
}

$token    = $payload['recaptcha'];
$formData = $payload['data'];

// 5. Sanitización de los datos del formulario
$email       = filter_var($formData['business-email']   ?? '', FILTER_SANITIZE_EMAIL);
$firmName    = htmlspecialchars(strip_tags($formData['legal-name']       ?? ''));
$contactName = htmlspecialchars(strip_tags($formData['primary-contact']  ?? ''));
$phone       = htmlspecialchars(strip_tags($formData['phone-number']     ?? ''));

// Validación básica
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "El email no tiene un formato válido."]);
    exit;
}

if (empty($firmName) || empty($contactName) || empty($phone)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Todos los campos son obligatorios."]);
    exit;
}

// 6. Validar token con Google reCAPTCHA v3
$recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
$postData     = http_build_query([
    'secret'   => $secretKey,
    'response' => $token
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,            $recaptchaUrl);
curl_setopt($ch, CURLOPT_POST,           true);
curl_setopt($ch, CURLOPT_POSTFIELDS,     $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$googleResponse = curl_exec($ch);
$curlError      = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error validando con Google: " . $curlError]);
    exit;
}

$recaptchaResult = json_decode($googleResponse, true);

// 7. Evaluar score reCAPTCHA (>= 0.5 → humano)
if (
    isset($recaptchaResult['success'])  &&
    $recaptchaResult['success'] === true &&
    isset($recaptchaResult['score'])    &&
    $recaptchaResult['score'] >= 0.5
) {

    // ✅ USUARIO HUMANO — Guardar en la base de datos

    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        // Crear tabla si no existe (corre solo la primera vez)
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS intermediary_applications (
                id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                firm_name       VARCHAR(255)  NOT NULL,
                contact_name    VARCHAR(255)  NOT NULL,
                business_email  VARCHAR(255)  NOT NULL,
                phone           VARCHAR(60)   NOT NULL,
                recaptcha_score DECIMAL(3,2)  NOT NULL,
                submitted_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $stmt = $pdo->prepare("
            INSERT INTO intermediary_applications
                (firm_name, contact_name, business_email, phone, recaptcha_score)
            VALUES
                (:firm_name, :contact_name, :business_email, :phone, :recaptcha_score)
        ");

        $stmt->execute([
            ':firm_name'       => $firmName,
            ':contact_name'    => $contactName,
            ':business_email'  => $email,
            ':phone'           => $phone,
            ':recaptcha_score' => $recaptchaResult['score'],
        ]);

        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Application received. We will contact you shortly.",
            "score"   => $recaptchaResult['score']
        ]);

    } catch (PDOException $e) {
        // No exponer detalles técnicos al cliente
        error_log("DB Error (intermediary form): " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "An internal error occurred. Please try again later."
        ]);
    }

} else {

    // ❌ POSIBLE BOT
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Security check failed. Suspicious activity detected.",
        "details" => $recaptchaResult['error-codes'] ?? []
    ]);
}
?>
