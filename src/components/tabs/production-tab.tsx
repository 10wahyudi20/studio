
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Egg, TrendingUp, Percent, CalendarDays, PlusCircle, Calendar as CalendarIcon, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DailyProduction, Duck, WeeklyProduction } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";


const getWeekOfMonth = (date: Date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = startOfMonth.getDay();
  const diff = date.getDate() + day - 1;
  return Math.ceil(diff / 7);
};

// Daily Data Form
const dailySchemaGenerator = (ducks: Duck[]) => {
  const cageSchema = ducks.reduce((acc, duck) => {
    return { ...acc, [duck.cage]: z.coerce.number().min(0, "Jumlah tidak boleh negatif") };
  }, {});

  return z.object({
    date: z.date({ required_error: "Tanggal harus diisi." }),
    perCage: z.object(cageSchema),
  });
};

type DailyFormData = z.infer<ReturnType<typeof dailySchemaGenerator>>;

const DailyDataForm = ({ production, onSave, children }: { production?: DailyProduction, onSave: (date: Date, data: DailyFormData) => void, children: React.ReactNode }) => {
    const { ducks } = useAppStore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);

    const dailySchema = dailySchemaGenerator(ducks);

    const defaultValues = production ? {
        date: new Date(production.date),
        perCage: ducks.reduce((acc, duck) => ({ ...acc, [duck.cage]: production.perCage[duck.cage] || 0 }), {}),
    } : {
        date: new Date(),
        perCage: ducks.reduce((acc, duck) => ({ ...acc, [duck.cage]: 0 }), {}),
    };

    const { control, handleSubmit, register, formState: { errors } } = useForm<DailyFormData>({
        resolver: zodResolver(dailySchema),
        defaultValues,
        // Re-initialize form when `production` prop changes for editing
        // enableReinitialize: true,
    });

    const onSubmit = (data: DailyFormData) => {
        onSave(production ? new Date(production.date) : data.date, data);
        setOpen(false);
        toast({ title: `Data Harian ${production ? 'Diperbarui' : 'Disimpan'}`, description: `Data untuk tanggal ${format(data.date, "dd MMM yyyy")} telah ${production ? 'diperbarui' : 'disimpan'}.` });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader><DialogTitle>{production ? 'Edit' : 'Input'} Data Produksi Harian</DialogTitle></DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <Controller
                            control={control}
                            name="date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={!!production}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            <Label>Jumlah Telur per Kdg</Label>
                            {ducks.map(duck => (
                                <div key={duck.cage} className="flex items-center justify-between">
                                    <Label htmlFor={`perCage.${duck.cage}`} className="font-normal">Kdg {duck.cage}</Label>
                                    <Input
                                        id={`perCage.${duck.cage}`}
                                        type="number"
                                        className="w-24"
                                        {...register(`perCage.${duck.cage}`)}
                                    />
                                </div>
                            ))}
                        </div>
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


// Weekly Data Form
const weeklySchema = z.object({
  week: z.coerce.number().min(1).max(5),
  buyer: z.string().nonempty("Nama pembeli harus diisi"),
  gradeA: z.coerce.number().min(0),
  gradeB: z.coerce.number().min(0),
  gradeC: z.coerce.number().min(0),
  consumption: z.coerce.number().min(0),
  priceA: z.coerce.number().min(0),
  priceB: z.coerce.number().min(0),
  priceC: z.coerce.number().min(0),
  priceConsumption: z.coerce.number().min(0),
});
type WeeklyFormData = z.infer<typeof weeklySchema>;

const WeeklyDataForm = ({ production, onSave, children }: { production?: WeeklyProduction; onSave: (data: any) => void; children: React.ReactNode }) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const { control, register, handleSubmit, formState: { errors } } = useForm<WeeklyFormData>({
    resolver: zodResolver(weeklySchema),
    defaultValues: production || {
      week: getWeekOfMonth(new Date()),
      buyer: "",
      gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0,
      priceA: 0, priceB: 0, priceC: 0, priceConsumption: 0,
    }
  });

  const onSubmit = (data: WeeklyFormData) => {
    onSave(data);
    setOpen(false);
    toast({ title: `Data Mingguan ${production ? 'Diperbarui' : 'Disimpan'}`, description: `Data untuk minggu ke-${data.week} telah disimpan.` });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
            <DialogTitle>{production ? 'Edit' : 'Input'} Data Produksi Mingguan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="week">Pilih Minggu</Label>
                    <Controller
                    name="week"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih minggu" />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5].map(w => <SelectItem key={w} value={String(w)}>Minggu {w}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    )}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="buyer">Nama Pembeli</Label>
                    <Input id="buyer" {...register("buyer")} />
                    {errors.buyer && <p className="text-sm text-destructive mt-1">{errors.buyer.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Jumlah Telur</Label>
                        <div>
                          <Label htmlFor="gradeA" className="text-xs text-muted-foreground">Grade A</Label>
                          <Input id="gradeA" type="number" {...register("gradeA")} />
                        </div>
                        <div>
                          <Label htmlFor="gradeB" className="text-xs text-muted-foreground">Grade B</Label>
                          <Input id="gradeB" type="number" {...register("gradeB")} />
                        </div>
                        <div>
                          <Label htmlFor="gradeC" className="text-xs text-muted-foreground">Grade C</Label>
                          <Input id="gradeC" type="number" {...register("gradeC")} />
                        </div>
                        <div>
                          <Label htmlFor="consumption" className="text-xs text-muted-foreground">Konsumsi</Label>
                          <Input id="consumption" type="number" {...register("consumption")} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Harga Satuan</Label>
                         <div>
                          <Label htmlFor="priceA" className="text-xs text-muted-foreground">Harga Grade A</Label>
                          <Input id="priceA" type="number" {...register("priceA")} />
                        </div>
                        <div>
                          <Label htmlFor="priceB" className="text-xs text-muted-foreground">Harga Grade B</Label>
                          <Input id="priceB" type="number" {...register("priceB")} />
                        </div>
                        <div>
                          <Label htmlFor="priceC" className="text-xs text-muted-foreground">Harga Grade C</Label>
                          <Input id="priceC" type="number" {...register("priceC")} />
                        </div>
                        <div>
                          <Label htmlFor="priceConsumption" className="text-xs text-muted-foreground">Harga Konsumsi</Label>
                          <Input id="priceConsumption" type="number" {...register("priceConsumption")} />
                        </div>
                    </div>
                </div>
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

export default function ProductionTab() {
  const { ducks, eggProduction, addDailyProduction, updateDailyProduction, addWeeklyProduction, updateWeeklyProduction, removeWeeklyProduction } = useAppStore();
  const { toast } = useToast();

  const totalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
  const todayProduction = eggProduction.daily.at(-1)?.totalEggs || 0;
  const bestProduction = Math.max(...eggProduction.daily.map(d => d.totalEggs), 0);
  const productivity = totalDucks > 0 && todayProduction > 0 ? (todayProduction / totalDucks * 100).toFixed(2) : 0;
  const monthProduction = eggProduction.daily
    .filter(d => {
        const dDate = new Date(d.date);
        const now = new Date();
        return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + d.totalEggs, 0);
  
  const getProductivityColor = (p: number) => {
    if (p > 100) return 'bg-blue-400 text-black';
    if (p >= 90) return 'bg-blue-800 text-white';
    if (p >= 80) return 'bg-green-500 text-black';
    if (p >= 70) return 'bg-green-800 text-white';
    if (p >= 60) return 'bg-yellow-400 text-black';
    if (p >= 50) return 'bg-yellow-600 text-black';
    if (p >= 40) return 'bg-red-500 text-black';
    if (p >= 30) return 'bg-red-800 text-white';
    if (p >= 20) return 'bg-gray-800 text-white';
    if (p > 0) return 'bg-black text-white';
    return '';
  };

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
  
  const handleDailySave = (date: Date, data: DailyFormData) => {
    // Check if a record for this date already exists
    const existingRecord = eggProduction.daily.find(d => new Date(d.date).toDateString() === date.toDateString());
    if (existingRecord) {
        updateDailyProduction(date, data);
    } else {
        addDailyProduction(data);
    }
  };

  const weeklyDataByWeek = eggProduction.weekly.reduce((acc, current) => {
    const week = current.week;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(current);
    return acc;
  }, {} as Record<number, WeeklyProduction[]>);

  const grandTotal = eggProduction.weekly.reduce(
    (acc, week) => {
      acc.gradeA += week.gradeA;
      acc.gradeB += week.gradeB;
      acc.gradeC += week.gradeC;
      acc.consumption += week.consumption;
      acc.totalEggs += week.totalEggs;
      acc.totalValue += week.totalValue;
      return acc;
    },
    { gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0, totalEggs: 0, totalValue: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Produksi Hari Ini" value={todayProduction} icon={Egg} />
        <StatCard title="Produksi Terbaik" value={bestProduction} icon={TrendingUp} />
        <StatCard title="Produktifitas" value={`${productivity}%`} icon={Percent} />
        <StatCard title="Telur Satu Bulan" value={monthProduction} icon={CalendarDays} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabel Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <div className="flex justify-between items-center mb-4">
                <TabsList>
                    <TabsTrigger value="daily">Harian</TabsTrigger>
                    <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                    <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                </TabsList>
                 <TabsContent value="daily" className="m-0">
                    <DailyDataForm onSave={handleDailySave}>
                         <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Input Data Harian
                        </Button>
                    </DailyDataForm>
                 </TabsContent>
                 <TabsContent value="weekly" className="m-0">
                    <WeeklyDataForm onSave={addWeeklyProduction}>
                        <Button><PlusCircle className="mr-2 h-4 w-4" />Input Data Mingguan</Button>
                    </WeeklyDataForm>
                 </TabsContent>
            </div>
            
            <TabsContent value="daily">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="align-middle">Tanggal</TableHead>
                      <TableHead className="align-middle">Hari</TableHead>
                      <TableHead className="text-center align-middle">Jumlah Telur</TableHead>
                      <TableHead className="text-center align-middle">Produktifitas</TableHead>
                      {ducks.map(duck => (
                        <TableHead key={duck.cage} className="text-center">
                          <div className="flex flex-col items-center justify-center h-full">
                            <div>Kdg {duck.cage}</div>
                            <div className="font-normal text-xs text-muted-foreground">{duck.quantity} ekor</div>
                          </div>
                        </TableHead>
                      ))}
                       <TableHead className="text-center align-middle">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...eggProduction.daily]
                      .filter(day => {
                        const dayDate = new Date(day.date);
                        const now = new Date();
                        return dayDate.getMonth() === now.getMonth() && dayDate.getFullYear() === now.getFullYear();
                      })
                      .reverse()
                      .map((day, index) => (
                      <TableRow key={index} onDoubleClick={() => {
                          const formTrigger = document.getElementById(`edit-daily-trigger-${day.date.toISOString()}`);
                          formTrigger?.click();
                      }}>
                        <TableCell className="align-middle text-center">{format(new Date(day.date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="align-middle text-center">{format(new Date(day.date), "eeee", { locale: id })}</TableCell>
                        <TableCell className="align-middle text-center">{day.totalEggs}</TableCell>
                        <TableCell className="align-middle text-center">{day.productivity.toFixed(2)}%</TableCell>
                        {ducks.map(duck => {
                            const production = day.perCage[duck.cage];
                            const productivity = duck.quantity > 0 && production != null
                                ? (production / duck.quantity * 100)
                                : 0;
                            return (
                                <TableCell key={duck.cage} className="p-0 text-center align-middle">
                                    <div className="py-4">{production ?? '-'}</div>
                                    <div className={cn("text-xs py-0.5 w-full", getProductivityColor(productivity))}>
                                      {productivity.toFixed(1)}%
                                    </div>
                                </TableCell>
                            );
                        })}
                        <TableCell className="align-middle text-center">
                            <DailyDataForm production={day} onSave={handleDailySave}>
                                 <Button variant="ghost" size="icon" id={`edit-daily-trigger-${day.date.toISOString()}`}>
                                    <Edit className="h-4 w-4" />
                                 </Button>
                            </DailyDataForm>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="weekly">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2} className="align-bottom">Minggu</TableHead>
                      <TableHead rowSpan={2} className="align-bottom">Pembeli</TableHead>
                      <TableHead colSpan={2} className="text-center border-l">Grade A</TableHead>
                      <TableHead colSpan={2} className="text-center border-l">Grade B</TableHead>
                      <TableHead colSpan={2} className="text-center border-l">Grade C</TableHead>
                      <TableHead colSpan={2} className="text-center border-l">Konsumsi</TableHead>
                      <TableHead rowSpan={2} className="align-bottom border-l">Total Telur</TableHead>
                      <TableHead rowSpan={2} className="align-bottom border-l">Total Harga</TableHead>
                      <TableHead rowSpan={2} className="align-bottom border-l">Aksi</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-center border-l">Jumlah</TableHead>
                      <TableHead className="text-center">Harga</TableHead>
                      <TableHead className="text-center border-l">Jumlah</TableHead>
                      <TableHead className="text-center">Harga</TableHead>
                      <TableHead className="text-center border-l">Jumlah</TableHead>
                      <TableHead className="text-center">Harga</TableHead>
                      <TableHead className="text-center border-l">Jumlah</TableHead>
                      <TableHead className="text-center">Harga</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(weeklyDataByWeek).sort((a,b) => Number(a) - Number(b)).map(weekNumber => {
                      const weekEntries = weeklyDataByWeek[Number(weekNumber)];
                      const subtotal = weekEntries.reduce(
                        (acc, week) => {
                          acc.gradeA += week.gradeA;
                          acc.gradeB += week.gradeB;
                          acc.gradeC += week.gradeC;
                          acc.consumption += week.consumption;
                          acc.totalEggs += week.totalEggs;
                          acc.totalValue += week.totalValue;
                          return acc;
                        },
                        { gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0, totalEggs: 0, totalValue: 0 }
                      );

                      return (
                        <React.Fragment key={weekNumber}>
                          {weekEntries.map((week) => (
                              <TableRow key={week.id}>
                                  <TableCell>{week.week}</TableCell>
                                  <TableCell>{week.buyer}</TableCell>
                                  <TableCell className="border-l">{week.gradeA.toLocaleString('id-ID')}</TableCell>
                                  <TableCell>Rp {week.priceA.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="border-l">{week.gradeB.toLocaleString('id-ID')}</TableCell>
                                  <TableCell>Rp {week.priceB.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="border-l">{week.gradeC.toLocaleString('id-ID')}</TableCell>
                                  <TableCell>Rp {week.priceC.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="border-l">{week.consumption.toLocaleString('id-ID')}</TableCell>
                                  <TableCell>Rp {week.priceConsumption.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="border-l">{week.totalEggs.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="border-l">Rp {week.totalValue.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="border-l">
                                    <div className="flex gap-1">
                                        <WeeklyDataForm
                                            production={week}
                                            onSave={(updatedData) => updateWeeklyProduction(week.id, updatedData)}
                                        >
                                            <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600 h-8 w-8">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </WeeklyDataForm>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus data penjualan ini?</AlertDialogTitle>
                                                    <AlertDialogDescription>Aksi ini akan menghapus data penjualan dari pembeli "{week.buyer}" untuk minggu ke-{week.week} secara permanen.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => {
                                                        removeWeeklyProduction(week.id);
                                                        toast({ variant: 'destructive', title: `Data penjualan dihapus!` });
                                                    }} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                  </TableCell>
                              </TableRow>
                          ))}
                          <TableRow className="bg-secondary/50 font-bold">
                            <TableCell colSpan={2}>Subtotal Minggu {weekNumber}</TableCell>
                            <TableCell className="border-l">{subtotal.gradeA.toLocaleString('id-ID')}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="border-l">{subtotal.gradeB.toLocaleString('id-ID')}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="border-l">{subtotal.gradeC.toLocaleString('id-ID')}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="border-l">{subtotal.consumption.toLocaleString('id-ID')}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="border-l">{subtotal.totalEggs.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="border-l">Rp {subtotal.totalValue.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="border-l"></TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                    <TableRow className="bg-primary/20 font-extrabold text-lg">
                      <TableCell colSpan={2}>Grand Total</TableCell>
                      <TableCell className="border-l">{grandTotal.gradeA.toLocaleString('id-ID')}</TableCell>
                       <TableCell></TableCell>
                      <TableCell className="border-l">{grandTotal.gradeB.toLocaleString('id-ID')}</TableCell>
                       <TableCell></TableCell>
                      <TableCell className="border-l">{grandTotal.gradeC.toLocaleString('id-ID')}</TableCell>
                       <TableCell></TableCell>
                      <TableCell className="border-l">{grandTotal.consumption.toLocaleString('id-ID')}</TableCell>
                       <TableCell></TableCell>
                      <TableCell className="border-l">{grandTotal.totalEggs.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="border-l">Rp {grandTotal.totalValue.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="border-l"></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
             <TabsContent value="monthly">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bulan</TableHead>
                                <TableHead>Grade A</TableHead>
                                <TableHead>Grade B</TableHead>
                                <TableHead>Grade C</TableHead>
                                <TableHead>Konsumsi</TableHead>
                                <TableHead>Total Telur</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {eggProduction.monthly.map((month, index) => (
                                <TableRow key={index}>
                                    <TableCell>{month.month}</TableCell>
                                    <TableCell>{month.gradeA.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>{month.gradeB.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>{month.gradeC.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>{month.consumption.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>{month.totalEggs.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

    