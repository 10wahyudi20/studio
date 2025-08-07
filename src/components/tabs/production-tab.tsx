
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Egg, TrendingUp, Percent, CalendarDays, PlusCircle, Calendar as CalendarIcon, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { format, addDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { DailyProduction, Duck, WeeklyProduction } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { DateRange } from "react-day-picker";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";

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
                                            {field.value ? format(field.value, "PPP", { locale: idLocale }) : <span>Pilih tanggal</span>}
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
  dateRange: z.object({
      from: z.date({ required_error: "Tanggal mulai harus diisi." }),
      to: z.date({ required_error: "Tanggal akhir harus diisi." }),
  }),
  buyer: z.string().nonempty("Nama pembeli harus diisi"),
  description: z.string().nonempty("Keterangan harus diisi"),
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

  const defaultValues = production ? {
      dateRange: { from: new Date(production.startDate), to: new Date(production.endDate) },
      buyer: production.buyer,
      description: production.description || "",
      gradeA: production.gradeA,
      gradeB: production.gradeB,
      gradeC: production.gradeC,
      consumption: production.consumption,
      priceA: production.priceA,
      priceB: production.priceB,
      priceC: production.priceC,
      priceConsumption: production.priceConsumption,
  } : {
      dateRange: { from: new Date(), to: addDays(new Date(), 6) },
      buyer: "",
      description: "",
      gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0,
      priceA: 0, priceB: 0, priceC: 0, priceConsumption: 0,
  };

  const { control, register, handleSubmit, formState: { errors } } = useForm<WeeklyFormData>({
    resolver: zodResolver(weeklySchema),
    defaultValues
  });

  const onSubmit = (data: WeeklyFormData) => {
    const saveData = {
        startDate: data.dateRange.from,
        endDate: data.dateRange.to,
        buyer: data.buyer,
        description: data.description,
        gradeA: data.gradeA,
        gradeB: data.gradeB,
        gradeC: data.gradeC,
        consumption: data.consumption,
        priceA: data.priceA,
        priceB: data.priceB,
        priceC: data.priceC,
        priceConsumption: data.priceConsumption,
    }
    onSave(saveData);
    setOpen(false);
    toast({ title: `Data Mingguan ${production ? 'Diperbarui' : 'Disimpan'}`, description: `Data untuk pembeli ${data.buyer} telah disimpan.` });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
            <DialogTitle>{production ? 'Edit' : 'Input'} Data Produksi Mingguan</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] p-4">
              <div className="space-y-4">
                  <div className="space-y-2">
                      <Label>Periode Penjualan</Label>
                      <Controller
                          name="dateRange"
                          control={control}
                          render={({ field }) => (
                              <Popover>
                                  <PopoverTrigger asChild>
                                  <Button
                                      id="date"
                                      variant={"outline"}
                                      className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value?.from && "text-muted-foreground"
                                      )}
                                  >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value?.from ? (
                                      field.value.to ? (
                                          <>
                                          {format(field.value.from, "LLL dd, y")} -{" "}
                                          {format(field.value.to, "LLL dd, y")}
                                          </>
                                      ) : (
                                          format(field.value.from, "LLL dd, y")
                                      )
                                      ) : (
                                      <span>Pilih rentang tanggal</span>
                                      )}
                                  </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                      initialFocus
                                      mode="range"
                                      defaultMonth={field.value?.from}
                                      selected={field.value as DateRange}
                                      onSelect={field.onChange}
                                      numberOfMonths={2}
                                  />
                                  </PopoverContent>
                              </Popover>
                          )}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description">Keterangan</Label>
                      <Textarea id="description" {...register("description")} />
                      {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
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
            </ScrollArea>
            <DialogFooter className="pt-4">
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
  const [currentDate, setCurrentDate] = React.useState(new Date());


  const totalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
  
  const productionTodayRecord = eggProduction.daily.at(-1);
  const productionYesterdayRecord = eggProduction.daily.at(-2);
  const todayProduction = productionTodayRecord?.totalEggs || 0;
  const yesterdayProduction = productionYesterdayRecord?.totalEggs || 0;
  const productionDifference = todayProduction - yesterdayProduction;

  const bestProduction = Math.max(...eggProduction.daily.map(d => d.totalEggs), 0);
  const productivity = totalDucks > 0 && todayProduction > 0 ? (todayProduction / totalDucks * 100).toFixed(2) : 0;
  
  const monthProduction = eggProduction.daily
    .filter(d => {
        const dDate = new Date(d.date);
        return dDate.getMonth() === currentDate.getMonth() && dDate.getFullYear() === currentDate.getFullYear();
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
  
  const StatCard = ({ title, value, valueClassName, icon: Icon, footer }: { title: string, value: string | number, valueClassName?: string, icon: React.ElementType, footer?: React.ReactNode }) => (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
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
  
  const handleDailySave = (date: Date, data: DailyFormData) => {
    const existingRecord = eggProduction.daily.find(d => new Date(d.date).toDateString() === date.toDateString());
    if (existingRecord) {
        updateDailyProduction(date, data);
    } else {
        addDailyProduction(data);
    }
  };

  const weeklyDataForMonth = eggProduction.weekly
    .filter(w => {
        if (!w || !w.startDate || !w.endDate) return false;
        const startDate = new Date(w.startDate);
        const endDate = new Date(w.endDate);
        const selectedMonth = currentDate.getMonth();
        const selectedYear = currentDate.getFullYear();
        // Return true if the week's period overlaps with the selected month
        return (startDate.getMonth() === selectedMonth && startDate.getFullYear() === selectedYear) ||
               (endDate.getMonth() === selectedMonth && endDate.getFullYear() === selectedYear) ||
               (startDate.getFullYear() === selectedYear && endDate.getFullYear() === selectedYear && startDate.getMonth() < selectedMonth && endDate.getMonth() > selectedMonth) ||
               (startDate.getFullYear() < selectedYear && endDate.getFullYear() > selectedYear) ||
               (startDate.getFullYear() === selectedYear && endDate.getFullYear() > selectedYear) ||
               (startDate.getFullYear() < selectedYear && endDate.getFullYear() === selectedYear);
    })
    .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const weeklyDataByPeriod = weeklyDataForMonth.reduce((acc, current) => {
    const period = `${format(new Date(current.startDate), 'dd MMM yyyy')} - ${format(new Date(current.endDate), 'dd MMM yyyy')}`;
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(current);
    return acc;
  }, {} as Record<string, WeeklyProduction[]>);

  const weeklyGrandTotal = weeklyDataForMonth.reduce(
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

  const monthlyGrandTotal = eggProduction.monthly.reduce(
    (acc, month) => {
      acc.gradeA += month.gradeA;
      acc.gradeB += month.gradeB;
      acc.gradeC += month.gradeC;
      acc.consumption += month.consumption;
      acc.totalEggs += month.totalEggs;
      return acc;
    },
    { gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0, totalEggs: 0 }
  );
  
  const GradeCell = ({ amount, price }: { amount: number; price: number }) => (
    <TableCell className="text-center">
        <div>{amount.toLocaleString('id-ID')}</div>
        <div className="text-xs text-muted-foreground">
            Rp {price.toLocaleString('id-ID')}
        </div>
    </TableCell>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Produksi Hari Ini" 
            value={todayProduction} 
            icon={Egg} 
            valueClassName={cn({
                'text-green-600 dark:text-green-500': productionDifference > 0,
                'text-red-600 dark:text-red-500': productionDifference < 0,
            })}
            footer={
                productionYesterdayRecord && (
                    <div className={cn('flex items-center w-full pt-2 text-xs', {
                        'text-green-600 dark:text-green-500': productionDifference > 0,
                        'text-red-600 dark:text-red-500': productionDifference < 0,
                    })}>
                        {productionDifference > 0 && <ArrowUp className="h-4 w-4 mr-1" />}
                        {productionDifference < 0 && <ArrowDown className="h-4 w-4 mr-1" />}
                        {productionDifference !== 0 ? `${Math.abs(productionDifference)} butir` : 'Tidak ada perubahan'}{" "}
                        dari kemarin
                    </div>
                )
            }
        />
        <StatCard title="Produksi Terbaik" value={bestProduction} icon={TrendingUp} />
        <StatCard title="Produktifitas" value={`${productivity}%`} icon={Percent} />
        <StatCard title={`Telur Bulan ${format(currentDate, "MMMM", { locale: idLocale })}`} value={monthProduction} icon={CalendarDays} />
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
                 <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon">
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={currentDate}
                                onSelect={(date) => date && setCurrentDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

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
            </div>
            
            <TabsContent value="daily">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center align-middle">Tanggal</TableHead>
                      <TableHead className="text-center align-middle">Hari</TableHead>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...eggProduction.daily]
                      .filter(day => {
                        const dayDate = new Date(day.date);
                        return dayDate.getMonth() === currentDate.getMonth() && dayDate.getFullYear() === currentDate.getFullYear();
                      })
                      .reverse()
                      .map((day, index) => (
                      <TableRow key={index} onDoubleClick={() => {
                          const formTrigger = document.getElementById(`edit-daily-trigger-${day.date.toISOString()}`);
                          formTrigger?.click();
                      }}>
                        <TableCell className="align-middle text-center">{format(new Date(day.date), "dd MMM yyyy")}</TableCell>
                        <TableCell className="align-middle text-center">{format(new Date(day.date), "eeee", { locale: idLocale })}</TableCell>
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
                                    <div className={cn("text-xs py-0.5 w-1/2 mx-auto rounded-sm", getProductivityColor(productivity))}>
                                      {productivity.toFixed(1)}%
                                    </div>
                                </TableCell>
                            );
                        })}
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
                      <TableHead className="text-center">Periode</TableHead>
                      <TableHead>Pembeli</TableHead>
                      <TableHead className="text-center">Grade A</TableHead>
                      <TableHead className="text-center">Grade B</TableHead>
                      <TableHead className="text-center">Grade C</TableHead>
                      <TableHead className="text-center">Konsumsi</TableHead>
                      <TableHead>Total Telur</TableHead>
                      <TableHead>Total Harga</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(weeklyDataByPeriod).map(period => {
                      const weekEntries = weeklyDataByPeriod[period];

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
                        <React.Fragment key={period}>
                          {weekEntries.map((week) => (
                              <TableRow key={week.id}>
                                  <TableCell className="text-center">
                                    <div className="font-semibold">{week.description}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(week.startDate), 'dd MMM', { locale: idLocale })} - {format(new Date(week.endDate), 'dd MMM', { locale: idLocale })}
                                    </div>
                                  </TableCell>
                                  <TableCell>{week.buyer}</TableCell>
                                  <GradeCell amount={week.gradeA} price={week.priceA} />
                                  <GradeCell amount={week.gradeB} price={week.priceB} />
                                  <GradeCell amount={week.gradeC} price={week.priceC} />
                                  <GradeCell amount={week.consumption} price={week.priceConsumption} />
                                  <TableCell>{week.totalEggs.toLocaleString('id-ID')}</TableCell>
                                  <TableCell>Rp {week.totalValue.toLocaleString('id-ID')}</TableCell>
                                  <TableCell>
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
                                                    <AlertDialogDescription>Aksi ini akan menghapus data penjualan dari pembeli "{week.buyer}" secara permanen.</AlertDialogDescription>
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
                            <TableCell colSpan={2} className="text-center">Subtotal Periode</TableCell>
                            <TableCell className="text-center">{subtotal.gradeA.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-center">{subtotal.gradeB.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-center">{subtotal.gradeC.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-center">{subtotal.consumption.toLocaleString('id-ID')}</TableCell>
                            <TableCell>{subtotal.totalEggs.toLocaleString('id-ID')}</TableCell>
                            <TableCell>Rp {subtotal.totalValue.toLocaleString('id-ID')}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                   <TableFooter>
                    <TableRow className="bg-primary/20 font-extrabold text-lg">
                      <TableCell colSpan={2}>Grand Total Bulanan</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.gradeA.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.gradeB.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.gradeC.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.consumption.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{weeklyGrandTotal.totalEggs.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {weeklyGrandTotal.totalValue.toLocaleString('id-ID')}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
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
                         <TableFooter>
                            <TableRow className="bg-primary/20 font-extrabold text-lg">
                                <TableCell>Grand Total</TableCell>
                                <TableCell>{monthlyGrandTotal.gradeA.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{monthlyGrandTotal.gradeB.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{monthlyGrandTotal.gradeC.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{monthlyGrandTotal.consumption.toLocaleString('id-ID')}</TableCell>
                                <TableCell>{monthlyGrandTotal.totalEggs.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
