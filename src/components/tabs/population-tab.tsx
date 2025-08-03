
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, RefreshCw, Layers, Users, TrendingDown, ArrowRightLeft, ShieldOff } from "lucide-react";
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
import { Duck } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const duckSchema = z.object({
  cage: z.number().min(1),
  quantity: z.coerce.number().min(0),
  deaths: z.coerce.number().min(0),
  entryDate: z.date(),
  cageSizeLength: z.coerce.number().min(0),
  cageSizeWidth: z.coerce.number().min(0),
  cageSystem: z.enum(["baterai", "umbaran"]),
});

type DuckFormData = z.infer<typeof duckSchema>;

const calculateAge = (entryDate: Date): number => {
    return Math.floor((new Date().getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
};

const calculateDuckStatus = (ageMonths: number): Duck['status'] => {
  if (ageMonths <= 5) return 'Bebek Bayah';
  if (ageMonths <= 12) return 'Bebek Petelur';
  if (ageMonths <= 18) return 'Bebek Tua';
  return 'Bebek Afkir';
};

const DuckFormContent = ({ duck, onSave, setOpen }: { duck?: Duck; onSave: (data: Duck) => void, setOpen: (open: boolean) => void }) => {
  const { ducks } = useAppStore();
  const { toast } = useToast();
  
  const defaultValues = duck
    ? {
        ...duck,
        entryDate: new Date(duck.entryDate),
        cageSizeLength: duck.cageSize.split("x")[0] ? Number(duck.cageSize.split("x")[0]) : 0,
        cageSizeWidth: duck.cageSize.split("x")[1] ? Number(duck.cageSize.split("x")[1]) : 0,
      }
    : {
        cage: ducks.length > 0 ? Math.max(...ducks.map(d => d.cage)) + 1 : 1,
        quantity: 0,
        deaths: 0,
        entryDate: new Date(),
        cageSizeLength: 0,
        cageSizeWidth: 0,
        cageSystem: "umbaran" as "baterai" | "umbaran",
    };
    
  const { register, handleSubmit, control, formState: { errors } } = useForm<DuckFormData>({
    resolver: zodResolver(duckSchema),
    defaultValues
  });

  const onSubmit = (data: DuckFormData) => {
    const ageMonths = calculateAge(data.entryDate);
    const status = calculateDuckStatus(ageMonths);
    const newDuckData: Duck = {
      ...data,
      ageMonths,
      status,
      cageSize: `${data.cageSizeLength}x${data.cageSizeWidth}m`,
    };

    onSave(newDuckData);
    setOpen(false);
    toast({
      title: `Kandang ${duck ? 'diperbarui' : 'ditambahkan'}!`,
      description: `Data untuk kandang ${newDuckData.cage} telah disimpan.`,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cage" className="text-right">Kandang</Label>
            <Input id="cage" {...register("cage", { valueAsNumber: true })} className="col-span-3" readOnly />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Jumlah Bebek</Label>
            <Input id="quantity" type="number" {...register("quantity")} className="col-span-3" />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deaths" className="text-right">Kematian</Label>
            <Input id="deaths" type="number" {...register("deaths")} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tanggal Masuk</Label>
             <Controller
                control={control}
                name="entryDate"
                render={({ field }) => (
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal col-span-3",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pilih tanggal</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                )}
             />
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
  );
};


const DuckForm = ({ duck, onSave, children }: { duck?: Duck; onSave: (data: Duck) => void, children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{duck ? 'Edit' : 'Tambah'} Inventaris Bebek</DialogTitle>
        </DialogHeader>
        <DuckFormContent duck={duck} onSave={onSave} setOpen={setOpen} />
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
  
  const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Total Bebek" value={totalDucks} icon={Users}/>
          <StatCard title="Kematian" value={totalDeaths} icon={TrendingDown}/>
          <StatCard title="Bebek Bayah" value={bayahCount} icon={Layers}/>
          <StatCard title="Bebek Petelur" value={petelurCount} icon={ArrowRightLeft}/>
          <StatCard title="Bebek Tua" value={tuaCount} icon={Users}/>
          <StatCard title="Bebek Afkir" value={afkirCount} icon={ShieldOff}/>
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
                  <TableHead>Kandang</TableHead>
                  <TableHead>Jumlah Bebek</TableHead>
                  <TableHead>Kematian</TableHead>
                  <TableHead>Tanggal Masuk</TableHead>
                  <TableHead>Usia (Bulan)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ukuran Kandang</TableHead>
                  <TableHead>Sistem Kandang</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ducks.map((duck) => (
                  <TableRow key={duck.cage}>
                    <TableCell>{duck.cage}</TableCell>
                    <TableCell>{duck.quantity}</TableCell>
                    <TableCell>{duck.deaths}</TableCell>
                    <TableCell>{format(new Date(duck.entryDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>{duck.ageMonths}</TableCell>
                    <TableCell>{duck.status}</TableCell>
                    <TableCell>{duck.cageSize}</TableCell>
                    <TableCell>{duck.cageSystem}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DuckForm duck={duck} onSave={(updatedDuck) => updateDuck(duck.cage, updatedDuck)}>
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
                                      resetDuck(duck.cage);
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
                                      removeDuck(duck.cage);
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
