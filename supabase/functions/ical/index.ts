/**
 * iCal Edge Function – Buchungskalender pro Ressource
 *
 * URL:  GET /functions/v1/ical/{resourceId}
 * Auth: Keine (verify_jwt: false) – Endpunkt liegt im geschützten IoT-Netz
 *
 * Gibt einen iCalendar-Feed (RFC 5545) zurück mit allen genehmigten
 * Buchungen der nächsten 60 Tage für die angegebene Ressource.
 *
 * Pro Buchung:
 *   SUMMARY:     Verein – Mannschaft
 *   DESCRIPTION: EventType | Mannschaft | Trainer | Startzeit–Endzeit
 *   LOCATION:    Raumname
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Deutsche Bezeichnungen für Buchungstypen
const EVENT_TYPE_LABELS: Record<string, string> = {
  training: "🏃 Training",
  match:    "⚽ Heimspiel",
  event:    "🎉 Event/Wettkampf",
  other:    "📋 Sonstiges",
};

// ICS-Texte escapen: Komma, Semikolon, Backslash, Newlines
function escapeICS(text: string): string {
  return (text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Datum + Uhrzeit als iCal-Timestamp formatieren (Europe/Berlin, keine UTC-Konvertierung)
function toICSDateTime(date: string, time: string): string {
  // date = "YYYY-MM-DD", time = "HH:MM"
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

// Aktuelle Timestamp für DTSTAMP (UTC)
function nowUTC(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

Deno.serve(async (req: Request) => {
  // CORS-Header für lokale Entwicklung
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // resourceId aus dem URL-Pfad extrahieren: /functions/v1/ical/{resourceId}
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const resourceId = pathParts[pathParts.length - 1];

  if (!resourceId || resourceId === "ical") {
    return new Response("Ressource-ID fehlt. Verwendung: /functions/v1/ical/{resourceId}", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Supabase-Client mit Service-Role-Key (bypassed RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Ressource laden (für LOCATION und X-WR-CALNAME)
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id, name")
    .eq("id", resourceId)
    .single();

  if (resourceError || !resource) {
    return new Response("Ressource nicht gefunden.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Zeitraum: heute bis +60 Tage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in60Days = new Date(today);
  in60Days.setDate(today.getDate() + 60);

  const dateFrom = today.toISOString().split("T")[0];
  const dateTo   = in60Days.toISOString().split("T")[0];

  // Buchungen laden inkl. Mannschaft → Abteilung → Verein + Trainer
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      id,
      date,
      start_time,
      end_time,
      title,
      booking_type,
      team_id,
      user_id,
      teams:team_id (
        name,
        departments:department_id (
          clubs:club_id (
            name
          )
        )
      ),
      profiles:user_id (
        first_name,
        last_name
      )
    `)
    .eq("resource_id", resourceId)
    .eq("status", "approved")
    .gte("date", dateFrom)
    .lte("date", dateTo)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (bookingsError) {
    console.error("Buchungs-Fehler:", bookingsError);
    return new Response("Fehler beim Laden der Buchungen.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // iCalendar-String aufbauen
  const dtstamp  = nowUTC();
  const calName  = escapeICS(resource.name);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SG Hünstetten//Buchungssystem//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calName}`,
    "X-WR-TIMEZONE:Europe/Berlin",
    "X-WR-CALDESC:Buchungskalender SG Hünstetten",
  ];

  for (const booking of bookings ?? []) {
    // Typen aus Supabase-Response
    const team    = (booking as any).teams;
    const profile = (booking as any).profiles;

    const clubName    = team?.departments?.clubs?.name ?? "";
    const teamName    = team?.name ?? "";
    const trainerName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : "";
    const eventLabel  = EVENT_TYPE_LABELS[booking.booking_type] ?? booking.booking_type;

    const summary = escapeICS(
      [clubName, teamName].filter(Boolean).join(" – ") || booking.title
    );
    const description = escapeICS(
      [eventLabel, teamName, trainerName, `${booking.start_time}–${booking.end_time}`]
        .filter(Boolean)
        .join(" | ")
    );

    const dtstart = toICSDateTime(booking.date, booking.start_time);
    const dtend   = toICSDateTime(booking.date, booking.end_time);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${booking.id}@sg-huenstetten.de`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Europe/Berlin:${dtstart}`,
      `DTEND;TZID=Europe/Berlin:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${escapeICS(resource.name)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  // RFC 5545: Zeilen mit CRLF trennen
  const icsContent = lines.join("\r\n");

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${resource.name}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
