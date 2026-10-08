'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Printer, Share2, Download, Sun, Sunrise, Moon, ChefHat, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MEAL_TIMINGS } from '@/lib/constants/timings';

interface CustomerDetail {
  name: string;
  order_id: string;
  quantity: number;
}

interface MealItem {
  meal_name: string;
  category: string;
  dietary_tag: string;
  quantity: number;
  ingredients: string;
  customers: CustomerDetail[];
}

interface KitchenReport {
  morning: MealItem[];
  afternoon: MealItem[];
  dinner: MealItem[];
  totals: { morning: number; afternoon: number; dinner: number; total: number };
  order_count: number;
  date: string;
}

const timeSlots = [
  { key: 'morning' as const, label: 'Morning Batch', subtitle: 'Breakfast', icon: Sunrise, color: 'text-orange-600 bg-orange-50' },
  { key: 'afternoon' as const, label: 'Afternoon Batch', subtitle: 'Lunch', icon: Sun, color: 'text-yellow-600 bg-yellow-50' },
  { key: 'dinner' as const, label: 'Dinner Batch', subtitle: 'Dinner', icon: Moon, color: 'text-indigo-600 bg-indigo-50' },
];

const slotEmojis: Record<string, string> = {
  morning: '🍳',
  afternoon: '🍛',
  dinner: '🌙',
};

