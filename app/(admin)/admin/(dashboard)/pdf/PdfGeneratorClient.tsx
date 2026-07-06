'use client';

import * as React from 'react';
import { 
  Save, Download, Mail, Plus, Trash2, 
  Palette, Grid, CheckCircle2, AlertCircle, FileSpreadsheet, Eye 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { DocumentTemplate, DocumentLineItem, savePdfTemplateAction, sendPdfEmailAction } from '@/lib/pdf-actions';
import { Button } from '@/components/ui/Button';

interface PdfGeneratorClientProps {
  initialTemplates: DocumentTemplate[];
}

const DEFAULT_NEW_TEMPLATE = (type: 'invoice' | 'proposal' | 'quotation'): DocumentTemplate => ({
  id: `tpl-${type}-${Date.now()}`,
  type,
  clientName: 'New Client',
  clientEmail: 'client@example.com',
  docNumber: `${type.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
  docDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  subject: 'Bespoke Styling Service Package Description',
  items: [
    { id: `itm-${Date.now()}-1`, description: 'Bespoke Nail Artistry Design Layering', quantity: 1, price: 4500 }
  ],
  terms: 'Please make payments inside the client portal dashboard copy list.',
  brandColor: '#C9A86A',
  layout: 'modern',
});

export function PdfGeneratorClient({ initialTemplates }: PdfGeneratorClientProps) {
  const [templates, setTemplates] = React.useState<DocumentTemplate[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = React.useState<DocumentTemplate | null>(initialTemplates[0] || null);

  // Form controls loader
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Line items state editor inputs
  const [itemDesc, setItemDesc] = React.useState('');
  const [itemQty, setItemQty] = React.useState(1);
  const [itemPrice, setItemPrice] = React.useState(1000);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const updateTemplateValue = (updater: (prev: DocumentTemplate) => DocumentTemplate) => {
    if (!selectedTemplate) return;
    setSelectedTemplate(prev => prev ? updater(prev) : null);
  };

  // Add line item
  const handleAddItem = () => {
    if (!itemDesc.trim() || !selectedTemplate) return;
    
    const newItem: DocumentLineItem = {
      id: `itm-${Date.now()}`,
      description: itemDesc.trim(),
      quantity: Number(itemQty),
      price: Number(itemPrice),
    };

    updateTemplateValue(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setItemDesc('');
    setItemQty(1);
    setItemPrice(1000);
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    updateTemplateValue(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  };

  // Save changes
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);

    const res = await savePdfTemplateAction(selectedTemplate);
    setLoading(false);

    if (res.success) {
      showToast('success', 'Document template saved successfully.');
      setTemplates(prev => {
        const idx = prev.findIndex(t => t.id === selectedTemplate.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = selectedTemplate;
          return next;
        }
        return [selectedTemplate, ...prev];
      });
    } else {
      showToast('error', res.error || 'Failed to save template.');
    }
  };

  // Send document notification
  const handleSendEmail = async () => {
    if (!selectedTemplate) return;
    setLoading(true);

    const res = await sendPdfEmailAction(selectedTemplate, selectedTemplate.clientEmail);
    setLoading(false);

    if (res.success) {
      showToast('success', `Simulated PDF dispatch email sent to ${selectedTemplate.clientEmail}.`);
    } else {
      showToast('error', res.error || 'Failed to send notification email.');
    }
  };

  // Download PDF file using jsPDF vector engine
  const handleDownloadPDF = () => {
    if (!selectedTemplate) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = selectedTemplate.brandColor;
      
      // Page styling helper
      // Company Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(primaryColor);
      doc.text('THE NAILAA STUDIO', 20, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Luxury Nail Artistry & Holistic Hand Wellness', 20, 25);
      doc.text('hello@thenailaastudio.com | +91 99999 99999', 20, 29);

      // Accent border line
      doc.setDrawColor(primaryColor);
      doc.setLineWidth(0.6);
      doc.line(20, 33, 190, 33);

      // Metadata info row
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(selectedTemplate.type.toUpperCase(), 20, 43);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Doc Ref: ${selectedTemplate.docNumber}`, 20, 48);
      doc.text(`Date: ${selectedTemplate.docDate}`, 20, 53);
      if (selectedTemplate.dueDate) {
        doc.text(`Due Date: ${selectedTemplate.dueDate}`, 20, 58);
      }

      // Recipient details
      doc.setFont('helvetica', 'bold');
      doc.text('RECIPIENT / CLIENT:', 120, 43);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedTemplate.clientName, 120, 48);
      doc.text(selectedTemplate.clientEmail, 120, 53);

      // Brief
      doc.setFont('helvetica', 'bold');
      doc.text('SUBJECT BRIEF:', 20, 68);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedTemplate.subject, 20, 73);

      // Table Header row
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 80, 170, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Description / Line Item Details', 22, 85);
      doc.text('Qty', 130, 85);
      doc.text('Unit Price', 148, 85);
      doc.text('Total', 172, 85);

      // Table line items
      let y = 92;
      doc.setFont('helvetica', 'normal');
      selectedTemplate.items.forEach(item => {
        const itemTotal = item.quantity * item.price;
        doc.text(item.description, 22, y);
        doc.text(String(item.quantity), 130, y);
        doc.text(`INR ${item.price.toLocaleString()}`, 148, y);
        doc.text(`INR ${itemTotal.toLocaleString()}`, 172, y);
        y += 7.5;
      });

      // Total border line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(20, y, 190, y);
      y += 6;

      // Summary Total amount
      const subtotal = selectedTemplate.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL AMOUNT:', 120, y);
      doc.text(`INR ${subtotal.toLocaleString()}`, 160, y);

      y += 12;
      // Terms
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      doc.text(selectedTemplate.terms, 20, y, { maxWidth: 170 });

      // Signature borders
      y += 24;
      doc.line(20, y, 70, y);
      doc.line(140, y, 190, y);
      y += 4;
      doc.text('Authorized Signatory', 20, y);
      doc.text('Client Acceptance Signature', 140, y);

      // Export file
      doc.save(`Nailaa_${selectedTemplate.type}_${selectedTemplate.docNumber}.pdf`);
      showToast('success', 'PDF file successfully downloaded.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download PDF';
      showToast('error', msg);
    }
  };

  const totalAmount = selectedTemplate
    ? selectedTemplate.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    : 0;

  return (
    <div className="space-y-6 font-sans text-white">
      
      {/* Toast popup */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400'
            : 'bg-rose-950/90 border-rose-500 text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-[#C9A86A]" /> PDF Document Console
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Generate and edit branded Invoices, Quotations, and Proposals. Download vector PDFs or dispatch details directly to client emails.
          </p>
        </div>

        {/* Action presets */}
        <div className="flex flex-wrap gap-2">
          {['invoice', 'proposal', 'quotation'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedTemplate(DEFAULT_NEW_TEMPLATE(type as 'invoice' | 'proposal' | 'quotation'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] border border-gray-850 hover:border-[#C9A86A]/30 text-[10px] uppercase font-bold tracking-wider rounded text-[#C9A86A] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add {type}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Templates Selector + Form Editors (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Document list selectors */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold border-b border-gray-850 pb-2">Active Templates</h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {templates.map(tpl => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate({ ...tpl })}
                    className={`w-full text-left p-2.5 rounded border transition-all flex justify-between items-center gap-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-[#252525] border-[#C9A86A]/30 text-white'
                        : 'bg-[#111111] border-gray-850 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold">{tpl.docNumber}</span>
                    <span className="text-[8px] uppercase font-bold tracking-wider bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-[#C9A86A]">
                      {tpl.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Form */}
          {selectedTemplate && (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold border-b border-gray-850 pb-2">Document Details</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Client Name</label>
                  <input
                    type="text"
                    value={selectedTemplate.clientName}
                    onChange={(e) => updateTemplateValue(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#C9A86A]"
                  />
                </div>

                {/* Client Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Client Email</label>
                  <input
                    type="email"
                    value={selectedTemplate.clientEmail}
                    onChange={(e) => updateTemplateValue(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#C9A86A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Reference Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Ref Number</label>
                  <input
                    type="text"
                    value={selectedTemplate.docNumber}
                    onChange={(e) => updateTemplateValue(prev => ({ ...prev, docNumber: e.target.value }))}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-2 py-1.5 text-xs outline-none focus:border-[#C9A86A]"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Doc Date</label>
                  <input
                    type="date"
                    value={selectedTemplate.docDate}
                    onChange={(e) => updateTemplateValue(prev => ({ ...prev, docDate: e.target.value }))}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-2 py-1.5 text-xs outline-none focus:border-[#C9A86A]"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Due Date</label>
                  <input
                    type="date"
                    value={selectedTemplate.dueDate}
                    onChange={(e) => updateTemplateValue(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-2 py-1.5 text-xs outline-none focus:border-[#C9A86A]"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Subject / Objective Brief</label>
                <input
                  type="text"
                  value={selectedTemplate.subject}
                  onChange={(e) => updateTemplateValue(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-[#111111] border border-gray-800 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#C9A86A]"
                />
              </div>

              {/* Branding controls */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-850 pt-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5"><Palette className="h-3.5 w-3.5 text-[#C9A86A]" /> Accent Accent</label>
                  <input
                    type="color"
                    value={selectedTemplate.brandColor}
                    onChange={(e) => updateTemplateValue(prev => ({ ...prev, brandColor: e.target.value }))}
                    className="w-full bg-transparent border-0 cursor-pointer h-7 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5"><Grid className="h-3.5 w-3.5" /> Layout Theme</label>
                  <select
                    value={selectedTemplate.layout}
                    onChange={(e) => updateTemplateValue(prev => ({ ...prev, layout: e.target.value as 'classic' | 'modern' | 'minimalist' }))}
                    className="w-full bg-[#111111] border border-gray-800 rounded px-2.5 py-1.5 text-xs outline-none cursor-pointer text-white"
                  >
                    <option value="classic">Classic Elegant</option>
                    <option value="modern">Modern Luxury</option>
                    <option value="minimalist">Minimalist Clean</option>
                  </select>
                </div>
              </div>

              {/* Line Items Manager */}
              <div className="border-t border-gray-850 pt-4 space-y-3">
                <h4 className="text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold">Line Items List</h4>
                
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {selectedTemplate.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center gap-2 bg-[#111111] border border-gray-850 px-2.5 py-1.5 rounded">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-white truncate">{item.description}</p>
                        <p className="text-[9px] text-gray-500 font-mono mt-0.5">{item.quantity} x ₹{item.price.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-500 hover:text-red-400 p-1 cursor-pointer shrink-0"
                        title="Delete line item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Item fields */}
                <div className="bg-[#111111] border border-gray-850 rounded p-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Item description..."
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs outline-none focus:border-[#C9A86A]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      min={1}
                      value={itemPrice}
                      onChange={(e) => setItemPrice(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-1.5 bg-[#C9A86A] text-[#111111] text-[10px] uppercase font-bold tracking-wider rounded hover:bg-[#C9A86A]/90 transition-all cursor-pointer"
                  >
                    + Add Line Item
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="space-y-1.5 border-t border-gray-850 pt-3">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Terms & Notes</label>
                <textarea
                  rows={2}
                  value={selectedTemplate.terms}
                  onChange={(e) => updateTemplateValue(prev => ({ ...prev, terms: e.target.value }))}
                  className="w-full bg-[#111111] border border-gray-800 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#C9A86A] resize-y"
                />
              </div>

            </div>
          )}

        </div>

        {/* Right Side: Document Preview + Actions Panel (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedTemplate && (
            <>
              {/* Document Actions */}
              <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 shadow-xl flex items-center justify-between gap-4">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> Live Document Canvas
                </span>

                <div className="flex gap-2">
                  {/* Save */}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    className="flex items-center gap-1.5 cursor-pointer"
                    onClick={handleSaveTemplate}
                  >
                    <Save className="h-4 w-4" /> Save
                  </Button>

                  {/* Send Email */}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    className="flex items-center gap-1.5 cursor-pointer"
                    onClick={handleSendEmail}
                  >
                    <Mail className="h-4 w-4" /> Email Dispatch
                  </Button>

                  {/* Download */}
                  <Button
                    variant="accent"
                    size="sm"
                    className="flex items-center gap-1.5 cursor-pointer"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                </div>
              </div>

              {/* Physical A4 layout preview sheet */}
              <div className="bg-white text-gray-800 rounded-xl shadow-2xl p-8 sm:p-12 min-h-[640px] flex flex-col justify-between font-sans border-t-8 shadow-inner select-none relative overflow-hidden"
                style={{ borderTopColor: selectedTemplate.brandColor }}
              >
                
                {/* Classic, Modern, Minimalist layout variations */}
                <div className="space-y-8">
                  
                  {/* Header bar */}
                  <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: `${selectedTemplate.brandColor}30` }}>
                    <div>
                      <h2 className="font-serif text-2xl font-bold tracking-wide" style={{ color: selectedTemplate.brandColor }}>
                        THE NAILAA STUDIO
                      </h2>
                      <p className="text-[10px] text-gray-450 mt-0.5 uppercase tracking-widest font-semibold">Luxury Nail Styling Sanctuary</p>
                      <p className="text-[9px] text-gray-400 mt-1 font-mono">hello@thenailaastudio.com • +91 99999 99999</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded text-white font-mono" style={{ backgroundColor: selectedTemplate.brandColor }}>
                        {selectedTemplate.type}
                      </span>
                      <p className="text-[11px] font-bold text-gray-700 mt-2 font-mono">{selectedTemplate.docNumber}</p>
                      <p className="text-[9px] text-gray-500 font-mono">Date: {selectedTemplate.docDate}</p>
                    </div>
                  </div>

                  {/* Recipient Details & Dates */}
                  <div className="grid grid-cols-2 gap-6 text-[11px]">
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Billed To / Recipient</p>
                      <p className="font-bold text-gray-800">{selectedTemplate.clientName}</p>
                      <p className="text-gray-500 font-mono">{selectedTemplate.clientEmail}</p>
                    </div>

                    <div className="space-y-1 text-right">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Due Date / Terms</p>
                      <p className="font-bold text-gray-800">{selectedTemplate.dueDate || 'Upon Signature'}</p>
                      <p className="text-gray-500">10-Day Term Limits</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="bg-gray-50 p-3 rounded border text-xs" style={{ borderLeft: `3px solid ${selectedTemplate.brandColor}` }}>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Subject Brief Details</p>
                    <p className="font-semibold text-gray-850 mt-0.5">{selectedTemplate.subject}</p>
                  </div>

                  {/* Itemized Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                          <th className="p-3">Line Item Description</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-700">
                        {selectedTemplate.items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-medium text-gray-800">{item.description}</td>
                            <td className="p-3 text-center font-mono">{item.quantity}</td>
                            <td className="p-3 text-right font-mono">₹{item.price.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono">₹{(item.quantity * item.price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total calculation summary */}
                  <div className="flex justify-end pt-2">
                    <div className="w-48 text-right space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold border-t pt-2.5">
                        <span className="text-gray-500">Total Amount:</span>
                        <span className="text-gray-800" style={{ color: selectedTemplate.brandColor }}>₹{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer terms & signatures */}
                <div className="space-y-8 pt-8 border-t" style={{ borderColor: `${selectedTemplate.brandColor}15` }}>
                  <div className="text-[9px] text-gray-450 leading-relaxed">
                    <p className="uppercase tracking-wider font-bold">Terms & Conditions</p>
                    <p className="mt-1 font-light">{selectedTemplate.terms}</p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold pt-4">
                    <div className="text-center w-40">
                      <div className="border-t border-dashed pt-1.5">Authorized Signatory</div>
                    </div>
                    <div className="text-center w-40">
                      <div className="border-t border-dashed pt-1.5">Client Acceptance Signature</div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
