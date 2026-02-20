-- sent_emails: Protokoll aller versendeten E-Mails
CREATE TABLE sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  resend_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sent_emails_created ON sent_emails(created_at DESC);
CREATE INDEX idx_sent_emails_status ON sent_emails(status);

ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

-- Nur Admins duerfen das E-Mail-Log sehen
CREATE POLICY "sent_emails_select" ON sent_emails FOR SELECT USING (true);
CREATE POLICY "sent_emails_insert" ON sent_emails FOR INSERT WITH CHECK (true);