export default function ReportsPage() {
  const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [report, setReport] = useState<KitchenReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function fetchReport() {
    setLoading(true);
    const res = await fetch(`/api/reports/kitchen?date=${date}`);
    setReport(await res.json());
    setLoading(false);
  }

  async function generateOrders() {
    const res = await fetch('/api/orders/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    const data = await res.json();
    showToast(data.message);
    fetchReport();
  }

  function handlePrint() {
    window.print();
  }

  function handleWhatsApp() {
    if (!report) return;

    const lines: string[] = [];
    lines.push('*THE PROTEIN MAKERS*');
    lines.push(`*Kitchen Prep - ${format(new Date(report.date), 'dd MMM yyyy')}*`);
    lines.push(`${report.order_count} orders | ${report.totals.total} total items`);

    for (const slot of ['morning', 'afternoon', 'dinner'] as const) {
      const items = report[slot];
      const timing = MEAL_TIMINGS[slot];
      if (items.length === 0) continue;
      lines.push('');
      lines.push('-------------------');
      lines.push(`*${timing.label.toUpperCase()}*`);
      lines.push(`Prep: ${timing.prepStart} - ${timing.prepEnd}`);
      lines.push(`Delivery: ${timing.deliveryStart} - ${timing.deliveryEnd}`);
      lines.push('');
      items.forEach(item => {
        const tag = item.dietary_tag === 'veg' ? '[Veg]' : '[Non-Veg]';
        lines.push(`${tag} *${item.meal_name}* x ${item.quantity}`);
        item.customers.forEach(c => {
          lines.push(`  - ${c.name} (${c.order_id})`);
        });
      });
    }

    const text = lines.join('\n');
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  async function handleExcelExport() {
    if (!report) return;
    const XLSX = await import('xlsx-js-style');

    const wsData: (string | number)[][] = [];
    const boldRows: number[] = [];
    const sectionRows: number[] = [];
    const headerRows: number[] = [];

    function push(row: (string | number)[], type?: 'bold' | 'section' | 'header') {
      wsData.push(row);
      const idx = wsData.length;
      if (type === 'bold') boldRows.push(idx);
      if (type === 'section') sectionRows.push(idx);
      if (type === 'header') headerRows.push(idx);
    }

    push(['THE PROTEIN MAKERS - Kitchen Preparation Report'], 'bold');
    push([`Date: ${format(new Date(report.date), 'EEEE, dd MMMM yyyy')}`], 'bold');
    push([`Orders: ${report.order_count}`, '', '', `Total Items: ${report.totals.total}`], 'bold');
    push([]);

    for (const slot of ['morning', 'afternoon', 'dinner'] as const) {
      const items = report[slot];
      const timing = MEAL_TIMINGS[slot];

      push([`${timing.label.toUpperCase()}`], 'section');
      push([`Prep: ${timing.prepStart} - ${timing.prepEnd}`, '', `Delivery: ${timing.deliveryStart} - ${timing.deliveryEnd}`]);
      push(['Meal Name', 'Category', 'Dietary', 'Qty', 'Customer', 'Order ID'], 'header');

      if (items.length === 0) {
        push(['No items for this batch']);
      } else {
        items.forEach(item => {
          const firstCustomer = item.customers[0];
          push([
            item.meal_name,
            item.category,
            item.dietary_tag,
            item.quantity,
            firstCustomer?.name || '',
            firstCustomer?.order_id || '',
          ]);
          for (let i = 1; i < item.customers.length; i++) {
            push(['', '', '', '', item.customers[i].name, item.customers[i].order_id]);
          }
        });
      }

      push([`Subtotal: ${report.totals[slot]} items`], 'bold');
      push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 24 },
      { wch: 22 },
      { wch: 10 },
      { wch: 6 },
      { wch: 20 },
      { wch: 24 },
    ];

    const titleStyle = { font: { bold: true, sz: 14, color: { rgb: '1B5E20' } } };
    const boldStyle = { font: { bold: true, sz: 11 } };
    const sectionStyle = { font: { bold: true, sz: 13, color: { rgb: '1B5E20' } }, fill: { fgColor: { rgb: 'E8F5E9' } } };
    const headerStyle = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1B5E20' } } };
    const borderAll = {
      border: {
        top: { style: 'thin', color: { rgb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
        left: { style: 'thin', color: { rgb: 'CCCCCC' } },
        right: { style: 'thin', color: { rgb: 'CCCCCC' } },
      },
    };

    // Apply title style to row 1
    if (ws['A1']) ws['A1'].s = titleStyle;

    // Apply bold to bold rows
    for (const r of boldRows) {
      for (let c = 0; c < 6; c++) {
        const ref = XLSX.utils.encode_cell({ r: r - 1, c });
        if (ws[ref]) ws[ref].s = { ...boldStyle, ...borderAll };
      }
    }

    // Apply section style
    for (const r of sectionRows) {
      for (let c = 0; c < 6; c++) {
        const ref = XLSX.utils.encode_cell({ r: r - 1, c });
        if (ws[ref]) ws[ref].s = sectionStyle;
        else ws[ref] = { v: '', s: sectionStyle };
      }
    }

    // Apply header style
    for (const r of headerRows) {
      for (let c = 0; c < 6; c++) {
        const ref = XLSX.utils.encode_cell({ r: r - 1, c });
        if (ws[ref]) ws[ref].s = { ...headerStyle, ...borderAll };
      }
    }

    // Add borders to all data cells + center-align column D (Qty)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (ws[ref] && !ws[ref].s) {
          ws[ref].s = borderAll;
        }
        if (c === 3 && ws[ref]) {
          const existing = ws[ref].s || {};
          ws[ref].s = { ...existing, alignment: { horizontal: 'center', vertical: 'center' } };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kitchen Report');
    XLSX.writeFile(wb, `TPM_Kitchen_Report_${report.date}.xlsx`);
    showToast('Excel file downloaded');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Preparation Report</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and print daily meal preparation plan</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6 no-print">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-green outline-none"
            />
          </div>
          <Button onClick={generateOrders} variant="outline">
            Generate Orders for Date
          </Button>
          <Button onClick={fetchReport}>
            <ChefHat className="w-4 h-4 mr-2" /> Load Report
          </Button>
        </div>
      </div>

      {loading && <div className="text-center py-12"><LoadingSpinner size="lg" /></div>}

      {report && !loading && (
        <>
          <div className="flex gap-2 mb-6 no-print">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" onClick={handleWhatsApp}>
              <Share2 className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" onClick={handleExcelExport}>
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
          </div>

          {/* Printable report */}
          <div className="bg-white rounded-xl border" id="kitchen-report">
            {/* Print header */}
            <div className="p-4 sm:p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-brand-green-dark">THE PROTEIN MAKERS</h2>
                  <p className="text-sm text-gray-600">Kitchen Preparation Report</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-semibold">{format(new Date(report.date), 'EEEE, dd MMMM yyyy')}</p>
                  <p className="text-sm text-gray-500">{report.order_count} orders | {report.totals.total} total items</p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6 border-b no-print">
              {timeSlots.map(slot => {
                const timing = MEAL_TIMINGS[slot.key];
                return (
                  <div key={slot.key} className={`rounded-lg p-4 ${slot.color}`}>
                    <slot.icon className="w-5 h-5 mb-1" />
                    <p className="text-xs font-medium opacity-70">{slot.label}</p>
                    <p className="text-2xl font-bold">{report.totals[slot.key as keyof typeof report.totals]}</p>
                    <p className="text-xs opacity-70">items</p>
                    <div className="mt-2 pt-2 border-t border-current/10 space-y-0.5">
                      <p className="text-[10px] opacity-60 flex items-center gap-1"><Clock className="w-3 h-3" /> Prep: {timing.prepStart} – {timing.prepEnd}</p>
                      <p className="text-[10px] opacity-60">Delivery: {timing.deliveryStart} – {timing.deliveryEnd}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time slot details */}
            {timeSlots.map(slot => {
              const items = report[slot.key as keyof Pick<KitchenReport, 'morning' | 'afternoon' | 'dinner'>];
              const timing = MEAL_TIMINGS[slot.key];
              return (
                <div key={slot.key} className="border-b last:border-b-0">
                  <div className={`px-4 sm:px-6 py-3 ${slot.color} flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2`}>
                    <div className="flex items-center gap-2">
                      <slot.icon className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">{slot.label}</h3>
                      <span className="text-sm opacity-70">({report.totals[slot.key as keyof typeof report.totals]} items)</span>
                    </div>
                    <span className="sm:ml-auto text-xs opacity-60 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Prep {timing.prepStart}–{timing.prepEnd} | Delivery {timing.deliveryStart}–{timing.deliveryEnd}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <div className="px-4 sm:px-6 py-4 text-gray-500 text-sm">No items for this batch</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 text-left font-medium text-gray-600">Meal</th>
                          <th className="px-3 sm:px-6 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Category</th>
                          <th className="px-3 sm:px-6 py-2 text-left font-medium text-gray-600">Type</th>
                          <th className="px-3 sm:px-6 py-2 text-right font-medium text-gray-600">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-3 sm:px-6 py-3">
                              <p className="font-medium text-gray-900">{item.meal_name}</p>
                              <p className="text-xs text-gray-400 sm:hidden">{item.category}</p>
                              {item.customers && item.customers.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.customers.map((c, ci) => (
                                    <p key={ci} className="text-xs text-gray-400">
                                      👤 {c.name} <span className="font-mono">({c.order_id})</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 text-gray-600 hidden sm:table-cell">{item.category}</td>
                            <td className="px-3 sm:px-6 py-3"><Badge status={item.dietary_tag} /></td>
                            <td className="px-3 sm:px-6 py-3 text-right">
                              <span className="text-lg font-bold text-brand-green">× {item.quantity}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

            {/* Footer totals */}
            <div className="p-6 bg-brand-green-dark text-white rounded-b-xl">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Items for the Day</span>
                <span className="text-3xl font-bold">{report.totals.total}</span>
              </div>
            </div>
          </div>

          {/* Print-only styles */}
          <style jsx global>{`
            @media print {
              body * { visibility: hidden; }
              #kitchen-report, #kitchen-report * { visibility: visible; }
              #kitchen-report { position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
              @page { margin: 1cm; }
            }
          `}</style>
        </>
      )}

      {!report && !loading && (
        <div className="text-center py-16 text-gray-500">
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-1">Select a date and load the report</p>
          <p className="text-sm">The report shows aggregated meal quantities grouped by preparation time</p>
        </div>
      )}
    </div>
  );
}
