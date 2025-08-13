

"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Egg, Percent, CalendarDays, PlusCircle, Calendar as CalendarIcon, Edit, Trash2, ArrowUp, ArrowDown, MoreHorizontal, BarChart as BarChartIcon, ZoomIn, ZoomOut, Trophy, TrendingUp, TrendingDown, LineChart as LineChartIcon, Printer } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, isToday } from "date-fns";
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
import { ScrollArea } from "../ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, ComposedChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


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

const DailyDataForm = ({ production, onSave, children, onOpenChange, open }: { production?: DailyProduction, onSave: (date: Date, data: DailyFormData) => void, children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void; }) => {
    const { ducks, eggProduction } = useAppStore();
    const { toast } = useToast();
    
    const isEditMode = !!production;

    const dailySchema = dailySchemaGenerator(ducks);
    
    const { control, handleSubmit, register, watch, formState: { errors }, reset, setValue } = useForm<DailyFormData>({
        resolver: zodResolver(dailySchema),
    });

    React.useEffect(() => {
        const setFormValuesForDate = (targetDate: Date) => {
            const record = eggProduction.daily.find(
                (d) => new Date(d.date).toDateString() === targetDate.toDateString()
            );

            const defaultValues = record
                ? {
                    date: new Date(record.date),
                    perCage: ducks.reduce(
                        (acc, duck) => ({ ...acc, [duck.cage]: record.perCage[duck.cage] || 0 }),
                        {}
                    ),
                }
                : {
                    date: targetDate,
                    perCage: ducks.reduce((acc, duck) => ({ ...acc, [duck.cage]: 0 }), {}),
                };
            reset(defaultValues);
        };

        if (open) {
            setFormValuesForDate(production ? new Date(production.date) : new Date());
        }
    }, [open, production, ducks, reset, eggProduction.daily]);

    const handleDateChange = (date: Date | undefined) => {
        if (!date) return;
        const record = eggProduction.daily.find(d => new Date(d.date).toDateString() === date.toDateString());
        
        setValue('date', date);
        ducks.forEach(duck => {
            setValue(`perCage.${duck.cage}`, record?.perCage[duck.cage] || 0);
        });
    };


    const allValues = watch();
    const totalEggs = React.useMemo(() => {
        const perCageValues = allValues.perCage;
        if (!perCageValues || typeof perCageValues !== 'object') return 0;
        return Object.values(perCageValues).reduce((sum, count) => sum + (Number(count) || 0), 0);
    }, [allValues]);


    const onSubmit = (data: DailyFormData) => {
        onSave(data.date, data);
        onOpenChange(false);
        toast({ title: `Data Harian Disimpan`, description: `Data untuk tanggal ${format(data.date, "dd/MM/yyyy")} telah disimpan.` });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader><DialogTitle>{isEditMode ? 'Edit' : 'Input'} Data Produksi Harian</DialogTitle></DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <Controller
                            control={control}
                            name="date"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                            
                                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: idLocale }) : <span>Pilih tanggal</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={handleDateChange} initialFocus /></PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}

                        <ScrollArea className="h-60 pr-2">
                        <div className="space-y-2">
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
                        </ScrollArea>
                    </div>

                    <DialogFooter className="justify-between">
                        <div className="font-bold text-lg">
                           Total: {totalEggs}
                        </div>
                        <div className="flex gap-2">
                            <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
                            <Button type="submit">Simpan</Button>
                        </div>
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
type WeeklyFormData = z.infer<ReturnType<typeof weeklySchema>>;

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
        <DialogHeader>
          <DialogTitle>{production ? 'Edit' : 'Input'} Data Produksi Mingguan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4 -mx-4">
              <div className="space-y-4 px-4">
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
                                      
                                      {field.value?.from ? (
                                      field.value.to ? (
                                          <>
                                          {format(field.value.from, "dd/MM/yyyy")} -{" "}
                                          {format(field.value.to, "dd/MM/yyyy")}
                                          </>
                                      ) : (
                                          format(field.value.from, "dd/MM/yyyy")
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
                      <Input id="description" {...register("description")} />
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
            <DialogFooter className="pt-4 mt-4 border-t">
                <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CHART_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#eab308',
    '#14b8a6', '#6366f1', '#f43f5e', '#d946ef', '#0ea5e9', '#10b981',
    '#f59e0b', '#a855f7', '#ec4899', '#64748b', '#7c3aed', '#db2777',
];


const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, value, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25; // position label outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';


    if (percent === 0) return null;

    return (
        <g>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={props.fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={props.fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" dy={-6} className="text-xs">
                {name}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" dy={6} className="text-xs font-bold">
                {`${value.toLocaleString('id-ID')} (${(percent * 100).toFixed(0)}%)`}
            </text>
        </g>
    );
};


const MonthlyChart = ({ data }: { data: any[] }) => {
    const pieData = [
        { name: "Grade A", value: data.reduce((sum, item) => sum + item.gradeA, 0) },
        { name: "Grade B", value: data.reduce((sum, item) => sum + item.gradeB, 0) },
        { name: "Grade C", value: data.reduce((sum, item) => sum + item.gradeC, 0) },
        { name: "Konsumsi", value: data.reduce((sum, item) => sum + item.consumption, 0) },
    ].filter(item => item.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
                <CardHeader><CardTitle>Total Produksi per Bulan</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={12} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="gradeA" stackId="a" fill={CHART_COLORS[0]} name="Grade A" />
                            <Bar dataKey="gradeB" stackId="a" fill={CHART_COLORS[1]} name="Grade B" />
                            <Bar dataKey="gradeC" stackId="a" fill={CHART_COLORS[2]} name="Grade C" />
                            <Bar dataKey="consumption" stackId="a" fill={CHART_COLORS[3]} name="Konsumsi" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Tren Produksi per Grade</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={12} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="gradeA" stroke={CHART_COLORS[0]} name="Grade A" />
                            <Line type="monotone" dataKey="gradeB" stroke={CHART_COLORS[1]} name="Grade B" />
                            <Line type="monotone" dataKey="gradeC" stroke={CHART_COLORS[2]} name="Grade C" />
                            <Line type="monotone" dataKey="consumption" stroke={CHART_COLORS[3]} name="Konsumsi" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Komposisi Total Produksi</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} label={renderCustomizedLabel}>
                                 {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

const WeeklyChart = ({ data }: { data: any[] }) => {
    const chartData = data.map(week => ({
        ...week,
        period: `${format(new Date(week.startDate), 'dd/MM')} - ${format(new Date(week.endDate), 'dd/MM')}`
    }));

    const pieData = [
        { name: "Grade A", value: data.reduce((sum, item) => sum + item.gradeA, 0) },
        { name: "Grade B", value: data.reduce((sum, item) => sum + item.gradeB, 0) },
        { name: "Grade C", value: data.reduce((sum, item) => sum + item.gradeC, 0) },
        { name: "Konsumsi", value: data.reduce((sum, item) => sum + item.consumption, 0) },
    ].filter(item => item.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
                <CardHeader><CardTitle>Total Produksi dan Harga per Minggu</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" fontSize={12} />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#42A5F5" />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="gradeA" stackId="a" fill={CHART_COLORS[0]} name="Grade A" />
                            <Bar yAxisId="left" dataKey="gradeB" stackId="a" fill={CHART_COLORS[1]} name="Grade B" />
                            <Bar yAxisId="left" dataKey="gradeC" stackId="a" fill={CHART_COLORS[2]} name="Grade C" />
                            <Bar yAxisId="left" dataKey="consumption" stackId="a" fill={CHART_COLORS[3]} name="Konsumsi" />
                            <Line yAxisId="right" type="monotone" dataKey="totalValue" stroke="#42A5F5" name="Total (Rp)" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Tren Produksi dan Harga Mingguan</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" fontSize={12} />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#42A5F5" />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="gradeA" stroke={CHART_COLORS[0]} name="Grade A" />
                            <Line yAxisId="left" type="monotone" dataKey="gradeB" stroke={CHART_COLORS[1]} name="Grade B" />
                            <Line yAxisId="left" type="monotone" dataKey="gradeC" stroke={CHART_COLORS[2]} name="Grade C" />
                            <Line yAxisId="left" type="monotone" dataKey="consumption" stroke={CHART_COLORS[3]} name="Konsumsi" />
                            <Line yAxisId="right" type="monotone" dataKey="totalValue" stroke="#42A5F5" name="Total (Rp)" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Komposisi Total Produksi (Bulan Ini)</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} label={renderCustomizedLabel}>
                                 {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), 'MMMM', { locale: idLocale }),
}));

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
}));

