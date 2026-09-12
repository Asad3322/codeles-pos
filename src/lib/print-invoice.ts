import type { CartItem } from "@/types";
import { formatCurrency } from "@/lib/utils";

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  invoiceNumber: string;
  date: string;
  cashier: string;
  customer?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: { method: string; amount: number }[];
  footer?: string;
  currencySymbol?: string;
}

export function generateThermalReceiptHTML(data: ReceiptData): string {
  const fmt = (n: number) => formatCurrency(n);

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:3px 0;vertical-align:top">
        <div style="font-weight:bold">${item.name}</div>
        <div style="font-size:11px;color:#333">${item.quantity} x ${fmt(item.price)}</div>
      </td>
      <td style="text-align:right;padding:3px 0;vertical-align:top;font-weight:bold">
        ${fmt(item.price * item.quantity * (1 - item.discount / 100))}
      </td>
    </tr>`
    )
    .join("");

  const paymentsHtml = data.payments
    .map(
      (p) =>
        `<div style="display:flex;justify-content:space-between;text-transform:capitalize"><span>Payment (${p.method})</span><span>${fmt(p.amount)}</span></div>`
    )
    .join("");

  const storeTitle = data.storeName || "Codeles POS";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${data.invoiceNumber}</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 2mm; }
      body { width: 72mm; }
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.35;
      width: 280px;
      margin: 0 auto;
      padding: 10px 8px;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    .divider-double { border: none; border-top: 2px solid #000; margin: 8px 0; }
    .total-row { font-size: 14px; font-weight: bold; }
    .brand-footer {
      text-align: center;
      margin-top: 14px;
      padding-top: 6px;
      font-size: 10px;
      letter-spacing: 0.5px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="divider-double"></div>
  <div class="center bold" style="font-size:16px;letter-spacing:0.5px">${storeTitle}</div>
  <div class="center" style="font-size:11px;margin-top:2px;letter-spacing:0.5px">Powered by Codeles POS</div>
  <div class="divider-double"></div>

  ${data.storeAddress ? `<div class="center" style="font-size:11px">${data.storeAddress}</div>` : ""}
  ${data.storePhone ? `<div class="center" style="font-size:11px">Tel: ${data.storePhone}</div>` : ""}

  <div style="margin-top:6px;font-size:11px">
    <div><strong>Invoice:</strong> ${data.invoiceNumber}</div>
    <div><strong>Date:</strong> ${data.date}</div>
    <div><strong>Cashier:</strong> ${data.cashier}</div>
    ${data.customer ? `<div><strong>Customer:</strong> ${data.customer}</div>` : ""}
  </div>

  <hr>
  <table>${itemsHtml}</table>
  <hr>

  <div style="display:flex;justify-content:space-between"><span>Subtotal:</span><span>${fmt(data.subtotal)}</span></div>
  ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Discount:</span><span>-${fmt(data.discount)}</span></div>` : ""}
  ${data.tax > 0 ? `<div style="display:flex;justify-content:space-between"><span>Tax:</span><span>${fmt(data.tax)}</span></div>` : ""}

  <div class="divider-double"></div>
  <div class="total-row" style="display:flex;justify-content:space-between">
    <span>TOTAL:</span>
    <span>${fmt(data.total)}</span>
  </div>
  <div class="divider-double"></div>

  <div style="margin-top:4px;font-size:11px">${paymentsHtml}</div>
  <hr>

  <div class="center bold" style="margin-top:8px">${data.footer ?? "Thank you for your business!"}</div>
  
  <div class="brand-footer">
    Designed by Codeles
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

export function printThermalReceipt(data: ReceiptData) {
  const html = generateThermalReceiptHTML(data);
  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) {
    alert("Please allow popups for printing");
    return;
  }
  win.document.write(html);
  win.document.close();
}
