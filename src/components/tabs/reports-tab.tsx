
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

export default function ReportsTab() {
  const { companyInfo, ducks, eggProduction, finance, feed } = useAppStore();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth));
  const [isLoading, setIsLoading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);


  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, name: "Januari" }, { value: 2, name: "Februari" }, { value: 3, name: "Maret" },
    { value: 4, name: "April" }, { value: 5, name: "Mei" }, { value: 6, name: "Juni" },
    { value: 7, name: "Juli" }, { value: 8, name: "Agustus" }, { value: 9, name: "September" },
    { value: 10, name: "Oktober" }, { value: 11, name: "November" }, { value: 12, name: "Desember" }
  ];

  // Clean up the object URL when the component unmounts or when a new URL is created
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const handleGenerateReport = () => {
    setIsLoading(true);
    // Revoke any existing URL before creating a new one
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
    
    setTimeout(() => {
        const year = parseInt(selectedYear, 10);
        const month = parseInt(selectedMonth, 10);

        // Filter data for the selected month and year
        const dailyProdData = eggProduction.daily.filter(d => {
            const date = new Date(d.date);
            return date.getFullYear() === year && date.getMonth() + 1 === month;
        });

        const financeData = finance.filter(t => {
            const date = new Date(t.date);
            return date.getFullYear() === year && date.getMonth() + 1 === month;
        });

        if (dailyProdData.length === 0 && financeData.length === 0) {
            toast({
                variant: "destructive",
                title: "Data Tidak Ditemukan",
                description: `Tidak ada data produksi atau keuangan untuk ${months.find(m => m.value === month)?.name} ${year}.`
            });
            setIsLoading(false);
            return;
        }

        try {
            const doc = new jsPDF();
            const monthName = months.find(m => m.value === month)?.name || '';

            // --- HEADER ---
            doc.setFontSize(20);
            doc.text(`Laporan Bulanan - ${companyInfo.name}`, 14, 22);
            doc.setFontSize(11);
            doc.text(`Periode: ${monthName} ${year}`, 14, 30);
            doc.setFontSize(9);
            doc.text(`${companyInfo.address} | ${companyInfo.phone} | ${companyInfo.email}`, 14, 35);

            let finalY = 45;

            // --- RINGKASAN ---
            const totalDucks = ducks.reduce((sum, d) => sum + d.quantity, 0);
            const totalEggsMonth = dailyProdData.reduce((sum, d) => sum + d.totalEggs, 0);
            const income = financeData.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.total, 0);
            const expense = financeData.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.total, 0);

            autoTable(doc, {
                startY: finalY,
                head: [['Ringkasan Umum']],
                body: [
                    ['Total Populasi Bebek', `${totalDucks.toLocaleString('id-ID')} Ekor`],
                    ['Total Produksi Telur', `${totalEggsMonth.toLocaleString('id-ID')} Butir`],
                    ['Total Pemasukan', `Rp ${income.toLocaleString('id-ID')}`],
                    ['Total Pengeluaran', `Rp ${expense.toLocaleString('id-ID')}`],
                    ['Laba / Rugi Bersih', `Rp ${(income - expense).toLocaleString('id-ID')}`],
                ],
                theme: 'grid',
                headStyles: { fillColor: [66, 165, 245] }
            });
            finalY = (doc as any).lastAutoTable.finalY + 10;
            
            // --- DETAIL PRODUKSI HARIAN ---
            if(dailyProdData.length > 0) {
                 autoTable(doc, {
                    startY: finalY,
                    head: [['Tanggal', 'Jumlah Telur (Butir)', 'Produktifitas (%)']],
                    body: dailyProdData.map(d => [
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

            // --- DETAIL KEUANGAN ---
            if(financeData.length > 0) {
                autoTable(doc, {
                    startY: finalY,
                    head: [['Tanggal', 'Uraian', 'Jenis', 'Total (Rp)']],
                    body: financeData.map(t => [
                        format(new Date(t.date), 'dd/MM/yyyy'),
                        t.description,
                        t.type === 'debit' ? 'Pemasukan' : 'Pengeluaran',
                        t.total.toLocaleString('id-ID')
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [33, 150, 243] },
                    didDrawPage: (data) => { if(data.cursor) finalY = data.cursor.y; }
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;
            }
            
            // --- STOK PAKAN ---
             if(feed.length > 0) {
                autoTable(doc, {
                    startY: finalY,
                    head: [['Stok Pakan (Saat Laporan Dibuat)']],
                    body: [
                        ...feed.map(f => [
                            `${f.name} (${f.supplier})`,
                            `${f.stock.toLocaleString('id-ID')} Kg`
                        ]),
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [129, 199, 132] },
                     didDrawPage: (data) => { if(data.cursor) finalY = data.cursor.y; }
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;
            }
            
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            setPdfPreviewUrl(blobUrl);


            toast({ title: "Pratinjau Laporan Dibuat!", description: "Laporan kini ditampilkan di bawah." });

        } catch (error) {
            console.error("Failed to generate PDF", error);
            toast({ variant: "destructive", title: "Gagal Membuat Laporan", description: "Terjadi kesalahan saat membuat file PDF." });
        } finally {
            setIsLoading(false);
        }
    }, 500); // Add a small delay for better UX
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
            Tampilkan Pratinjau
          </Button>
        </CardContent>
      </Card>
      
      {isLoading && (
         <div className="text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Membuat pratinjau laporan...</p>
        </div>
      )}

      {pdfPreviewUrl && (
        <Card>
            <CardHeader>
                <CardTitle>Pratinjau Laporan</CardTitle>
                <CardDescription>
                    Periksa laporan di bawah ini. Anda dapat mengunduh atau mencetaknya dari kontrol pratinjau.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[700px] border rounded-md"
                    title="Pratinjau Laporan"
                ></iframe>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