export default function ProductionTab() {
  const { ducks, eggProduction, addDailyProduction, updateDailyProduction, addWeeklyProduction, updateWeeklyProduction, removeWeeklyProduction, companyInfo } = useAppStore();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [activeTab, setActiveTab] = React.useState("daily");
  const [showChart, setShowChart] = React.useState(false);
  const [showDailyChart, setShowDailyChart] = React.useState(false);

  const [zoomLevel, setZoomLevel] = React.useState(100);
  
  const [isDailyFormOpen, setIsDailyFormOpen] = React.useState(false);
  const [editingProduction, setEditingProduction] = React.useState<DailyProduction | undefined>(undefined);
  
  const totalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
  
  const productionTodayRecord = eggProduction.daily.at(-1);
  const productionYesterdayRecord = eggProduction.daily.at(-2);
  const todayProduction = productionTodayRecord?.totalEggs || 0;
  const yesterdayProduction = productionYesterdayRecord?.totalEggs || 0;
  const productionDifference = todayProduction - yesterdayProduction;

  const bestProduction = Math.max(...eggProduction.daily.map(d => d.totalEggs), 0);
  const productivity = totalDucks > 0 ? (todayProduction / totalDucks) * 100 : 0;
  
  const monthlyProductionData = eggProduction.daily.filter(d => {
    const dDate = new Date(d.date);
    return dDate.getMonth() === currentDate.getMonth() && dDate.getFullYear() === currentDate.getFullYear();
  });

  const weeklyDataForMonth = eggProduction.weekly
    .filter(w => {
        if (!w || !w.endDate) return false;
        const endDate = new Date(w.endDate);
        return endDate.getMonth() === currentDate.getMonth() && endDate.getFullYear() === currentDate.getFullYear();
    })
    .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
  const gradeCSum = weeklyDataForMonth.reduce((sum, week) => sum + week.gradeC, 0);
  const consumptionSum = weeklyDataForMonth.reduce((sum, week) => sum + week.consumption, 0);

  const totalRawMonthProduction = monthlyProductionData.reduce((sum, d) => sum + d.totalEggs, 0);
  const monthProduction = totalRawMonthProduction - gradeCSum - consumptionSum;

  const bestProductionRecord = monthlyProductionData.length > 0
    ? monthlyProductionData.reduce((best, current) => current.totalEggs > best.totalEggs ? current : best)
    : null;

  const worstProductionRecord = monthlyProductionData.length > 0
    ? monthlyProductionData.reduce((worst, current) => current.totalEggs < worst.totalEggs ? current : worst)
    : null;
    
  const bestProductivityRecord = monthlyProductionData.length > 0
    ? monthlyProductionData.reduce((best, current) => current.productivity > best.productivity ? current : best)
    : null;

  const worstProductivityRecord = monthlyProductionData.length > 0
    ? monthlyProductionData.reduce((worst, current) => current.productivity < worst.productivity ? current : worst)
    : null;
  
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
  
  const StatCard = ({ title, value, valueClassName, icon: Icon, iconClassName, footer }: { title: string, value: string | number, valueClassName?: string, icon: React.ElementType, iconClassName?: string, footer?: React.ReactNode }) => (
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
  
  const handleDailySave = (date: Date, data: DailyFormData) => {
    const existingRecord = eggProduction.daily.find(d => new Date(d.date).toDateString() === date.toDateString());
    if (existingRecord) {
        updateDailyProduction(date, data);
    } else {
        addDailyProduction(data);
    }
  };

  const handleRowDoubleClick = (day: DailyProduction) => {
      setEditingProduction(day);
      setIsDailyFormOpen(true);
  };
  
  const handleInputDataClick = () => {
    const todayRecord = eggProduction.daily.find(d => isToday(new Date(d.date)));
    setEditingProduction(todayRecord); // Will be undefined if no record for today, which is correct
    setIsDailyFormOpen(true);
  }
    
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

  const dailyChartData = eggProduction.daily.slice(-30).map(d => {
    const formattedData: { [key: string]: any } = {
        name: format(new Date(d.date), 'dd/MM')
    };
    ducks.forEach(duck => {
        formattedData[`Kdg ${duck.cage}`] = d.perCage[duck.cage] ?? null;
    });
    return formattedData;
  });

  const handleDailyPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Gagal Membuka Jendela Cetak",
        description: "Pastikan pop-up diizinkan untuk situs ini."
      });
      return;
    }

    const tableHead = `
        <tr>
            <th>Tanggal</th>
            <th>Hari</th>
            <th>Jumlah Telur</th>
            <th>Produktifitas</th>
            ${ducks.map(duck => `<th>Kdg ${duck.cage}</th>`).join('')}
        </tr>
    `;

    const tableBody = monthlyProductionData.map(day => {
        const perCageCells = ducks.map(duck => `<td>${day.perCage[duck.cage] ?? '-'}</td>`).join('');
        return `
            <tr>
                <td>${format(new Date(day.date), "dd/MM/yyyy")}</td>
                <td>${format(new Date(day.date), "eeee", { locale: idLocale })}</td>
                <td>${day.totalEggs}</td>
                <td>${day.productivity.toFixed(2)}%</td>
                ${perCageCells}
            </tr>
        `;
    }).join('');

    const printContent = `
        <html>
            <head>
                <title>Laporan Produksi Harian - ${companyInfo.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; }
                    .header p { margin: 5px 0; color: #555; }
                    table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Laporan Produksi Harian</h1>
                    <p>${companyInfo.name}</p>
                    <p>Periode: ${format(currentDate, "MMMM yyyy", { locale: idLocale })}</p>
                    <p>Dicetak pada: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: idLocale })}</p>
                </div>
                <table>
                    <thead>
                        ${tableHead}
                    </thead>
                    <tbody>
                        ${tableBody}
                    </tbody>
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

  const handleWeeklyPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Gagal Membuka Jendela Cetak",
        description: "Pastikan pop-up diizinkan untuk situs ini."
      });
      return;
    }
    
    const tableHeader = `
        <tr>
            <th>Periode</th>
            <th>Pembeli</th>
            <th>Grade A</th>
            <th>Grade B</th>
            <th>Grade C</th>
            <th>Konsumsi</th>
            <th>Total Telur</th>
            <th>Total Harga</th>
        </tr>
    `;

    const tableBody = Object.keys(weeklyDataByPeriod).map(period => {
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

      const entryRows = weekEntries.map(week => `
        <tr>
          <td>
            <div>${week.description}</div>
            <div class="subtext">${format(new Date(week.startDate), 'dd/MM/yy')} - ${format(new Date(week.endDate), 'dd/MM/yy')}</div>
          </td>
          <td>${week.buyer}</td>
          <td>${week.gradeA.toLocaleString('id-ID')} (Rp ${week.priceA.toLocaleString('id-ID')})</td>
          <td>${week.gradeB.toLocaleString('id-ID')} (Rp ${week.priceB.toLocaleString('id-ID')})</td>
          <td>${week.gradeC.toLocaleString('id-ID')} (Rp ${week.priceC.toLocaleString('id-ID')})</td>
          <td>${week.consumption.toLocaleString('id-ID')} (Rp ${week.priceConsumption.toLocaleString('id-ID')})</td>
          <td>${week.totalEggs.toLocaleString('id-ID')}</td>
          <td>Rp ${week.totalValue.toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

      return entryRows + `
        <tr class="subtotal">
          <td colspan="2">Subtotal Periode</td>
          <td>${subtotal.gradeA.toLocaleString('id-ID')}</td>
          <td>${subtotal.gradeB.toLocaleString('id-ID')}</td>
          <td>${subtotal.gradeC.toLocaleString('id-ID')}</td>
          <td>${subtotal.consumption.toLocaleString('id-ID')}</td>
          <td>${subtotal.totalEggs.toLocaleString('id-ID')}</td>
          <td>Rp ${subtotal.totalValue.toLocaleString('id-ID')}</td>
        </tr>
      `;
    }).join('');

    const tableFooter = `
      <tr class="grandtotal">
        <td colspan="2">Grand Total Bulanan</td>
        <td>${weeklyGrandTotal.gradeA.toLocaleString('id-ID')}</td>
        <td>${weeklyGrandTotal.gradeB.toLocaleString('id-ID')}</td>
        <td>${weeklyGrandTotal.gradeC.toLocaleString('id-ID')}</td>
        <td>${weeklyGrandTotal.consumption.toLocaleString('id-ID')}</td>
        <td>${weeklyGrandTotal.totalEggs.toLocaleString('id-ID')}</td>
        <td>Rp ${weeklyGrandTotal.totalValue.toLocaleString('id-ID')}</td>
      </tr>
    `;

    const printContent = `
      <html>
        <head>
          <title>Laporan Produksi Mingguan - ${companyInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; }
            .header p { margin: 5px 0; color: #555; }
            table { width: 100%; border-collapse: collapse; font-size: 10pt; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; }
            th { background-color: #f2f2f2; }
            td .subtext { font-size: 8pt; color: #777; }
            .subtotal { background-color: #e8e8e8; font-weight: bold; }
            .grandtotal { background-color: #d0e4fe; font-weight: bold; font-size: 11pt; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Produksi Mingguan</h1>
            <p>${companyInfo.name}</p>
            <p>Periode: ${format(currentDate, "MMMM yyyy", { locale: idLocale })}</p>
            <p>Dicetak pada: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: idLocale })}</p>
          </div>
          <table>
            <thead>${tableHeader}</thead>
            <tbody>${tableBody}</tbody>
            <tfoot>${tableFooter}</tfoot>
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
  
  const handleMonthlyPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Gagal Membuka Jendela Cetak",
        description: "Pastikan pop-up diizinkan untuk situs ini."
      });
      return;
    }

    const tableHeader = `
        <tr>
            <th>Bulan</th>
            <th>Grade A</th>
            <th>Grade B</th>
            <th>Grade C</th>
            <th>Konsumsi</th>
            <th>Total Telur</th>
        </tr>
    `;

    const tableBody = eggProduction.monthly.map(month => `
      <tr>
        <td>${month.month}</td>
        <td>${month.gradeA.toLocaleString('id-ID')}</td>
        <td>${month.gradeB.toLocaleString('id-ID')}</td>
        <td>${month.gradeC.toLocaleString('id-ID')}</td>
        <td>${month.consumption.toLocaleString('id-ID')}</td>
        <td>${month.totalEggs.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const tableFooter = `
      <tr class="grandtotal">
        <td>Grand Total</td>
        <td>${monthlyGrandTotal.gradeA.toLocaleString('id-ID')}</td>
        <td>${monthlyGrandTotal.gradeB.toLocaleString('id-ID')}</td>
        <td>${monthlyGrandTotal.gradeC.toLocaleString('id-ID')}</td>
        <td>${monthlyGrandTotal.consumption.toLocaleString('id-ID')}</td>
        <td>${monthlyGrandTotal.totalEggs.toLocaleString('id-ID')}</td>
      </tr>
    `;

    const printContent = `
      <html>
        <head>
          <title>Laporan Produksi Bulanan - ${companyInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; }
            .header p { margin: 5px 0; color: #555; }
            table { width: 100%; border-collapse: collapse; font-size: 10pt; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .grandtotal { background-color: #d0e4fe; font-weight: bold; font-size: 11pt; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Laporan Produksi Bulanan</h1>
            <p>${companyInfo.name}</p>
            <p>Dicetak pada: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: idLocale })}</p>
          </div>
          <table>
            <thead>${tableHeader}</thead>
            <tbody>${tableBody}</tbody>
            <tfoot>${tableFooter}</tfoot>
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


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Produksi Hari Ini" 
            value={todayProduction.toLocaleString('id-ID')} 
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
        <StatCard 
            title="Produksi Terbaik" 
            value={bestProduction.toLocaleString('id-ID')} 
            icon={Trophy} 
            valueClassName="text-yellow-500" 
            iconClassName="text-yellow-500"
            footer={
                 <div className="w-full pt-2 space-y-1">
                    <div className="font-semibold">Riwayat Bulan Ini:</div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500"/>
                            Terbaik ({bestProductionRecord ? format(new Date(bestProductionRecord.date), 'dd/MM') : '-'}):
                        </span>
                        <span className="font-semibold">{bestProductionRecord?.totalEggs ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center">
                            <TrendingDown className="h-3 w-3 mr-1 text-red-500"/>
                            Terendah ({worstProductionRecord ? format(new Date(worstProductionRecord.date), 'dd/MM') : '-'}):
                        </span>
                        <span className="font-semibold">{worstProductionRecord?.totalEggs ?? 0}</span>
                    </div>
                </div>
            }
        />
        <StatCard 
            title="Produktifitas" 
            value={`${productivity.toFixed(2)}%`} 
            icon={Percent} 
            footer={
                <div className="w-full pt-2 space-y-1">
                    <div className="font-semibold">Produktifitas Bulan Ini:</div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-green-500"/>
                            Terbaik ({bestProductivityRecord ? format(new Date(bestProductivityRecord.date), 'dd/MM') : '-'}):
                        </span>
                        <span className="font-semibold">{bestProductivityRecord?.productivity.toFixed(2) ?? 0}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center">
                            <TrendingDown className="h-3 w-3 mr-1 text-red-500"/>
                            Terendah ({worstProductivityRecord ? format(new Date(worstProductivityRecord.date), 'dd/MM') : '-'}):
                        </span>
                        <span className="font-semibold">{worstProductivityRecord?.productivity.toFixed(2) ?? 0}%</span>
                    </div>
                </div>
            }
        />
        <StatCard 
            title={`Telur Bulan ${format(currentDate, "MMMM", { locale: idLocale })}`} 
            value={monthProduction.toLocaleString('id-ID')} 
            icon={CalendarDays} 
            footer={
              <div className="w-full flex justify-between pt-2">
                <div className="font-medium text-red-500">Grade C: {gradeCSum.toLocaleString('id-ID')}</div>
                <div className="font-medium text-blue-500">Konsumsi: {consumptionSum.toLocaleString('id-ID')}</div>
              </div>
            }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tabel Produksi</CardTitle>
            <div className="flex items-center gap-2">
                 {(activeTab === 'monthly' || activeTab === 'weekly') && (
                    <Button variant="ghost" size="icon" onClick={() => setShowChart(!showChart)} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                        <BarChartIcon className="h-4 w-4" />
                        <span className="sr-only">Tampilkan Grafik</span>
                    </Button>
                )}
                 {activeTab === 'daily' && (
                    <Button variant="ghost" size="icon" onClick={() => setShowDailyChart(!showDailyChart)} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                        <LineChartIcon className="h-4 w-4" />
                        <span className="sr-only">Tampilkan/Sembunyikan Grafik Harian</span>
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
        {showChart && (activeTab === 'monthly' || activeTab === 'weekly') ? (
                activeTab === 'monthly' ? <MonthlyChart data={eggProduction.monthly} /> : <WeeklyChart data={weeklyDataForMonth} />
            ) : (
          <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <TabsList>
                        <TabsTrigger value="daily">Harian</TabsTrigger>
                        <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                        <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                    </TabsList>
                    {(activeTab === 'daily') && (
                        <div className="hidden sm:block text-sm font-medium">
                            Total Produksi Bulan Ini: <span className="text-primary font-bold">{totalRawMonthProduction.toLocaleString('id-ID')} butir</span>
                        </div>
                    )}
                </div>
                 <div className="flex items-center gap-2">
                    {activeTab === 'daily' && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(50, prev - 5))} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
                            <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(150, prev + 5))} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" onClick={handleDailyPrint} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Cetak Tabel Harian</span>
                            </Button>
                            <div className="flex gap-1">
                                <Select
                                    value={String(currentDate.getMonth())}
                                    onValueChange={(value) => {
                                        const newDate = new Date(currentDate);
                                        newDate.setMonth(parseInt(value));
                                        setCurrentDate(newDate);
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] border-0">
                                        <SelectValue placeholder="Pilih Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.map((month) => (
                                            <SelectItem key={month.value} value={String(month.value)}>
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={String(currentDate.getFullYear())}
                                    onValueChange={(value) => {
                                        const newDate = new Date(currentDate);
                                        newDate.setFullYear(parseInt(value));
                                        setCurrentDate(newDate);
                                    }}
                                >
                                    <SelectTrigger className="w-[80px] border-0">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map((year) => (
                                            <SelectItem key={year.value} value={String(year.value)}>
                                                {year.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    
                    {activeTab === 'weekly' && (
                        <>
                            <div className="flex gap-1">
                                <Select
                                    value={String(currentDate.getMonth())}
                                    onValueChange={(value) => {
                                        const newDate = new Date(currentDate);
                                        newDate.setMonth(parseInt(value));
                                        setCurrentDate(newDate);
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] border-0">
                                        <SelectValue placeholder="Pilih Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthOptions.map((month) => (
                                            <SelectItem key={month.value} value={String(month.value)}>
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={String(currentDate.getFullYear())}
                                    onValueChange={(value) => {
                                        const newDate = new Date(currentDate);
                                        newDate.setFullYear(parseInt(value));
                                        setCurrentDate(newDate);
                                    }}
                                >
                                    <SelectTrigger className="w-[80px] border-0">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearOptions.map((year) => (
                                            <SelectItem key={year.value} value={String(year.value)}>
                                                {year.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <Button variant="ghost" size="icon" onClick={handleWeeklyPrint} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Cetak Tabel Mingguan</span>
                            </Button>
                        </>
                    )}

                    {activeTab === 'monthly' && (
                         <Button variant="ghost" size="icon" onClick={handleMonthlyPrint} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Cetak Tabel Bulanan</span>
                        </Button>
                    )}


                    {activeTab === 'daily' && (
                        <Button onClick={handleInputDataClick} variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Input Data Harian
                        </Button>
                    )}
                    {activeTab === 'weekly' && (
                        <WeeklyDataForm onSave={addWeeklyProduction}>
                            <Button variant="outline" className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
                                <PlusCircle className="mr-2 h-4 w-4" />Input Data Mingguan
                            </Button>
                        </WeeklyDataForm>
                    )}
                 </div>
            </div>
            
            <TabsContent value="daily">
             <Collapsible open={showDailyChart} onOpenChange={setShowDailyChart} className="space-y-4">
                <CollapsibleContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>Grafik Produksi per Kandang (30 Hari Terakhir)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={dailyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{
                                            background: "hsl(var(--background))",
                                            borderColor: "hsl(var(--border))",
                                        }}
                                    />
                                    <Legend />
                                    {ducks.map((duck, index) => (
                                        <Line
                                            key={duck.id}
                                            type="monotone"
                                            dataKey={`Kdg ${duck.cage}`}
                                            stroke={CHART_COLORS[index % CHART_COLORS.length]}
                                            dot={false}
                                            connectNulls
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
             </Collapsible>
             <div className="w-full overflow-auto rounded-md border" style={{ maxHeight: '60vh' }}>
                <div style={{ 
                    width: 'fit-content',
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left'
                  }}>
                  <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                              <TableHead className="text-center align-middle p-2 min-w-[100px]">Tanggal</TableHead>
                              <TableHead className="text-center align-middle p-2 min-w-[100px]">Hari</TableHead>
                              <TableHead className="text-center align-middle p-2">Jumlah Telur</TableHead>
                              <TableHead className="text-center align-middle p-2">Produktifitas</TableHead>
                              {ducks.map(duck => (
                                  <TableHead key={duck.id} className="text-center align-top p-2">
                                      <div className="flex flex-col items-center justify-start h-full whitespace-nowrap">
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
                              .map((day) => (
                                  <TableRow key={day.date.toISOString()} onDoubleClick={() => handleRowDoubleClick(day)} className="cursor-pointer">
                                      <TableCell className="align-middle text-center p-2">{format(new Date(day.date), "dd/MM/yyyy")}</TableCell>
                                      <TableCell className="align-middle text-center p-2">{format(new Date(day.date), "eeee", { locale: idLocale })}</TableCell>
                                      <TableCell className="align-middle text-center p-2">{day.totalEggs}</TableCell>
                                      <TableCell className="align-middle text-center p-2">{day.productivity.toFixed(2)}%</TableCell>
                                      {ducks.map(duck => {
                                          const production = day.perCage[duck.cage];
                                          const productivity = duck.quantity > 0 && production != null
                                              ? (production / duck.quantity * 100)
                                              : 0;
                                          return (
                                              <TableCell key={duck.id} className="p-0 text-center align-middle">
                                                  <div className="pt-4 pb-2 p-2">{production ?? '-'}</div>
                                                  <div className={cn("text-xs py-0.5 w-11/12 mx-auto rounded-sm mb-2", getProductivityColor(productivity))}>
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
              </div>
               <DailyDataForm 
                  open={isDailyFormOpen}
                  onOpenChange={setIsDailyFormOpen}
                  production={editingProduction} 
                  onSave={handleDailySave}
                >
                    {/* The Dialog is controlled by state, no trigger needed here */}
                    <div />
               </DailyDataForm>
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
                      <TableHead className="text-center">Total Telur</TableHead>
                      <TableHead>Total Harga</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
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
                                        {format(new Date(week.startDate), 'dd/MM/yy', { locale: idLocale })} - {format(new Date(week.endDate), 'dd/MM/yy', { locale: idLocale })}
                                    </div>
                                  </TableCell>
                                  <TableCell>{week.buyer}</TableCell>
                                  <GradeCell amount={week.gradeA} price={week.priceA} />
                                  <GradeCell amount={week.gradeB} price={week.priceB} />
                                  <GradeCell amount={week.gradeC} price={week.priceC} />
                                  <GradeCell amount={week.consumption} price={week.priceConsumption} />
                                  <TableCell className="text-center">{week.totalEggs.toLocaleString('id-ID')}</TableCell>
                                  <TableCell>Rp {week.totalValue.toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Buka menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <WeeklyDataForm
                                                production={week}
                                                onSave={(updatedData) => updateWeeklyProduction(week.id, updatedData)}
                                            >
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                            </WeeklyDataForm>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Hapus</span>
                                                    </DropdownMenuItem>
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
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                          <TableRow className="bg-secondary/50 font-bold">
                            <TableCell className="text-left" colSpan={2}>Subtotal Periode</TableCell>
                            <TableCell className="text-center">{subtotal.gradeA.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-center">{subtotal.gradeB.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-center">{subtotal.gradeC.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-center">{subtotal.consumption.toLocaleString('id-ID')}</TableCell>
                            <TableCell className="text-center">{subtotal.totalEggs.toLocaleString('id-ID')}</TableCell>
                            <TableCell>Rp {subtotal.totalValue.toLocaleString('id-ID')}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                   <TableFooter>
                    <TableRow className="bg-primary/20 font-extrabold text-lg">
                      <TableCell className="text-left" colSpan={2}>Grand Total Bulanan</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.gradeA.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.gradeB.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.gradeC.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.consumption.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center">{weeklyGrandTotal.totalEggs.toLocaleString('id-ID')}</TableCell>
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
                                <TableHead className="text-center">Grade A</TableHead>
                                <TableHead className="text-center">Grade B</TableHead>
                                <TableHead className="text-center">Grade C</TableHead>
                                <TableHead className="text-center">Konsumsi</TableHead>
                                <TableHead className="text-center">Total Telur</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {eggProduction.monthly.map((month, index) => (
                                <TableRow key={index}>
                                    <TableCell>{month.month}</TableCell>
                                    <TableCell className="text-center">{month.gradeA.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-center">{month.gradeB.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-center">{month.gradeC.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-center">{month.consumption.toLocaleString('id-ID')}</TableCell>
                                    <TableCell className="text-center">{month.totalEggs.toLocaleString('id-ID')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow className="bg-primary/20 font-extrabold text-lg">
                                <TableCell>Grand Total</TableCell>
                                <TableCell className="text-center">{monthlyGrandTotal.gradeA.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-center">{monthlyGrandTotal.gradeB.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-center">{monthlyGrandTotal.gradeC.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-center">{monthlyGrandTotal.consumption.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-center">{monthlyGrandTotal.totalEggs.toLocaleString('id-ID')}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </TabsContent>
          </Tabs>
        )}
        </CardContent>
      </Card>
    </div>
  );
}



    

    













