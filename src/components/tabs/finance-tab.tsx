
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, TrendingUp, TrendingDown, Landmark, Scale, Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Transaction } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { id as idLocale } from 'date-fns/locale';

const transactionSchema = z.object({
  date: z.string().nonempty("Tanggal harus diisi"),
  description: z.string().nonempty("Uraian harus diisi"),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  type: z.enum(["debit", "credit"]),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const TransactionForm = ({ transaction, onSave, defaultType }: { transaction?: Transaction, onSave: (data: any) => void, defaultType: "debit" | "credit" }) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction ? { ...transaction, date: new Date(transaction.date).toISOString().split('T')[0] } : {
      date: new Date().toISOString().split('T')[0],
      description: "",
      quantity: 0,
      unitPrice: 0,
      type: defaultType,
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    const total = data.quantity * data.unitPrice;
    const newTransaction = {
      ...data,
      date: new Date(data.date),
      total,
    };

    if(transaction) {
        onSave({ ...newTransaction, id: transaction.id });
    } else {
        onSave(newTransaction);
    }
    
    setOpen(false);
    toast({ title: `Transaksi ${transaction ? 'diperbarui' : 'ditambahkan'}!`, description: `Transaksi "${data.description}" telah disimpan.` });
  };
  
  const title = defaultType === 'debit' ? 'Pemasukan' : 'Pengeluaran';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {transaction ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="mr-2 h-4 w-4 text-green-500" /> <span className="text-green-500">Edit</span>
          </DropdownMenuItem>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Input {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{transaction ? 'Edit' : 'Input'} Data {title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="date">Tgl</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Uraian Transaksi</Label>
                <Textarea id="description" placeholder="cth: Penjualan telur minggu ke-1" {...register("description")} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input id="quantity" type="number" placeholder="cth: 100" {...register("quantity")} />
                    {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unitPrice">Harga Satuan</Label>
                    <Input id="unitPrice" type="number" placeholder="cth: 2500" {...register("unitPrice")} />
                    {errors.unitPrice && <p className="text-sm text-destructive">{errors.unitPrice.message}</p>}
                </div>
            </div>
            <p className="text-sm font-medium">Total: Rp {(watch("quantity") * watch("unitPrice") || 0).toLocaleString('id-ID')}</p>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default function FinanceTab() {
  const { finance, addTransaction, updateTransaction, removeTransaction, companyInfo } = useAppStore();
  const { toast } = useToast();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyIncome = finance.filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'debit').reduce((sum, t) => sum + t.total, 0);
  const monthlyExpense = finance.filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'credit').reduce((sum, t) => sum + t.total, 0);
  const netProfit = monthlyIncome - monthlyExpense;
  const profitMargin = monthlyIncome > 0 ? (netProfit / monthlyIncome * 100).toFixed(2) : 0;
  
  const debitTransactions = finance.filter(t => t.type === 'debit').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const creditTransactions = finance.filter(t => t.type === 'credit').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const StatCard = ({ title, value, icon: Icon, valueClassName, iconClassName }: { title: string, value: string, icon: React.ElementType, valueClassName?: string, iconClassName?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
      </CardContent>
    </Card>
  );
  
  const handlePrint = (transactions: Transaction[], type: 'debit' | 'credit') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Gagal Membuka Jendela Cetak",
        description: "Pastikan pop-up diizinkan untuk situs ini."
      });
      return;
    }

    const title = type === 'debit' ? 'Pemasukan' : 'Pengeluaran';
    const totalAmount = transactions.reduce((sum, t) => sum + t.total, 0);

    const tableRows = transactions.map(t => `
        <tr>
            <td>${format(new Date(t.date), "dd/MM/yyyy")}</td>
            <td>${t.description}</td>
            <td>${t.quantity.toLocaleString('id-ID')}</td>
            <td>Rp ${t.unitPrice.toLocaleString('id-ID')}</td>
            <td>Rp ${t.total.toLocaleString('id-ID')}</td>
        </tr>
    `).join('');

    const printContent = `
        <html>
            <head>
                <title>Laporan Pembukuan ${title} - ${companyInfo.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; }
                    .header p { margin: 5px 0; color: #555; }
                    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .totals { font-weight: bold; background-color: #e8e8e8; }
                    .totals td { text-align: right; }
                    .totals td:first-child { text-align: left; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Laporan Pembukuan ${title}</h1>
                    <p>${companyInfo.name}</p>
                    <p>Dicetak pada: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: idLocale })}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Tgl</th>
                            <th>Uraian</th>
                            <th>Jumlah</th>
                            <th>Harga Satuan</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                    <tfoot>
                        <tr class="totals">
                            <td colspan="4">Total ${title}</td>
                            <td>Rp ${totalAmount.toLocaleString('id-ID')}</td>
                        </tr>
                    </tfoot>
                </table>
            </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 250);
  };


  const TransactionTable = ({ 
    title, 
    transactions, 
    type 
  }: { 
    title: string, 
    transactions: Transaction[], 
    type: "debit" | "credit" 
  }) => (
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" onClick={() => handlePrint(transactions, type)}>
                    <Printer className="h-4 w-4" />
                    <span className="sr-only">Cetak</span>
                </Button>
                <TransactionForm onSave={addTransaction} defaultType={type} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tgl</TableHead>
                    <TableHead>Uraian</TableHead>
                    <TableHead className="w-[100px] text-right">Jumlah</TableHead>
                    <TableHead className="w-[120px] text-right">Harga Satuan</TableHead>
                    <TableHead className="w-[120px] text-right">Total</TableHead>
                    <TableHead className="w-[80px] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Tidak ada data {type === 'debit' ? 'pemasukan' : 'pengeluaran'}.</TableCell></TableRow>
                    ) : (
                      transactions.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{t.description}</TableCell>
                          <TableCell className="text-right">{t.quantity.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right">Rp ${t.unitPrice.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right">Rp ${t.total.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <TransactionForm transaction={t} onSave={(updated) => updateTransaction(t.id, updated)} defaultType={type} />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /><span>Hapus</span></DropdownMenuItem></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Yakin ingin menghapus transaksi ini?</AlertDialogTitle><AlertDialogDescription>"{t.description}" akan dihapus permanen.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => { removeTransaction(t.id); toast({ variant: 'destructive', title: 'Transaksi Dihapus!' }) }} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pendapatan Bulanan" value={`Rp ${monthlyIncome.toLocaleString('id-ID')}`} icon={TrendingUp} />
        <StatCard title="Pengeluaran Bulanan" value={`Rp ${monthlyExpense.toLocaleString('id-ID')}`} icon={TrendingDown} />
        <StatCard 
            title="Laba Bersih" 
            value={`Rp ${netProfit.toLocaleString('id-ID')}`} 
            icon={Landmark} 
            valueClassName={netProfit < 0 ? 'text-red-500' : ''}
            iconClassName={netProfit < 0 ? 'text-red-500' : ''}
        />
        <StatCard 
            title="Margin Keuntungan" 
            value={`${profitMargin}%`} 
            icon={Scale} 
            valueClassName={netProfit < 0 ? 'text-red-500' : ''}
            iconClassName={netProfit < 0 ? 'text-red-500' : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionTable title="Pembukuan Pemasukan (Debit)" transactions={debitTransactions} type="debit" />
        <TransactionTable title="Pembukuan Pengeluaran (Kredit)" transactions={creditTransactions} type="credit" />
      </div>

    </div>
  );
}

    