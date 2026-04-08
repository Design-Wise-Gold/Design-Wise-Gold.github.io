<?php
// Archivo: public/api/procesar_formulario.php
// Este es el endpoint backend (CALLBACK) que valida el reCAPTCHA y procesa el formulario

// 1. Cabeceras de seguridad y tipo de contenido (Permitir CORS si el frontend está en otro dominio)
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

// 2. TUS CLAVES (Reemplazar con las correctas)
// La Clave Privada (Secret Key) SOLO debe estar en el servidor, jamás visible al usuario.
$secretKey = "6LehwK0sAAAAAOHOI8vdKaRkj0Prxh7FUndm-zz4"; 

// 3. Leer el payload en formato JSON que envía el frontend
$jsonString = file_get_contents('php://input');
$payload = json_decode($jsonString, true);

if (!$payload || !isset($payload['recaptcha']) || !isset($payload['data'])) {
    http_response_code(400); // Bad Request
    echo json_encode(["success" => false, "message" => "Datos incompletos o inválidos."]);
    exit;
}

$token = $payload['recaptcha']; // El token generado por el Frontend con la llave pública
$formData = $payload['data']; // Los datos que llenó el usuario: 'legal-name', 'business-email', etc.

// 4. MÉTODOS DE SEGURIDAD PARA EL FORMULARIO (Sanitización)
$email = filter_var($formData['business-email'] ?? '', FILTER_SANITIZE_EMAIL);
$name = htmlspecialchars(strip_tags($formData['legal-name'] ?? ''));
$contactName = htmlspecialchars(strip_tags($formData['primary-contact'] ?? ''));
$phone = htmlspecialchars(strip_tags($formData['phone-number'] ?? ''));

// 5. Preparar la llamada a la API de reCAPTCHA
$recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
$postData = http_build_query([
    'secret' => $secretKey,
    'response' => $token
]);

// 6. Hacer la petición a Google de forma segura usando cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $recaptchaUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
// Verifica el SSL para evitar ataques Man-in-the-Middle (Recomendado tener = true en producción)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); 

$googleResponse = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error validando con Google: " . $curlError]);
    exit;
}

$recaptchaResult = json_decode($googleResponse, true);

// 7. Evaluar el score de reCAPTCHA v3 (>= 0.5 es un humano razonablemente seguro)
if (isset($recaptchaResult['success']) && $recaptchaResult['success'] === true && isset($recaptchaResult['score']) && $recaptchaResult['score'] >= 0.5) {
    
    // ===============================================
    // ✅ ZONA SEGURA: EL USUARIO ES HUMANO ✅
    // ===============================================
    
    // 👉 AQUÍ ES DONDE PROCESAS TU LÓGICA DE NEGOCIO EN PHP 👈
    // Ej: $stmt = $pdo->prepare("INSERT INTO intermediaries (name, email) VALUES (?, ?)"); ...
    // O enviar correo usando PHPMailer...

    http_response_code(200);
    echo json_encode([
        "success" => true, 
        "message" => "Validación correcta. Formulario enviado.",
        "score" => $recaptchaResult['score']
    ]);

} else {
    // ===============================================
    // ❌ ZONA DE PELIGRO: ES UN POSIBLE BOT ❌
    // ===============================================
    http_response_code(403); // Forbidden
    echo json_encode([
        "success" => false, 
        "message" => "Validación de seguridad fallida. Actividad sospechosa.",
        "details" => $recaptchaResult['error-codes'] ?? []
    ]);
}
?>
