import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import PageHeader from '../ui/PageHeader';

interface Email {
  id: string;
  subject: string;
  to: string;
  status: string;
  sentAt: string;
  html: string;
  errorMessage?: string;
}

interface EmailServiceLike {
  getSentEmails: () => Promise<Email[]>;
  clearEmails: () => Promise<void>;
}

interface EmailLogProps {
  emailService: EmailServiceLike;
}

const EmailLog: React.FC<EmailLogProps> = ({ emailService }) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    const result = await emailService.getSentEmails();
    setEmails(result);
    setLoading(false);
  }, [emailService]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const handleClear = async () => {
    if (window.confirm('Alle E-Mails aus dem Log loeschen?')) {
      await emailService.clearEmails();
      setSelectedEmail(null);
      fetchEmails();
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'sent':    return <Badge variant="success">Versendet</Badge>;
      case 'skipped': return <Badge variant="warning">Uebersprungen</Badge>;
      case 'failed':  return <Badge variant="danger">Fehlgeschlagen</Badge>;
      default:        return <Badge variant="default">Ausstehend</Badge>;
    }
  };

  return (
    <div>
      <PageHeader
        icon={Mail}
        title="E-Mail-Log"
        subtitle="Protokoll versendeter E-Mails"
        actions={
          <>
            <Button variant="secondary" onClick={fetchEmails} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Aktualisieren
            </Button>
            {emails.length > 0 && (
              <Button variant="secondary" onClick={handleClear}>
                <X className="w-4 h-4 mr-2" />Log leeren
              </Button>
            )}
          </>
        }
      />

      {emails.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Noch keine E-Mails versendet</p>
          <p className="text-sm text-gray-400 mt-2">
            E-Mails werden hier protokolliert, sobald das System welche verschickt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
            {emails.map(email => (
              <button key={email.id} onClick={() => setSelectedEmail(email)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedEmail?.id === email.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex items-start justify-between mb-2">
                  <Mail className={`w-5 h-5 ${selectedEmail?.id === email.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  {statusBadge(email.status)}
                </div>
                <div className="font-medium text-gray-800 text-sm mb-1 truncate">{email.subject}</div>
                <div className="text-xs text-gray-500 truncate mb-1">An: {email.to}</div>
                <div className="text-xs text-gray-400">
                  {new Date(email.sentAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedEmail ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">{selectedEmail.subject}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium min-w-16">Von:</span>
                      <span className="text-gray-700">noreply@sg-huenstetten.de</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium min-w-16">An:</span>
                      <span className="text-gray-700">{selectedEmail.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium min-w-16">Datum:</span>
                      <span className="text-gray-700">
                        {new Date(selectedEmail.sentAt).toLocaleString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium min-w-16">Status:</span>
                      {statusBadge(selectedEmail.status)}
                    </div>
                    {selectedEmail.errorMessage && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium min-w-16">Fehler:</span>
                        <span className="text-red-600 text-xs">{selectedEmail.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 overflow-auto max-h-[600px]">
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">E-Mail aus der Liste auswaehlen</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLog;
