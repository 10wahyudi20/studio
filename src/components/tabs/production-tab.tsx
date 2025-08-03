
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Egg, TrendingUp, Percent, CalendarDays, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
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

const DailyDataForm = () => {
    const { addDailyProduction, ducks } = useAppStore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);

    const dailySchema = dailySchemaGenerator(ducks);

    const defaultValues = {
        date: new Date(),
        perCage: ducks.reduce((acc, duck) => ({ ...acc, [duck.cage]: 0 }), {}),
    };

    const { control, handleSubmit, register, formState: { errors } } = useForm<DailyFormData>({
        resolver: zodResolver(dailySchema),
        defaultValues,
    });

    const onSubmit = (data: DailyFormData) => {
        addDailyProduction(data);
        setOpen(false);
        toast({ title: "Data Harian Disimpan", description: `Data untuk tanggal ${format(data.date, "dd MMM yyyy")} telah ditambahkan.` });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Input Data Harian
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader><DialogTitle>Input Data Produksi Harian</DialogTitle></DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <Controller
                            control={control}
                            name="date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
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
                            <Label>Jumlah Telur per Kandang</Label>
                            {ducks.map(duck => (
                                <div key={duck.cage} className="flex items-center justify-between">
                                    <Label htmlFor={`perCage.${duck.cage}`} className="font-normal">Kandang {duck.cage}</Label>
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

const WeeklyDataForm = () => {
  const { addWeeklyProduction } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const { control, register, handleSubmit } = useForm<WeeklyFormData>({
    resolver: zodResolver(weeklySchema),
    defaultValues: {
      week: getWeekOfMonth(new Date()),
      buyer: "",
      gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0,
      priceA: 0, priceB: 0, priceC: 0, priceConsumption: 0,
    }
  });

  const onSubmit = (data: WeeklyFormData) => {
    addWeeklyProduction(data);
    setOpen(false);
    toast({ title: "Data Mingguan Disimpan", description: `Data untuk minggu ke-${data.week} telah ditambahkan.` });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Input Data Mingguan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
            <DialogTitle>Input Data Produksi Mingguan</DialogTitle>
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
  const { ducks, eggProduction } = useAppStore();

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
                 <TabsContent value="daily" className="m-0"><DailyDataForm /></TabsContent>
                 <TabsContent value="weekly" className="m-0"><WeeklyDataForm /></TabsContent>
            </div>
            
            <TabsContent value="daily">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Hari</TableHead>
                      <TableHead>Jumlah Telur</TableHead>
                      <TableHead>Produktifitas</TableHead>
                      {ducks.map(duck => (
                        <TableHead key={duck.cage}>
                          Kandang {duck.cage}
                          <div className="font-normal text-xs">({duck.quantity} ekor)</div>
                        </TableHead>
                      ))}
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
                      <TableRow key={index}>
                        <TableCell>{format(new Date(day.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{format(new Date(day.date), "eeee", { locale: id })}</TableCell>
                        <TableCell>{day.totalEggs}</TableCell>
                        <TableCell>{day.productivity.toFixed(2)}%</TableCell>
                        {ducks.map(duck => <TableCell key={duck.cage}>{day.perCage[duck.cage] ?? '-'}</TableCell>)}
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
                                <TableHead rowSpan={2}>Minggu</TableHead>
                                <TableHead rowSpan={2}>Pembeli</TableHead>
                                <TableHead colSpan={4} className="text-center">Jumlah Telur</TableHead>
                                <TableHead colSpan={4} className="text-center">Harga</TableHead>
                                <TableHead rowSpan={2}>Total Harga</TableHead>
                            </TableRow>
                             <TableRow>
                                <TableHead>Grade A</TableHead>
                                <TableHead>Grade B</TableHead>
                                <TableHead>Grade C</TableHead>
                                <TableHead>Konsumsi</TableHead>
                                <TableHead>Harga A</TableHead>
                                <TableHead>Harga B</TableHead>
                                <TableHead>Harga C</TableHead>
                                <TableHead>Harga Konsumsi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eggProduction.weekly.map((week, index) => (
                                <TableRow key={index}>
                                    <TableCell>{week.week}</TableCell>
                                    <TableCell>{week.buyer}</TableCell>
                                    <TableCell>{week.gradeA}</TableCell>
                                    <TableCell>{week.gradeB}</TableCell>
                                    <TableCell>{week.gradeC}</TableCell>
                                    <TableCell>{week.consumption}</TableCell>
                                    <TableCell>Rp {week.priceA.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>Rp {week.priceB.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>Rp {week.priceC.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>Rp {week.priceConsumption.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>Rp {week.totalValue.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                            ))}
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
                                    <TableCell>{month.gradeA}</TableCell>
                                    <TableCell>{month.gradeB}</TableCell>
                                    <TableCell>{month.gradeC}</TableCell>
                                    <TableCell>{month.consumption}</TableCell>
                                    <TableCell>{month.totalEggs}</TableCell>
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
