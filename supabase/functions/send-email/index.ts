import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'to, subject und html erforderlich' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || to.includes(';') || to.includes(',')) {
      return new Response(JSON.stringify({ error: 'Ungültige E-Mail-Adresse' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Subject und HTML Länge begrenzen
    if (subject.length > 500) {
      return new Response(JSON.stringify({ error: 'Betreff zu lang (max 500 Zeichen)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (html.length > 100000) {
      return new Response(JSON.stringify({ error: 'HTML-Body zu groß (max 100KB)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let status = 'skipped';
    let resendId: string | null = null;
    let errorMessage: string | null = null;

    // Resend senden, falls API-Key konfiguriert
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SG Hünstetten <noreply@sg-huenstetten.de>',
            to: [to],
            subject,
            html,
          }),
        });
        const result = await response.json();
        if (response.ok) {
          status = 'sent';
          resendId = result.id ?? null;
        } else {
          status = 'failed';
          errorMessage = result.message ?? JSON.stringify(result);
        }
      } catch (err) {
        status = 'failed';
        errorMessage = String(err);
      }
    }

    // Immer in sent_emails loggen
    await supabaseAdmin.from('sent_emails').insert({
      recipient: to,
      subject,
      html_body: html,
      status,
      resend_id: resendId,
      error_message: errorMessage,
    });

    return new Response(
      JSON.stringify({ status, resendId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
