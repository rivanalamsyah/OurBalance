import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { formatCurrency, formatDate } from './format';
import type { Account, Transaction, Category } from '../types';

export interface PDFReportData {
  periodLabel: string;
  currentMonth: string;
  generatedAt: Date;
  userDisplayName?: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  cashFlow: number;
  accounts: Account[];
  categories: Category[];
  categoryData: { name: string; value: number; percentage: number }[];
  transactions: Transaction[];
}

export function generateFinancialReportPDF(data: PDFReportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 16;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800 (#1E293B)
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('OurBalance', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text('Laporan Keuangan & Ringkasan Transaksi', margin, 21);

  doc.setFontSize(9);
  doc.text(`Periode: ${data.periodLabel}`, pageWidth - margin, 14, { align: 'right' });
  doc.text(`Dicetak: ${format(data.generatedAt, 'dd MMM yyyy, HH:mm')}`, pageWidth - margin, 21, { align: 'right' });

  currentY = 36;

  // Section 1: Financial Summary Cards (KPIs)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('Ringkasan Keuangan Bulanan', margin, currentY);
  currentY += 6;

  const cardGap = 4;
  const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
  const cardHeight = 22;

  const kpis = [
    { label: 'Total Saldo', value: formatCurrency(data.totalBalance), color: [37, 99, 235] },
    { label: 'Pemasukan', value: formatCurrency(data.monthlyIncome), color: [16, 185, 129] },
    { label: 'Pengeluaran', value: formatCurrency(data.monthlyExpense), color: [239, 68, 68] },
    { label: 'Cash Flow', value: formatCurrency(data.cashFlow), color: data.cashFlow >= 0 ? [16, 185, 129] : [239, 68, 68] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3, currentY + 15);
  });

  currentY += cardHeight + 10;

  // Section 2: Account Balances Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Saldo Rekening & Akun', margin, currentY);
  currentY += 4;

  const accountRows = data.accounts.map((acc) => [
    acc.name,
    acc.type.toUpperCase(),
    acc.isShared ? 'Keuangan Bersama' : 'Pribadi',
    formatCurrency(acc.balance),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Nama Rekening', 'Tipe', 'Akses', 'Saldo']],
    body: accountRows.length > 0 ? accountRows : [['-', '-', '-', 'Rp 0']],
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      3: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Section 3: Category Expense Breakdown
  if (data.categoryData.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Pengeluaran per Kategori', margin, currentY);
    currentY += 4;

    const categoryRows = data.categoryData.map((cat) => [
      cat.name,
      formatCurrency(cat.value),
      `${cat.percentage}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Kategori', 'Total Pengeluaran', 'Persentase']],
      body: categoryRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'right' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Section 4: Filtered Month Transaction Ledger
  const [year, m] = data.currentMonth.split('-').map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0, 23, 59, 59);

  const monthTxs = data.transactions.filter((tx) => {
    const d = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
    return d >= start && d <= end;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Rincian Transaksi (${monthTxs.length} Transaksi)`, margin, currentY);
  currentY += 4;

  const txRows = monthTxs.map((tx) => {
    const cat = data.categories.find((c) => c.id === tx.categoryId)?.name || '-';
    const acc = data.accounts.find((a) => a.id === tx.accountId)?.name || '-';
    const toAcc = tx.toAccountId ? data.accounts.find((a) => a.id === tx.toAccountId)?.name : null;
    const accountStr = toAcc ? `${acc} → ${toAcc}` : acc;

    let typeLabel = 'Pemasukan';
    if (tx.type === 'expense') typeLabel = 'Pengeluaran';
    else if (tx.type === 'shared_expense') typeLabel = 'Pengeluaran Bersama';
    else if (tx.type === 'transfer') typeLabel = 'Transfer';

    return [
      formatDate(tx.date, 'dd MMM yyyy'),
      typeLabel,
      cat,
      accountStr,
      tx.notes || '-',
      formatCurrency(tx.amount),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Tanggal', 'Tipe', 'Kategori', 'Rekening', 'Catatan', 'Nominal']],
    body: txRows.length > 0 ? txRows : [['-', '-', '-', '-', 'Tidak ada transaksi pada periode ini', '-']],
    margin: { left: margin, right: margin, bottom: 18 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 26 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (dataInfo) => {
      const totalPages = (doc as any).internal.getNumberOfPages();
      const pageNum = dataInfo.pageNumber;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.text('OurBalance — Dokumen Laporan Keuangan Resmi', margin, pageHeight - 7);
      doc.text(`Halaman ${pageNum} dari ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    },
  });

  const filename = `OurBalance-Laporan-Keuangan-${data.currentMonth}.pdf`;
  doc.save(filename);
}
