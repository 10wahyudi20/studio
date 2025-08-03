
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Egg, TrendingUp, Percent, CalendarDays, PlusCircle } from "lucide-react";
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

const getWeekOfMonth = (date: Date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = startOfMonth.getDay();
  const diff = date.getDate() + day - 1;
  return Math.ceil(diff / 7);
};

const weeklySchema = z.object({
  week: z.coerce.number().min(1).max(5),
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
  const { addWeeklyProduction, eggProduction } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const { control, register, handleSubmit, formState: { errors } } = useForm<WeeklyFormData>({
    resolver: zodResolver(weeklySchema),
    defaultValues: {
      week: getWeekOfMonth(new Date()),
      gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0,
      priceA: 0, priceB: 0, priceC: 0, priceConsumption: 0,
    }
  });

  const onSubmit = (data: WeeklyFormData) => {
    const totalEggs = data.gradeA + data.gradeB + data.gradeC + data.consumption;
    const totalValue = (data.gradeA * data.priceA) + (data.gradeB * data.priceB) + (data.gradeC * data.priceC) + (data.consumption * data.priceConsumption);
    
    // For now, productivity is mocked. In a real app, you'd calculate this based on ducks and daily records for the week.
    const productivity = totalEggs > 0 ? 75 : 0; 

    addWeeklyProduction({ ...data, totalEggs, totalValue, productivity });
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
        <DialogHeader>
          <DialogTitle>Input Data Produksi Mingguan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Jumlah Telur</Label>
                <Input type="number" placeholder="Grade A" {...register("gradeA")} />
                <Input type="number" placeholder="Grade B" {...register("gradeB")} />
                <Input type="number" placeholder="Grade C" {...register("gradeC")} />
                <Input type="number" placeholder="Konsumsi" {...register("consumption")} />
            </div>
            <div className="space-y-2">
                <Label>Harga Satuan</Label>
                <Input type="number" placeholder="Harga A" {...register("priceA")} />
                <Input type="number" placeholder="Harga B" {...register("priceB")} />
                <Input type="number" placeholder="Harga C" {...register("priceC")} />
                <Input type="number" placeholder="Harga Konsumsi" {...register("priceConsumption")} />
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
  const productivity = totalDucks > 0 ? (todayProduction / totalDucks * 100).toFixed(2) : 0;
  const monthProduction = eggProduction.daily
    .filter(d => new Date(d.date).getMonth() === new Date().getMonth())
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
                      {ducks.map(duck => <TableHead key={duck.cage}>Kandang {duck.cage}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eggProduction.daily.map((day, index) => (
                      <TableRow key={index}>
                        <TableCell>{format(new Date(day.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>{format(new Date(day.date), "eeee", { locale: id })}</TableCell>
                        <TableCell>{day.totalEggs}</TableCell>
                        <TableCell>{day.productivity.toFixed(2)}%</TableCell>
                        {ducks.map(duck => <TableCell key={duck.cage}>{day.perCage[duck.cage] || '-'}</TableCell>)}
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
                                <TableHead rowSpan={2}>Produktifitas</TableHead>
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
                                    <TableCell>{week.productivity.toFixed(2)}%</TableCell>
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
