export async function POST({ request }) {
  try {
    // 1. Recibir y parsear el payload enviado desde el frontend
    const payload = await request.json();
    const token = payload.recaptcha;
    const formData = payload.data; // Aquí están los datos sensibles del formulario!

    // 2. Preparar la petición a Google reCAPTCHA
    const recaptchaURL = 'https://www.google.com/recaptcha/api/siteverify';
    const requestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    // Obtenemos la llave secreta de las variables de entorno de Astro (.env)
    // Sustituye import.meta.env.RECAPTCHA_SECRET_KEY si tienes otro nombre.
    const secretKey = import.meta.env.RECAPTCHA_SECRET_KEY || "TU_SECRET_KEY_PRIVADA";

    const requestBody = new URLSearchParams({
      secret: secretKey,
      response: token          
    });

    // 3. Validar el token con Google
    const recaptchaCheck = await fetch(recaptchaURL, {
      method: "POST",
      headers: requestHeaders,
      body: requestBody.toString()
    });

    const recaptchaData = await recaptchaCheck.json();

    // 4. MÁXIMA SEGURIDAD: Verificar éxito Y un score confiable
    // En v3, el score va de 0.0 (Bot muy probable) a 1.0 (Humano muy probable)
    // 0.5 es un buen umbral medio.
    if (recaptchaData.success && recaptchaData.score > 0.5) {
      
      // ==========================================
      // ✅ ZONA SEGURA: EL USUARIO ES HUMANO ✅
      // ==========================================
      
      // AQUÍ DEBES PROCESAR LOS DATOS (formData)
      // Ej: Mandar correo por Resend/Nodemailer, guardar en Base de Datos (Supabase, Firebase, etc.)
      console.log("🔒 Validación Exitosa. Score:", recaptchaData.score);
      console.log("📨 Datos a procesar de forma segura:", formData);
      
      // SIMULAMOS que guardamos los datos...
      // await enviarCorreo(formData); 
      // await guardarEnBD(formData);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Form processing successful",
        score: recaptchaData.score 
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {
      // ==========================================
      // ❌ ZONA DE PELIGRO: POSIBLE BOT ❌
      // ==========================================
      console.warn("⚠️ Validación bloqueada. Es posible que sea un bot. Score:", recaptchaData.score);
      console.warn("Errores de Google:", recaptchaData['error-codes']);

      return new Response(JSON.stringify({ 
        success: false, 
        message: "Security validation failed. Suspected bot activity.",
        score: recaptchaData.score
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error("Error procesando POST /recaptcha:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Internal server error processing the request." 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}