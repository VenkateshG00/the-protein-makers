import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string, fmt: string = 'dd MMM yyyy'): string {
  return format(parseISO(dateStr), fmt);
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
}

export function generateOrderId(date: Date, sequenceNumber: number): string {
  const dateStr = format(date, 'yyyyMMdd');
  const seq = String(sequenceNumber).padStart(3, '0');
  return `TPM-${dateStr}-${seq}`;
}

export function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
}
