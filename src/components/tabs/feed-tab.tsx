
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Package, Inbox, Sigma, Wheat } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Feed } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const feedSchema = z.object({
  name: z.string().min(1, "Nama pakan tidak boleh kosong"),
  supplier: z.string().min(1, "Supplier tidak boleh kosong"),
  stock: z.coerce.number().min(0, "Stok harus angka positif"),
  pricePerBag: z.coerce.number().min(0, "Harga harus angka positif"),
  schema: z.coerce.number().min(0, "Skema harus angka positif"),
});

type FeedFormData = z.infer<typeof feedSchema>;

const FeedForm = ({ feed, onSave }: { feed?: Feed, onSave: (data: any) => void }) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FeedFormData>({
    resolver: zodResolver(feedSchema),
    defaultValues: feed || { name: "", supplier: "", stock: 0, pricePerBag: 0, schema: 0 },
  });

  const onSubmit = (data: FeedFormData) => {
    const pricePerKg = data.pricePerBag > 0 ? data.pricePerBag / 50 : 0;
    const newFeedData = {
        ...data,
        lastUpdated: new Date(),
        pricePerKg,
    };
    
    if(feed) {
      onSave({ ...newFeedData, id: feed.id });
    } else {
      onSave(newFeedData);
    }
    
    setOpen(false);
    toast({ title: `Pakan ${feed ? 'diperbarui' : 'ditambahkan'}!`, description: `Data pakan ${data.name} telah disimpan.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {feed ? (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="mr-2 h-4 w-4 text-green-500" />
            <span className="text-green-500">Edit</span>
          </DropdownMenuItem>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pakan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{feed ? 'Edit' : 'Tambah'} Pakan</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Pakan</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input id="supplier" {...register("supplier")} />
            {errors.supplier && <p className="text-sm text-destructive">{errors.supplier.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stok (Kg)</Label>
            <Input id="stock" type="number" {...register("stock")} />
            {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerBag">Harga / 50Kg</Label>
            <Input id="pricePerBag" type="number" {...register("pricePerBag")} />
            {errors.pricePerBag && <p className="text-sm text-destructive">{errors.pricePerBag.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Harga / Kg</Label>
            <Input type="text" value={`Rp ${(watch("pricePerBag") / 50 || 0).toLocaleString('id-ID')}`} readOnly className="bg-muted"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schema">Skema Pakan (gram)</Label>
            <Input id="schema" type="number" {...register("schema")} className="text-green-700 dark:text-green-400 font-semibold"/>
            {errors.schema && <p className="text-sm text-destructive">{errors.schema.message}</p>}
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

export default function FeedTab() {
  const { feed, addFeed, updateFeed, removeFeed, ducks } = useAppStore();
  const { toast } = useToast();
  
  const totalStock = feed.reduce((sum, item) => sum + item.stock, 0);
  const totalSchema = feed.reduce((sum, item) => sum + item.schema, 0);
  const totalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
  const totalFeedPerDay = feed.reduce((sum, item) => sum + (item.stock > 0 ? (totalDucks * item.schema / 1000) : 0), 0);
  const averageFeedValue = totalFeedPerDay > 0 ? (feed.reduce((sum, item) => sum + (item.stock > 0 ? ((totalDucks * item.schema / 1000) * item.pricePerKg) : 0), 0) / totalFeedPerDay) : 0;

  const StatCard = ({ title, value, icon: Icon, valueClassName, footer }: { title: string, value: string, icon: React.ElementType, valueClassName?: string, footer?: React.ReactNode }) => (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow"><div className={cn("text-2xl font-bold", valueClassName)}>{value}</div></CardContent>
       {footer && (
          <CardFooter className="text-xs text-muted-foreground pt-2 pb-4 border-t mt-auto mx-6">
              {footer}
          </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Total Stok Pakan" 
            value={`${totalStock.toLocaleString('id-ID')} Kg`} 
            icon={Package} 
            footer={
                 <div className="w-full pt-2 text-xs">
                    {feed.map(item => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.name}:</span>
                            <span>{item.stock.toLocaleString('id-ID')} Kg</span>
                        </div>
                    ))}
                </div>
            }
        />
        <StatCard title="Total Skema Pakan" value={`${totalSchema.toLocaleString('id-ID')} g`} icon={Inbox} valueClassName="text-green-700 dark:text-green-400" />
        <StatCard title="Nilai Pakan" value={`Rp ${averageFeedValue.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}/kg`} icon={Sigma} />
        <StatCard title="Total Pakan/Hari" value={`${totalFeedPerDay.toLocaleString('id-ID')} Kg`} icon={Wheat} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventaris Pakan</CardTitle>
          <FeedForm onSave={addFeed} />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pakan</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Tanggal Update</TableHead>
                  <TableHead>Stok (Kg)</TableHead>
                  <TableHead>Harga/50 Kg</TableHead>
                  <TableHead>Harga/Kg</TableHead>
                  <TableHead>Skema Pakan (g)</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feed.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>{new Date(item.lastUpdated).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{item.stock.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {item.pricePerBag.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {item.pricePerKg.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-green-700 dark:text-green-400 font-semibold">{item.schema}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <FeedForm feed={item} onSave={(updatedFeed) => updateFeed(item.id, updatedFeed)} />
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                   <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Hapus</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin ingin menghapus pakan {item.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>Aksi ini akan menghapus data pakan secara permanen.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                      removeFeed(item.id);
                                      toast({ variant: 'destructive', title: `Pakan ${item.name} dihapus!` });
                                    }} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
