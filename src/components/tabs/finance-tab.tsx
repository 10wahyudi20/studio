
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, TrendingUp, TrendingDown, Landmark, Scale } from "lucide-react";
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

const transactionSchema = z.object({
  date: z.string().nonempty("Tanggal harus diisi"),
  description: z.string().nonempty("Uraian harus diisi"),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  type: z.enum(["debit", "credit"]),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const TransactionForm = ({ transaction, onSave }: { transaction?: Transaction, onSave: (data: any) => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction ? { ...transaction, date: new Date(transaction.date).toISOString().split('T')[0] } : {
      date: new Date().toISOString().split('T')[0],
      description: "",
      quantity: 0,
      unitPrice: 0,
      type: "credit",
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
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {transaction ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="mr-2 h-4 w-4 text-green-500" /> <span className="text-green-500">Edit</span>
          </DropdownMenuItem>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Input Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{transaction ? 'Edit' : 'Input'} Data Keuangan</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
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
            <div className="space-y-2">
                <Label>Jenis Transaksi</Label>
                <Controller
                    control={control} name="type"
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-1">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="debit" id="debit" />
                                <Label htmlFor="debit" className="font-normal dark:text-green-400">Pemasukan (Debit)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="credit" id="credit" />
                                <Label htmlFor="credit" className="font-normal dark:text-red-400">Pengeluaran (Kredit)</Label>
                            </div>
                        </RadioGroup>
                    )} 
                />
            </div>
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
  const { finance, addTransaction, updateTransaction, removeTransaction } = useAppStore();
  const { toast } = useToast();

  const currentMonth = new Date().getMonth();
  const monthlyIncome = finance.filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'debit').reduce((sum, t) => sum + t.total, 0);
  const monthlyExpense = finance.filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'credit').reduce((sum, t) => sum + t.total, 0);
  const netProfit = monthlyIncome - monthlyExpense;
  const profitMargin = monthlyIncome > 0 ? (netProfit / monthlyIncome * 100).toFixed(2) : 0;
  
  const debitTransactions = finance.filter(t => t.type === 'debit').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const creditTransactions = finance.filter(t => t.type === 'credit').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );

  const TransactionRow = ({ t }: { t: Transaction }) => (
    <TableRow key={t.id}>
      <TableCell>{new Date(t.date).toLocaleDateString('id-ID')}</TableCell>
      <TableCell>{t.description}</TableCell>
      <TableCell>{t.quantity}</TableCell>
      <TableCell>Rp {t.unitPrice.toLocaleString('id-ID')}</TableCell>
      <TableCell>Rp {t.total.toLocaleString('id-ID')}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <TransactionForm transaction={t} onSave={(updated) => updateTransaction(t.id, updated)} />
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
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pendapatan Bulanan" value={`Rp ${monthlyIncome.toLocaleString('id-ID')}`} icon={TrendingUp} />
        <StatCard title="Pengeluaran Bulanan" value={`Rp ${monthlyExpense.toLocaleString('id-ID')}`} icon={TrendingDown} />
        <StatCard title="Laba Bersih" value={`Rp ${netProfit.toLocaleString('id-ID')}`} icon={Landmark} />
        <StatCard title="Margin Keuntungan" value={`${profitMargin}%`} icon={Scale} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pembukuan</CardTitle>
          <TransactionForm onSave={addTransaction} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Uraian</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-green-100 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/30">
                  <TableCell colSpan={6} className="font-bold text-green-700 dark:text-green-400">
                    PEMASUKAN (DEBIT)
                  </TableCell>
                </TableRow>
                {debitTransactions.map((t) => <TransactionRow key={t.id} t={t} />)}
                {debitTransactions.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Tidak ada data pemasukan.</TableCell></TableRow>
                )}
              </TableBody>
              <TableBody>
                <TableRow className="bg-red-100 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30">
                  <TableCell colSpan={6} className="font-bold text-red-700 dark:text-red-400">
                    PENGELUARAN (KREDIT)
                  </TableCell>
                </TableRow>
                {creditTransactions.map((t) => <TransactionRow key={t.id} t={t} />)}
                {creditTransactions.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Tidak ada data pengeluaran.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
