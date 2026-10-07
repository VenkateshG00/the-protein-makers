'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Printer, Share2, Download, Sun, Sunrise, Moon, ChefHat } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface MealItem {
  meal_name: string;
  category: string;
  dietary_tag: string;
  quantity: number;
  ingredients: string;
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
  { key: 'morning', label: 'Morning Batch', icon: Sunrise, color: 'text-orange-600 bg-orange-50' },
  { key: 'afternoon', label: 'Afternoon Batch', icon: Sun, color: 'text-yellow-600 bg-yellow-50' },
  { key: 'dinner', label: 'Dinner Batch', icon: Moon, color: 'text-indigo-600 bg-indigo-50' },
];

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
    let text = `🍽️ THE PROTEIN MAKERS\nKitchen Prep — ${format(new Date(report.date), 'dd MMM yyyy')}\n\n`;

    const emojis: Record<string, string> = { morning: '🌅', afternoon: '☀️', dinner: '🌙' };
    const labels: Record<string, string> = { morning: 'MORNING', afternoon: 'AFTERNOON', dinner: 'DINNER' };

    for (const slot of ['morning', 'afternoon', 'dinner'] as const) {
      const items = report[slot];
      if (items.length === 0) continue;
      text += `${emojis[slot]} ${labels[slot]}\n`;
      items.forEach(item => {
        text += `- ${item.meal_name} × ${item.quantity}\n`;
      });
      text += `\n`;
    }

    text += `Total Items: ${report.totals.total}\nTotal Orders: ${report.order_count}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  async function handleExcelExport() {
    if (!report) return;
    const XLSX = await import('xlsx');

    const wsData: (string | number)[][] = [
      ['THE PROTEIN MAKERS — Kitchen Preparation Report'],
      [`Date: ${format(new Date(report.date), 'dd MMMM yyyy')}`],
      [],
    ];

    for (const slot of ['morning', 'afternoon', 'dinner'] as const) {
      const items = report[slot];
      const label = slot.toUpperCase();
      wsData.push([`${label} BATCH`]);
      wsData.push(['Meal Name', 'Category', 'Dietary', 'Quantity', 'Ingredients']);
      items.forEach(item => {
        wsData.push([item.meal_name, item.category, item.dietary_tag, item.quantity, item.ingredients]);
      });
      wsData.push([`Subtotal: ${report.totals[slot]} items`]);
      wsData.push([]);
    }

    wsData.push([`Total Items: ${report.totals.total}`]);
    wsData.push([`Total Orders: ${report.order_count}`]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
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
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-brand-green-dark">THE PROTEIN MAKERS</h2>
                  <p className="text-sm text-gray-600">Kitchen Preparation Report</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{format(new Date(report.date), 'EEEE, dd MMMM yyyy')}</p>
                  <p className="text-sm text-gray-500">{report.order_count} orders | {report.totals.total} total items</p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b no-print">
              {timeSlots.map(slot => (
                <div key={slot.key} className={`rounded-lg p-4 ${slot.color}`}>
                  <slot.icon className="w-5 h-5 mb-1" />
                  <p className="text-xs font-medium opacity-70">{slot.label}</p>
                  <p className="text-2xl font-bold">{report.totals[slot.key as keyof typeof report.totals]}</p>
                  <p className="text-xs opacity-70">items</p>
                </div>
              ))}
            </div>

            {/* Time slot details */}
            {timeSlots.map(slot => {
              const items = report[slot.key as keyof Pick<KitchenReport, 'morning' | 'afternoon' | 'dinner'>];
              return (
                <div key={slot.key} className="border-b last:border-b-0">
                  <div className={`px-6 py-3 ${slot.color} flex items-center gap-2`}>
                    <slot.icon className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">{slot.label}</h3>
                    <span className="text-sm opacity-70">({report.totals[slot.key as keyof typeof report.totals]} items)</span>
                  </div>
                  {items.length === 0 ? (
                    <div className="px-6 py-4 text-gray-500 text-sm">No items for this batch</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-2 text-left font-medium text-gray-600">Meal</th>
                          <th className="px-6 py-2 text-left font-medium text-gray-600">Category</th>
                          <th className="px-6 py-2 text-left font-medium text-gray-600">Type</th>
                          <th className="px-6 py-2 text-right font-medium text-gray-600">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-6 py-3 font-medium text-gray-900">{item.meal_name}</td>
                            <td className="px-6 py-3 text-gray-600">{item.category}</td>
                            <td className="px-6 py-3"><Badge status={item.dietary_tag} /></td>
                            <td className="px-6 py-3 text-right">
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
