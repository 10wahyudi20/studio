
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { BarChart, PieChart, Egg, Package, DollarSign, Wallet, Wheat, TrendingUp, TrendingDown, ArrowUp, ArrowDown, CalendarDays } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, Pie, Cell, ResponsiveContainer, BarChart as RechartsBarChart, PieChart as RechartsPieChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useAppStore } from "@/hooks/use-app-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const COLORS = ["#64B5F6", "#81C784", "#FFB74D", "#E57373", "#BA68C8", "#7986CB"];

export default function HomeTab() {
  const { ducks, eggProduction, feed, finance } = useAppStore();

  const totalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
  
  const productionTodayRecord = eggProduction.daily.at(-1);
  const productionYesterdayRecord = eggProduction.daily.at(-2);
  const todayProduction = productionTodayRecord?.totalEggs || 0;
  const yesterdayProduction = productionYesterdayRecord?.totalEggs || 0;
  const productionDifference = todayProduction - yesterdayProduction;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyProductionData = eggProduction.daily
    .filter(d => {
        const date = new Date(d.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  
  const monthProduction = monthlyProductionData.reduce((sum, day) => sum + day.totalEggs, 0);
  
  const feedStock = feed.reduce((sum, item) => sum + item.stock, 0);
  
  const dailyFeedConsumptionKg = feed.reduce((sum, item) => {
    if (item.stock > 0 && totalDucks > 0) {
      return sum + (totalDucks * item.schema / 1000);
    }
    return sum;
  }, 0);
  
  const dailyFeedCost = feed.reduce((sum, item) => {
    if (item.stock > 0 && totalDucks > 0) {
      const consumptionForFeed = (totalDucks * item.schema / 1000); // in kg
      return sum + (consumptionForFeed * item.pricePerKg);
    }
    return sum;
  }, 0);

  const averageFeedCostPerKg = dailyFeedConsumptionKg > 0 ? dailyFeedCost / dailyFeedConsumptionKg : 0;
  
  const monthlyIncome = finance
    .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'debit')
    .reduce((sum, t) => sum + t.total, 0);
  const monthlyExpense = finance
    .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'credit')
    .reduce((sum, t) => sum + t.total, 0);
  const netProfit = monthlyIncome - monthlyExpense;

  const chartData = eggProduction.daily.slice(-30).map(d => ({
    name: new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    "Produksi Telur": d.totalEggs,
    "Produktifitas (%)": totalDucks > 0 ? parseFloat(((d.totalEggs / totalDucks) * 100).toFixed(1)) : 0,
  }));
  
  const pieChartData = [
    { name: 'Produktif', value: ducks.filter(d => d.status === 'Bebek Petelur').reduce((s, d) => s + d.quantity, 0) },
    { name: 'Bayah', value: ducks.filter(d => d.status === 'Bebek Bayah').reduce((s, d) => s + d.quantity, 0) },
    { name: 'Tua', value: ducks.filter(d => d.status === 'Bebek Tua').reduce((s, d) => s + d.quantity, 0) },
    { name: 'Afkir', value: ducks.filter(d => d.status === 'Bebek Afkir').reduce((s, d) => s + d.quantity, 0) },
  ];

  const bestProductionThisMonth = Math.max(...monthlyProductionData.map(d => d.totalEggs), 0);
  const worstProductionThisMonth = Math.min(...monthlyProductionData.map(d => d.totalEggs), Infinity);
  
  const totalDeaths = ducks.reduce((sum, duck) => sum + duck.deaths, 0);

  const StatCard = ({ title, value, valueClassName, icon: Icon, description, footer }: { title: string, value: string, valueClassName?: string, icon: React.ElementType, description?: React.ReactNode, footer?: React.ReactNode }) => (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
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
            value={totalDucks.toLocaleString('id-ID')} 
            icon={Egg} 
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
            title="Produksi Hari Ini" 
            value={todayProduction.toLocaleString('id-ID')} 
            valueClassName={cn({
                'text-green-600 dark:text-green-500': productionDifference > 0,
                'text-red-600 dark:text-red-500': productionDifference < 0,
            })}
            icon={BarChart}
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
            title="Telur Satu Bulan" 
            value={monthProduction.toLocaleString('id-ID')} 
            icon={CalendarDays} 
            footer={
                <div className="w-full pt-2 space-y-2">
                    <div className="font-semibold">Riwayat Bulan Ini:</div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center"><TrendingUp className="h-3 w-3 mr-1 text-green-500"/>Terbaik:</span>
                        <span className="font-semibold">{bestProductionThisMonth}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center"><TrendingDown className="h-3 w-3 mr-1 text-red-500"/>Terendah:</span>
                        <span className="font-semibold">{worstProductionThisMonth === Infinity ? 0 : worstProductionThisMonth}</span>
                    </div>
                </div>
            }
        />
        <StatCard 
            title="Stok Pakan (Kg)" 
            value={feedStock.toLocaleString('id-ID')} 
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
        <StatCard 
            title="Biaya Pakan/Hari" 
            value={`Rp ${dailyFeedCost.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
            icon={DollarSign}
            footer={
                <div className="w-full pt-2">
                    <div className="flex justify-between">
                        <span>Konsumsi:</span>
                        <span>{dailyFeedConsumptionKg.toLocaleString('id-ID', {minimumFractionDigits: 1, maximumFractionDigits: 1})} Kg</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Biaya/Kg:</span>
                        <span>Rp {averageFeedCostPerKg.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                    </div>
                </div>
            }
        />
        <StatCard title="Laba Bersih Bulan Ini" value={`Rp ${netProfit.toLocaleString('id-ID')}`} icon={Wallet} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistik Produksi & Populasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bar">
            <TabsList>
              <TabsTrigger value="bar">Grafik Batang (Produksi)</TabsTrigger>
              <TabsTrigger value="pie">Grafik Pie (Populasi)</TabsTrigger>
            </TabsList>
            <TabsContent value="bar">
              <ChartContainer config={{}} className="h-80 w-full">
                <ResponsiveContainer>
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" />
                    <YAxis yAxisId="right" orientation="right" stroke="#e85d04" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Produksi Telur" fill="hsl(var(--primary))" radius={4} />
                    <Bar yAxisId="right" dataKey="Produktifitas (%)" fill="#e85d04" radius={4} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="pie">
                <ChartContainer config={{}} className="h-80 w-full">
                    <ResponsiveContainer>
                        <RechartsPieChart>
                            <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
