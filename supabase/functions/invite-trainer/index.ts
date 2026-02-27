import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Auth-Check: Caller muss Admin sein ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Nicht autorisiert' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) {
      return jsonResponse({ error: 'Nicht autorisiert – bitte erneut einloggen' }, 401);
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('kann_administrieren')
      .eq('id', caller.id)
      .single();

    if (!callerProfile?.kann_administrieren) {
      return jsonResponse({ error: 'Nur Administratoren dürfen Trainer einladen' }, 403);
    }

    // --- Input-Validierung ---
    const { profileId, email, firstName, lastName } = await req.json();

    if (!profileId || !email) {
      return jsonResponse({ error: 'Fehlende Felder: profileId, email' }, 400);
    }

    // UUID-Format prüfen
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(profileId)) {
      return jsonResponse({ error: 'Ungültige profileId' }, 400);
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.includes(';') || email.includes(',')) {
      return jsonResponse({ error: 'Ungültige E-Mail-Adresse' }, 400);
    }

    // --- Altes Profil laden (Berechtigungen sichern) ---
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    // --- Supabase Auth-Einladung senden ---
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { first_name: firstName, last_name: lastName },
    });

    if (inviteError) {
      await supabase.from('sent_emails').insert({
        recipient: email,
        subject: `Einladung: ${firstName} ${lastName}`,
        html_body: `<p>Einladung an ${firstName} ${lastName} (${email})</p>`,
        status: 'failed',
        error_message: inviteError.message,
      });
      return jsonResponse({ error: inviteError.message }, 400);
    }

    const newAuthId = inviteData.user?.id;

    if (newAuthId && newAuthId !== profileId && oldProfile) {
      // Supabase hat ein neues Profil per Trigger angelegt (andere UUID).
      // Berechtigungen vom alten Profil auf das neue übertragen,
      // FK-Referenzen umhängen und altes Duplikat löschen.
      //
      // Fehler in Einzelschritten werden geloggt aber blockieren nicht den
      // Gesamterfolg – die Einladung wurde bereits gesendet.
      const migrationErrors: string[] = [];

      const { error: e1 } = await supabase.from('profiles').update({
        first_name:          oldProfile.first_name,
        last_name:           oldProfile.last_name,
        phone:               oldProfile.phone,
        operator_id:         oldProfile.operator_id,
        is_passive:          oldProfile.is_passive,
        ist_trainer:         oldProfile.ist_trainer,
        kann_buchen:         oldProfile.kann_buchen,
        kann_genehmigen:     oldProfile.kann_genehmigen,
        kann_verwalten:      oldProfile.kann_verwalten,
        kann_administrieren: oldProfile.kann_administrieren,
        invited_at:          new Date().toISOString(),
      }).eq('id', newAuthId);
      if (e1) migrationErrors.push(`profiles update: ${e1.message}`);

      const { error: e2 } = await supabase.from('trainer_assignments')
        .update({ user_id: newAuthId })
        .eq('user_id', profileId);
      if (e2) migrationErrors.push(`trainer_assignments: ${e2.message}`);

      const { error: e3 } = await supabase.from('bookings')
        .update({ user_id: newAuthId })
        .eq('user_id', profileId);
      if (e3) migrationErrors.push(`bookings: ${e3.message}`);

      const { error: e4 } = await supabase.from('profiles').delete().eq('id', profileId);
      if (e4) migrationErrors.push(`profiles delete: ${e4.message}`);

      if (migrationErrors.length > 0) {
        console.error('UUID-Migration Teilfehler:', migrationErrors);
      }
    } else if (newAuthId === profileId) {
      // UUID stimmt überein – nur invited_at aktualisieren
      await supabase.from('profiles')
        .update({ invited_at: new Date().toISOString() })
        .eq('id', profileId);
    }

    await supabase.from('sent_emails').insert({
      recipient: email,
      subject: `Einladung zum SG Hünstetten Buchungssystem`,
      html_body: `<p>Einladung an <strong>${firstName} ${lastName}</strong> (${email}) wurde über Supabase Auth versandt.</p>`,
      status: 'sent',
    });

    return jsonResponse({ success: true, userId: newAuthId });
  } catch (err) {
    console.error('invite-trainer Fehler:', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
