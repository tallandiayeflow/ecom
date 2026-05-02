export interface ReceiptData {
  transactionNumber: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashTendered: number;
  changeGiven: number;
  createdAt: string;
  offline?: boolean;
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  mixed: 'Mixte',
};

export function generateReceiptHTML(data: ReceiptData): string {
  const date = new Date(data.createdAt).toLocaleString('fr-FR');
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding: 2px 0">${item.productName}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${item.unitPrice.toLocaleString()}</td>
      <td style="text-align:right">${item.lineTotal.toLocaleString()}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body { margin: 4mm; }
  }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    width: 76mm;
    margin: 0 auto;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .large { font-size: 16px; }
  hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; border-bottom: 1px solid #000; }
  .total-row td { font-weight: bold; border-top: 1px dashed #000; padding-top: 4px; }
  .footer { margin-top: 8px; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <div class="center">
    <div class="bold large">NOOR</div>
    <div>Dakar, Sénégal</div>
  </div>
  <hr>
  <div>${date}</div>
  <div>Caissier: ${data.cashierName}</div>
  ${data.customerName ? `<div>Client: ${data.customerName}</div>` : ''}
  <div>Reçu: <strong>${data.transactionNumber}</strong>${data.offline ? ' (hors ligne)' : ''}</div>
  <hr>
  <table>
    <thead>
      <tr>
        <th style="width:50%">Article</th>
        <th style="text-align:center">Qté</th>
        <th style="text-align:right">PU</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      ${data.discount > 0 ? `
      <tr>
        <td colspan="3">Remise:</td>
        <td style="text-align:right">-${data.discount.toLocaleString()}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3">TOTAL:</td>
        <td style="text-align:right">${data.total.toLocaleString()} XOF</td>
      </tr>
      <tr>
        <td colspan="3">${METHOD_LABELS[data.paymentMethod] || data.paymentMethod}:</td>
        <td style="text-align:right">${data.cashTendered > 0 ? data.cashTendered.toLocaleString() : data.total.toLocaleString()}</td>
      </tr>
      ${data.changeGiven > 0 ? `
      <tr>
        <td colspan="3">Monnaie:</td>
        <td style="text-align:right">${data.changeGiven.toLocaleString()}</td>
      </tr>` : ''}
    </tfoot>
  </table>
  <hr>
  <div class="footer">Merci pour votre achat !</div>
</body>
</html>`;
}

export function printReceipt(data: ReceiptData) {
  const html = generateReceiptHTML(data);
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}
