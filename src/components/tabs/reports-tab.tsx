
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Loader2, Eye } from "lucide-react";
import { useAppStore } from "@/hooks/use-app-store";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const months = [
    { value: 1, name: "Januari" },
    { value: 2, name: "Februari" },
    { value: 3, name: "Maret" },
    { value: 4, name: "April" },
    { value: 5, name: "Mei" },
    { value: 6, name: "Juni" },
    { value: 7, name: "Juli" },
    { value: 8, name: "Agustus" },
    { value: 9, name: "September" },
    { value: 10, name: "Oktober" },
    { value: 11, name: "November" },
    { value: 12, name: "Desember" },
];

const currentYearForList = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYearForList - i);


export default function ReportsTab() {
  const { companyInfo, ducks, eggProduction, finance, feed, lastPrediction } = useAppStore();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGenerateReport = () => {
    setIsLoading(true);

    // Use a brief timeout to allow the UI to update to the loading state
    setTimeout(() => {
        const year = parseInt(selectedYear, 10);
        const month = parseInt(selectedMonth, 10);
        const monthName = months.find(m => m.value === month)?.name || '';
        
        // --- DATA FOR DETAILED TABLES (FILTERED BY PERIOD) ---
        const dailyProdDataForPeriod = eggProduction.daily.filter(d => {
            const date = new Date(d.date);
            return date.getFullYear() === year && date.getMonth() + 1 === month;
        });

        const financeDataForPeriod = finance.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === year && date.getMonth() + 1 === month;
        });
        
        // --- DATA FOR ALL-TIME SUMMARY ---
        const totalDucks = ducks.reduce((sum, d) => sum + d.quantity, 0);
        const totalEggsAllTime = eggProduction.daily.reduce((sum, d) => sum + d.totalEggs, 0);
        const totalIncomeAllTime = finance.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.total, 0);
        const totalExpenseAllTime = finance.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.total, 0);
        const netProfitAllTime = totalIncomeAllTime - totalExpenseAllTime;

        if (dailyProdDataForPeriod.length === 0 && financeDataForPeriod.length === 0 && ducks.length === 0 && feed.length === 0 && !lastPrediction) {
            toast({
                variant: "destructive",
                title: "Data Tidak Ditemukan",
                description: `Tidak ada data apapun yang dapat dicetak.`
            });
            setIsLoading(false);
            return;
        }

        try {
            const doc = new jsPDF();

            // --- HEADER ---
            doc.setFontSize(20);
            doc.text(`Laporan Bulanan - ${companyInfo.name}`, 14, 22);
            doc.setFontSize(11);
            doc.text(`Periode Detail: ${monthName} ${year}`, 14, 30);
            doc.setFontSize(9);
            doc.text(`${companyInfo.address} | ${companyInfo.phone} | ${companyInfo.email}`, 14, 35);

            let finalY = 45;

            // --- ALL-TIME SUMMARY DATA ---
            autoTable(doc, {
                startY: finalY,
                head: [['Ringkasan Umum (Keseluruhan)']],
                body: [
                    ['Total Populasi Bebek', `${totalDucks.toLocaleString('id-ID')} ekor`],
                    ['Total Produksi Telur', `${totalEggsAllTime.toLocaleString('id-ID')} butir`],
                    ['Total Pemasukan', `Rp ${totalIncomeAllTime.toLocaleString('id-ID')}`],
                    ['Total Pengeluaran', `Rp ${totalExpenseAllTime.toLocaleString('id-ID')}`],
                    ['Laba / Rugi Bersih', `Rp ${netProfitAllTime.toLocaleString('id-ID')}`],
                ],
                theme: 'grid',
                headStyles: { fillColor: [66, 165, 245] }
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
            
            // --- DETAIL PRODUKSI HARIAN (for selected period) ---
            if(dailyProdDataForPeriod.length > 0) {
                 autoTable(doc, {
                    startY: finalY,
                    head: [[`Detail Produksi Harian (${monthName} ${year})`, 'Jumlah Telur (Butir)', 'Produktifitas (%)']],
                    body: dailyProdDataForPeriod.map(d => [
                        format(new Date(d.date), 'dd/MM/yyyy'),
                        d.totalEggs.toLocaleString('id-ID'),
                        `${d.productivity.toFixed(2)} %`
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [33, 150, 243] },
                    didDrawPage: (data) => { if(data.cursor) finalY = data.cursor.y; }
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;
            }

            // --- DETAIL KEUANGAN (for selected period) ---
            const debitTransactions = financeDataForPeriod.filter(t => t.type === 'debit');
            const creditTransactions = financeDataForPeriod.filter(t => t.type === 'credit');

            if(debitTransactions.length > 0) {
                autoTable(doc, {
                    startY: finalY,
                    head: [[`Detail Pemasukan (Debit) - ${monthName} ${year}`, 'Uraian', 'Total']],
                    body: debitTransactions.map(t => [
                        format(new Date(t.date), 'dd/MM/yyyy'),
                        t.description,
                        `Rp ${t.total.toLocaleString('id-ID')}`
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [76, 175, 80] }, // Green for income
                    didDrawPage: (data) => { if(data.cursor) finalY = data.cursor.y; }
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;
            }

            if(creditTransactions.length > 0) {
                autoTable(doc, {
                    startY: finalY,
                    head: [[`Detail Pengeluaran (Kredit) - ${monthName} ${year}`, 'Uraian', 'Total']],
                    body: creditTransactions.map(t => [
                        format(new Date(t.date), 'dd/MM/yyyy'),
                        t.description,
                        `Rp ${t.total.toLocaleString('id-ID')}`
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [244, 67, 54] }, // Red for expense
                    didDrawPage: (data) => { if(data.cursor) finalY = data.cursor.y; }
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;
            }
            
            // --- STOK PAKAN ---
             if(feed.length > 0) {
                autoTable(doc, {
                    startY: finalY,
                    head: [['Stok Pakan (Saat Laporan Dibuat)']],
                    body: feed.map(f => [
                        `${f.name} (${f.supplier})`,
                        `${f.stock.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg`
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [129, 199, 132] },
                     didDrawPage: (data) => { if(data.cursor) finalY = data.cursor.y; }
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;
            }
            
            // --- AI PREDICTION ---
            if (lastPrediction) {
                doc.addPage();
                doc.setFontSize(20);
                doc.text('Hasil Prediksi AI', 14, 22);
                finalY = 30;

                const predictionHeader = `Total Prediksi: ${lastPrediction.totalPredictedProduction.toLocaleString('id-ID')} Butir`;
                doc.setFontSize(12);
                doc.text(predictionHeader, 14, finalY);
                finalY += 10;
                
                autoTable(doc, {
                    startY: finalY,
                    head: [['Tanggal Prediksi', 'Jumlah Telur (Butir)']],
                    body: lastPrediction.dailyPredictions.map(p => [
                        p.day,
                        p.predictedEggs.toLocaleString('id-ID')
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [149, 117, 205] }, // Deep Purple
                    didDrawPage: (data) => { if(data.cursor) finalY = data.cursor.y; }
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;

                doc.setFontSize(12);
                doc.text('Analisis & Alasan Prediksi', 14, finalY);
                finalY += 6;
                doc.setFontSize(10);
                
                const splitReasoning = doc.splitTextToSize(lastPrediction.reasoning, 180);
                doc.text(splitReasoning, 14, finalY);
            }

            // --- FOOTER ---
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                const pageHeight = doc.internal.pageSize.getHeight();
                const printDate = format(new Date(), "'Dicetak pada:' dd MMMM yyyy, HH:mm", { locale: idLocale });
                doc.setFontSize(8);
                doc.text(printDate, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
            }

            // Open the PDF in a new tab
            doc.output('dataurlnewwindow');

            toast({ title: "Laporan Dibuat!", description: "Laporan telah dibuka di tab baru." });

        } catch (error) {
            console.error("Failed to generate PDF", error);
            toast({ variant: "destructive", title: "Gagal Membuat Laporan", description: "Terjadi kesalahan saat membuat file PDF." });
        } finally {
            setIsLoading(false);
        }
    }, 100); 
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Laporan Bulanan</CardTitle>
          <CardDescription>Pilih periode untuk membuat laporan PDF yang terperinci.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto flex-grow">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto flex-grow">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Tampilkan Laporan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    