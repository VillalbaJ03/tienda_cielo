// Edge Function: recibe la foto de un empaque (JPEG base64) y devuelve
// el nombre del producto usando Gemini (capa gratuita).
// La API key vive en el secreto GEMINI_API_KEY, nunca en el frontend.
//
// Desplegar:  supabase functions deploy reconocer-producto --no-verify-jwt --project-ref psykimlermiclwnfiaub
// Secreto:    supabase secrets set GEMINI_API_KEY=<tu key> --project-ref psykimlermiclwnfiaub

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const { imagen } = await req.json();
    if (!imagen || typeof imagen !== 'string') return json({ error: 'Falta la imagen (JPEG base64)' }, 400);
    if (imagen.length > 2_000_000) return json({ error: 'Imagen demasiado grande' }, 413);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'GEMINI_API_KEY no configurada en los secretos' }, 500);

    const res = await fetch(
      // Alias que siempre apunta al modelo flash vigente (evita quedar
      // atados a una versión que Google retire)
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text:
                  'Identifica el producto que aparece en esta foto de un empaque de tienda. ' +
                  'Responde SOLO un JSON con la forma {"nombre": "Marca Producto Presentación"}, ' +
                  'por ejemplo {"nombre": "Doritos Mega Queso 200 g"}. ' +
                  'Usa el idioma del empaque. Si no se distingue ningún producto, responde {"nombre": null}.',
              },
              { inline_data: { mime_type: 'image/jpeg', data: imagen } },
            ],
          }],
          generationConfig: { response_mime_type: 'application/json', temperature: 0 },
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      return json({ error: data?.error?.message || `Gemini respondió ${res.status}` }, 502);
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    let nombre: string | null = null;
    try { nombre = JSON.parse(texto)?.nombre ?? null; } catch { nombre = null; }

    return json({ nombre });
  } catch (e) {
    return json({ error: `Error interno: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }
});
