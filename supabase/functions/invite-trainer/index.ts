import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { profileId, email, firstName, lastName } = await req.json();

    if (!profileId || !email) {
      return new Response(
        JSON.stringify({ error: 'Fehlende Felder: profileId, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Altes Profil laden (Berechtigungen sichern)
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    // Supabase Auth-Einladung senden
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
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const newAuthId = inviteData.user?.id;

    if (newAuthId && newAuthId !== profileId && oldProfile) {
      // Supabase hat ein neues Profil per Trigger angelegt (andere UUID).
      // Berechtigungen vom alten Profil auf das neue übertragen,
      // FK-Referenzen ummhängen und altes Duplikat löschen.
      await supabase.from('profiles').update({
        first_name:          oldProfile.first_name,
        last_name:           oldProfile.last_name,
        phone:               oldProfile.phone,
        operator_id:         oldProfile.operator_id,
        is_passive:          oldProfile.is_passive,
        ist_trainer:         oldProfile.ist_trainer,
        kann_buchen:         oldProfile.kann_buchen,
        kann_genehmigen:     oldProfile.kann_genehmigen,
        kann_administrieren: oldProfile.kann_administrieren,
      }).eq('id', newAuthId);

      await supabase.from('trainer_assignments')
        .update({ user_id: newAuthId })
        .eq('user_id', profileId);

      await supabase.from('bookings')
        .update({ user_id: newAuthId })
        .eq('user_id', profileId);

      await supabase.from('profiles').delete().eq('id', profileId);
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

    return new Response(
      JSON.stringify({ success: true, userId: newAuthId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('invite-trainer Fehler:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
