
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, RefreshCw, Layers, Users, TrendingDown, ArrowRightLeft, ShieldOff, Notebook, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Duck, DeathRecord } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";

const duckSchema = z.object({
  cage: z.number().min(1),
  quantity: z.coerce.number().min(0),
  deaths: z.coerce.number().min(0),
  entryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Tanggal tidak valid" }),
  cageSizeLength: z.coerce.number().min(0),
  cageSizeWidth: z.coerce.number().min(0),
  cageSystem: z.enum(["baterai", "umbaran"]),
});

type DuckFormData = z.infer<typeof duckSchema>;

const DuckForm = ({ duck, onSave, children }: { duck?: Duck; onSave: (data: any) => void, children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const { ducks } = useAppStore();
  const { toast } = useToast();
  
  const parseCageSize = (cageSize?: string) => {
    if (!cageSize) return { length: 0, width: 0 };
    // Handles both "5m x 5m" and "5x5m"
    const parts = cageSize.replace(/m/g, '').split('x').map(p => p.trim());
    return {
        length: Number(parts[0]) || 0,
        width: Number(parts[1]) || 0
    };
  };

  const defaultValues = duck
    ? {
        ...duck,
        entryDate: format(new Date(duck.entryDate), "yyyy-MM-dd"),
        cageSizeLength: parseCageSize(duck.cageSize).length,
        cageSizeWidth: parseCageSize(duck.cageSize).width,
      }
    : {
        cage: ducks.length > 0 ? Math.max(...ducks.map(d => d.cage)) + 1 : 1,
        quantity: 0,
        deaths: 0,
        entryDate: format(new Date(), "yyyy-MM-dd"),
        cageSizeLength: 0,
        cageSizeWidth: 0,
        cageSystem: "umbaran" as "baterai" | "umbaran",
    };
    
  const { register, handleSubmit, control, formState: { errors } } = useForm<DuckFormData>({
    resolver: zodResolver(duckSchema),
    defaultValues
  });

  const onSubmit = (data: DuckFormData) => {
    // Convert string date back to Date object before saving
    const saveData = { ...data, entryDate: parseISO(data.entryDate) };
    onSave(saveData);
    setOpen(false);
    toast({
      title: `Kandang ${duck ? 'diperbarui' : 'ditambahkan'}!`,
      description: `Data untuk kandang ${data.cage} telah disimpan.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{duck ? 'Edit' : 'Tambah'} Inventaris Bebek</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cage" className="text-right">Kandang</Label>
                <Input id="cage" {...register("cage", { valueAsNumber: true })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Jumlah Bebek</Label>
                <Input id="quantity" type="number" {...register("quantity")} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deaths" className="text-right">Bebek Mati (Total)</Label>
                <Input id="deaths" type="number" {...register("deaths")} className="col-span-3" readOnly />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entryDate" className="text-right">Tanggal Masuk</Label>
                 <Input id="entryDate" type="date" {...register("entryDate")} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ukuran Kandang</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Input id="cageSizeLength" type="number" placeholder="Panjang (m)" {...register("cageSizeLength")} />
                    <Input id="cageSizeWidth" type="number" placeholder="Lebar (m)" {...register("cageSizeWidth")} />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Sistem Kandang</Label>
                <Controller
                    control={control}
                    name="cageSystem"
                    render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="col-span-3 flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="baterai" id="baterai" />
                                <Label htmlFor="baterai">Baterai</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="umbaran" id="umbaran" />
                                <Label htmlFor="umbaran">Umbaran</Label>
                            </div>
                        </RadioGroup>
                    )}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Batal</Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const deathRecordSchema = z.object({
    cage: z.coerce.number({invalid_type_error: "Kandang harus dipilih"}).min(1, "Kandang harus dipilih"),
    quantity: z.coerce.number().min(1, "Jumlah harus minimal 1"),
    notes: z.string().optional(),
});
type DeathRecordFormData = z.infer<typeof deathRecordSchema>;

const RecordDeathForm = () => {
    const { ducks, addDeathRecord } = useAppStore();
    const [isRecordOpen, setIsRecordOpen] = React.useState(false);
    const { toast } = useToast();

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm<DeathRecordFormData>({
        resolver: zodResolver(deathRecordSchema),
        defaultValues: { cage: undefined, quantity: 1, notes: "" }
    });

    const onSubmit = (data: DeathRecordFormData) => {
        addDeathRecord(data);
        setIsRecordOpen(false);
        reset();
        toast({ title: `Catatan Kematian Disimpan`, description: `${data.quantity} bebek mati di kandang ${data.cage} telah dicatat.` });
    };

    return (
        <Dialog open={isRecordOpen} onOpenChange={setIsRecordOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    <Pencil className="h-3 w-3 mr-1" /> Catat
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Catat Bebek Mati</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Kandang</Label>
                        <Controller 
                            name="cage" 
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                    <SelectTrigger><SelectValue placeholder="Pilih kandang..." /></SelectTrigger>
                                    <SelectContent>
                                        {ducks.map(d => <SelectItem key={d.id} value={String(d.cage)}>Kandang {d.cage}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.cage && <p className="text-sm text-destructive">{errors.cage.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Jumlah</Label>
                        <Input id="quantity" type="number" {...register("quantity")} />
                        {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan (Opsional)</Label>
                        <Textarea id="notes" {...register("notes")} placeholder="cth: Sakit, stress, dll."/>
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

const ViewDeathRecordsDialog = ({ children }: { children: React.ReactNode }) => {
    const { deathRecords } = useAppStore();
    const sortedRecords = [...deathRecords].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="flex flex-row justify-between items-center pr-10">
                    <DialogTitle>Catatan Bebek Mati</DialogTitle>
                    <RecordDeathForm />
                </DialogHeader>
                <ScrollArea className="h-96">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kandang</TableHead>
                                <TableHead>Jumlah</TableHead>
                                <TableHead>Catatan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">Belum ada catatan kematian.</TableCell>
                                </TableRow>
                            ) : sortedRecords.map(record => (
                                <TableRow key={record.id}>
                                    <TableCell>{format(new Date(record.date), "dd/MM/yyyy")}</TableCell>
                                    <TableCell>{record.cage}</TableCell>
                                    <TableCell>{record.quantity}</TableCell>
                                    <TableCell>{record.notes || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default function PopulationTab() {
  const { ducks, addDuck, updateDuck, removeDuck, resetDuck } = useAppStore();
  const { toast } = useToast();

  const totalDucks = ducks.reduce((acc, duck) => acc + duck.quantity, 0);
  const totalDeaths = ducks.reduce((acc, duck) => acc + duck.deaths, 0);
  const bayahCount = ducks.filter(d => d.status === 'Bebek Bayah').reduce((acc, duck) => acc + duck.quantity, 0);
  const petelurCount = ducks.filter(d => d.status === 'Bebek Petelur').reduce((acc, duck) => acc + duck.quantity, 0);
  const tuaCount = ducks.filter(d => d.status === 'Bebek Tua').reduce((acc, duck) => acc + duck.quantity, 0);
  const afkirCount = ducks.filter(d => d.status === 'Bebek Afkir').reduce((acc, duck) => acc + duck.quantity, 0);
  
  const getStatusClasses = (status: Duck['status']) => {
    const baseClasses = "px-3 py-1 text-xs font-medium rounded-md border text-center inline-block";
    switch (status) {
      case 'Bebek Bayah':
        return cn(baseClasses, "bg-green-100/50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700");
      case 'Bebek Petelur':
        return cn(baseClasses, "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700");
      case 'Bebek Tua':
        return cn(baseClasses, "bg-yellow-100/50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700");
      case 'Bebek Afkir':
        return cn(baseClasses, "bg-red-100/50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700");
      default:
        return cn(baseClasses, "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700");
    }
  };

  const StatCard = ({ title, value, icon: Icon, footer, valueClassName, iconClassName }: { title: string, value: string | number, icon: React.ElementType, footer?: React.ReactNode, valueClassName?: string, iconClassName?: string }) => (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
      </CardContent>
       {footer && (
          <CardFooter className="text-xs text-muted-foreground pt-2 pb-4 border-t mt-auto mx-6">
              {footer}
          </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard 
            title="Total Bebek" 
            value={totalDucks} 
            icon={Users}
             footer={
                 <div className="w-full pt-2 text-xs">
                    <div className="flex justify-between items-center text-red-500 font-medium">
                        <span>Bebek Mati:</span>
                        <span>{totalDeaths}</span>
                    </div>
                </div>
            }
          />
          <StatCard 
            title="Bebek Mati" 
            value={totalDeaths} 
            icon={TrendingDown} 
            valueClassName={cn(totalDeaths > 0 && "text-red-500")}
            iconClassName={cn(totalDeaths > 0 && "text-red-500")}
          />
          <StatCard 
            title="Bebek Bayah" 
            value={bayahCount} 
            icon={Layers}
            valueClassName={cn(bayahCount > 0 && "text-green-500")}
            iconClassName={cn(bayahCount > 0 && "text-green-500")}
          />
          <StatCard 
            title="Bebek Petelur" 
            value={petelurCount} 
            icon={ArrowRightLeft}
            valueClassName={cn(petelurCount > 0 && "text-blue-500")}
            iconClassName={cn(petelurCount > 0 && "text-blue-500")}
          />
          <StatCard 
            title="Bebek Tua" 
            value={tuaCount} 
            icon={Users}
            valueClassName={cn(tuaCount > 0 && "text-yellow-500")}
            iconClassName={cn(tuaCount > 0 && "text-yellow-500")}
          />
          <StatCard 
            title="Bebek Afkir" 
            value={afkirCount} 
            icon={ShieldOff}
            valueClassName={cn(afkirCount > 0 && "text-red-500")}
            iconClassName={cn(afkirCount > 0 && "text-red-500")}
          />
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventaris Bebek</CardTitle>
          <DuckForm onSave={addDuck}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Bebek
            </Button>
          </DuckForm>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Kandang</TableHead>
                  <TableHead className="text-center">Jumlah Bebek</TableHead>
                  <TableHead className="text-center">
                    <ViewDeathRecordsDialog>
                        <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">Bebek Mati</Button>
                    </ViewDeathRecordsDialog>
                  </TableHead>
                  <TableHead className="text-center">Tanggal Masuk</TableHead>
                  <TableHead className="text-center">Usia (Bulan)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ukuran Kandang</TableHead>
                  <TableHead className="text-center">Sistem Kandang</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ducks.map((duck) => (
                  <TableRow key={duck.id}>
                    <TableCell className="text-center align-middle">{duck.cage}</TableCell>
                    <TableCell className="text-center align-middle">{duck.quantity}</TableCell>
                    <TableCell className="text-center align-middle text-red-500 font-semibold">{duck.deaths}</TableCell>
                    <TableCell className="text-center align-middle">{format(new Date(duck.entryDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-center align-middle">{duck.ageMonths}</TableCell>
                    <TableCell className="text-center align-middle">
                        <span className={getStatusClasses(duck.status)}>
                            {duck.status}
                        </span>
                    </TableCell>
                    <TableCell className="text-center align-middle">{duck.cageSize}</TableCell>
                    <TableCell className="text-center align-middle">{duck.cageSystem}</TableCell>
                    <TableCell className="text-center align-middle">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DuckForm duck={duck} onSave={(updatedDuck) => updateDuck(duck.id, updatedDuck)}>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                               <Edit className="mr-2 h-4 w-4 text-green-500" />
                               <span className="text-green-500">Edit</span>
                             </DropdownMenuItem>
                           </DuckForm>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-yellow-500 focus:text-yellow-600">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    <span>Reset</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin ingin mereset kandang {duck.cage}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Aksi ini akan mengatur ulang jumlah bebek dan kematian menjadi 0, dan data lain menjadi '-'. Aksi ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                      resetDuck(duck.id);
                                      toast({ title: `Kandang ${duck.cage} direset!` });
                                    }} className="bg-yellow-500 hover:bg-yellow-600">Reset</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                   <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Hapus</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin ingin menghapus kandang {duck.cage}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Aksi ini akan menghapus semua data untuk kandang ini secara permanen.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                      removeDuck(duck.id);
                                      toast({ variant: 'destructive', title: `Kandang ${duck.cage} dihapus!` });
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
