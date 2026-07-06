'use client';

import * as React from 'react';
import { Eye, Send, Check } from 'lucide-react';
import { EmailTemplatesCollection, saveEmailTemplatesAction, sendTestEmailAction } from '@/lib/supabase/email-actions';
import { Button } from '@/components/ui/Button';

interface EmailTemplatesClientProps {
  initialTemplates: EmailTemplatesCollection;
}

export function EmailTemplatesClient({ initialTemplates }: EmailTemplatesClientProps) {
  const [templates, setTemplates] = React.useState<EmailTemplatesCollection>(initialTemplates);
  const [activeTab, setActiveTab] = React.useState<keyof EmailTemplatesCollection>('contact_form');
  
  // Edited values state
  const [subject, setSubject] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [btnText, setBtnText] = React.useState('');
  const [btnUrl, setBtnUrl] = React.useState('');

  const [testRecipient, setTestRecipient] = React.useState('admin@thenailaastudio.com');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSendingTest, setIsSendingTest] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [testSuccess, setTestSuccess] = React.useState(false);

  // Sync edits when active tab changes
  React.useEffect(() => {
    const current = templates[activeTab];
    if (current) {
      setSubject(current.subject);
      setTitle(current.title);
      setBody(current.body);
      setBtnText(current.button_text);
      setBtnUrl(current.button_url);
    }
  }, [activeTab, templates]);

  // Handle template edit save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedTemplates = {
      ...templates,
      [activeTab]: {
        name: templates[activeTab].name,
        subject,
        title,
        body,
        button_text: btnText,
        button_url: btnUrl,
      },
    };

    const result = await saveEmailTemplatesAction(updatedTemplates);
    setIsSaving(false);

    if (result.success) {
      setTemplates(updatedTemplates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(result.error || 'Failed to save templates.');
    }
  };

  // Handle test email execution
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;

    setIsSendingTest(true);
    setTestSuccess(false);

    const result = await sendTestEmailAction(activeTab, testRecipient);
    setIsSendingTest(false);

    if (result.success) {
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } else {
      alert(result.error || 'Failed to send test email.');
    }
  };

  // Compile live preview HTML layout
  const previewHtml = React.useMemo(() => {
    // Replace variables with mock content
    const compiledBody = body
      .split('{{CLIENT_NAME}}').join('Alexander Sterling')
      .split('{{CLIENT_EMAIL}}').join('alexander@sterlingluxury.com')
      .split('{{MESSAGE}}').join('I would like to schedule a custom luxury biophilic design consult for my home.');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#111111; font-family:'Helvetica Neue', Arial, sans-serif; color:#ffffff;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:20px auto; background-color:#161616; border:1px solid rgba(201,168,106,0.25); border-radius:12px; overflow:hidden;">
            <tr>
              <td align="center" style="padding:25px 0 18px 0; border-bottom:1px solid rgba(201,168,106,0.15); background-color:#1e1e1e;">
                <h1 style="color:#C9A86A; font-family:Georgia, serif; font-size:20px; font-weight:normal; margin:0; letter-spacing:3px; text-transform:uppercase;">The Nailaa Studio</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:35px 25px; line-height:1.6; font-size:14px; color:#cccccc;">
                <h2 style="color:#ffffff; font-family:Georgia, serif; font-size:18px; font-weight:normal; margin-top:0; margin-bottom:18px;">${title}</h2>
                ${compiledBody}
                <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-top:25px; margin-bottom:10px;">
                  <tr>
                    <td align="center" style="border-radius:4px; background-color:#C9A86A;">
                      <a href="${btnUrl}" target="_blank" style="padding:10px 25px; display:inline-block; font-size:10px; font-weight:bold; color:#111111; text-decoration:none; letter-spacing:2px; text-transform:uppercase; font-family:sans-serif;">${btnText}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:15px 25px; font-size:10px; color:#666666; border-top:1px solid rgba(255,255,255,0.05); background-color:#101010; line-height:1.8;">
                <p style="margin:0 0 5px 0;">This is a live preview simulation matching dynamic client logs.</p>
                <p style="margin:0;">&copy; ${new Date().getFullYear()} The Nailaa Studio. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }, [title, body, btnText, btnUrl]);

  const tabsConfig = [
    { key: 'contact_form' as const, name: 'Contact Form' },
    { key: 'consultation_popup' as const, name: 'Consultation Popup' },
    { key: 'booking_confirmation' as const, name: 'Booking Confirmation' },
    { key: 'admin_notification' as const, name: 'Admin Alert' },
  ];

  return (
    <div className="space-y-6 text-white font-sans">
      
      {/* Title Header */}
      <div className="border-b border-[#C9A86A]/10 pb-6">
        <h1 className="text-2xl font-serif font-light text-white tracking-wide">
          Email Templates Manager
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Customize responsive HTML notifications, modify subject parameters, and verify delivery layouts.
        </p>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex flex-wrap border-b border-gray-800 gap-2">
        {tabsConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === t.key
                ? 'border-[#C9A86A] text-[#C9A86A]'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Grid workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Form Editor & Controls */}
        <div className="space-y-6 bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-[#C9A86A]">
              Editing: {templates[activeTab]?.name}
            </span>
            {saveSuccess && (
              <span className="text-xs text-green-400 font-medium flex items-center gap-1 animate-pulse">
                <Check className="h-4 w-4" /> Changes Saved
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Subject Input */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Thank you for your inquiry"
                className="w-full px-4 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:shadow-[0_0_12px_rgba(201,168,106,0.15)] transition-all"
              />
            </div>

            {/* Header/Title Input */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                Main Card Heading
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Booking Confirmed"
                className="w-full px-4 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:shadow-[0_0_12px_rgba(201,168,106,0.15)] transition-all"
              />
            </div>

            {/* Body Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block">
                  Body HTML Code
                </label>
                <span className="text-[9px] text-gray-600">
                  Allowed variables: <code>{"{{CLIENT_NAME}}"}</code>, <code>{"{{MESSAGE}}"}</code>
                </span>
              </div>
              <textarea
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs font-mono text-gray-200 outline-none focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:shadow-[0_0_12px_rgba(201,168,106,0.15)] transition-all"
              />
            </div>

            {/* CTA controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                  Button Label
                </label>
                <input
                  type="text"
                  value={btnText}
                  onChange={(e) => setBtnText(e.target.value)}
                  placeholder="View Details"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:shadow-[0_0_12px_rgba(201,168,106,0.15)] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 block mb-1.5">
                  Button Action URL
                </label>
                <input
                  type="text"
                  value={btnUrl}
                  onChange={(e) => setBtnUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A86A] focus:ring-1 focus:ring-[#C9A86A] focus:shadow-[0_0_12px_rgba(201,168,106,0.15)] transition-all"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#C9A86A] text-[#111111]"
          >
            {isSaving ? 'Saving Changes...' : 'Save Template'}
          </Button>

          {/* Test Sender Form Panel */}
          <div className="pt-6 border-t border-gray-800/80">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
              <Send className="h-4 w-4" /> Send Test Email
            </h4>
            <form onSubmit={handleSendTest} className="flex gap-2">
              <input
                type="email"
                required
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 px-3 py-2 text-xs rounded border border-gray-800 bg-[#111111] text-white outline-none focus:border-[#C9A86A]"
              />
              <button
                type="submit"
                disabled={isSendingTest}
                className="px-4 py-2 rounded bg-gradient-to-r from-[#8A7052] to-[#71593F] text-white hover:brightness-105 disabled:opacity-50 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
              >
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </form>
            {testSuccess && (
              <span className="text-[10px] text-green-400 font-medium mt-2 block animate-pulse">
                ✓ Test email logged in audit dispatches successfully!
              </span>
            )}
          </div>

        </div>

        {/* Right Column: HTML Live Preview */}
        <div className="flex flex-col h-[650px] border border-gray-800 rounded-xl bg-[#1A1A1A] overflow-hidden">
          {/* Preview Header */}
          <div className="px-5 py-3 border-b border-gray-800 flex items-center space-x-2 bg-[#161616] text-xs font-semibold tracking-wider text-gray-500 uppercase">
            <Eye className="h-4.5 w-4.5" />
            <span>Responsive Live Preview</span>
          </div>

          {/* Preview Frame Window */}
          <div className="flex-1 bg-[#111111] p-6 flex justify-center items-center">
            <iframe
              title="Template HTML Live Preview"
              srcDoc={previewHtml}
              className="w-full h-full border border-gray-800/60 rounded-lg shadow-inner bg-[#161616]"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
