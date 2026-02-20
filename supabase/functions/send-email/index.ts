import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@sg-huenstetten.de';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Fehlende Felder: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let status = 'failed';
    let resendId = null;
    let errorMessage = null;

    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
      });

      const result = await res.json();

      if (res.ok) {
        status = 'sent';
        resendId = result.id;
      } else {
        errorMessage = result.message || 'Resend API Fehler';
        console.error('Resend Fehler:', result);
      }
    } else {
      status = 'skipped';
      errorMessage = 'RESEND_API_KEY nicht konfiguriert';
      console.log('E-Mail (kein API-Key):', subject, '->', to);
    }

    // Log in Datenbank speichern
    await supabase.from('sent_emails').insert({
      recipient: to,
      subject,
      html_body: html,
      status,
      resend_id: resendId,
      error_message: errorMessage,
    });

    return new Response(
      JSON.stringify({ success: status === 'sent' || status === 'skipped', status, resendId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-email Fehler:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
