import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Badge';

const EmailLog = ({ emailService }) => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const emails = emailService.getSentEmails().sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">E-Mail-Log</h2>
          <p className="text-gray-500 mt-1">
            {emails.length} {emails.length === 1 ? 'E-Mail' : 'E-Mails'} versendet
          </p>
        </div>
        {emails.length > 0 && (
          <Button variant="secondary" onClick={() => {
            if (window.confirm('Moechten Sie wirklich alle E-Mails aus dem Log loeschen?')) {
              emailService.clearEmails();
              setSelectedEmail(null);
            }
          }}>
            <X className="w-4 h-4 mr-2" />Log leeren
          </Button>
        )}
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Noch keine E-Mails versendet</p>
          <p className="text-sm text-gray-400 mt-2">
            E-Mails werden hier zur Vorschau angezeigt (Prototyp-Modus)
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
                  <Badge variant={email.status === 'sent' ? 'success' : 'default'}>
                    {email.status === 'sent' ? 'Versendet' : 'Ausstehend'}
                  </Badge>
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
                  </div>
                </div>
                <div className="p-6 overflow-auto" style={{ maxHeight: '600px' }}>
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Waehlen Sie eine E-Mail aus der Liste</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-2xl">i</div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-800 mb-1">Prototyp-Modus</h4>
            <p className="text-sm text-blue-700">
              Dies ist eine Vorschau der E-Mails, die im echten System versendet wuerden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailLog;
