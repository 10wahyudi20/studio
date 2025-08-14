
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Egg, Package, Wallet, Wheat, TrendingUp, TrendingDown, ArrowUp, ArrowDown, CalendarDays, Users, Trophy } from "lucide-react";
import { Bar, ResponsiveContainer, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useAppStore } from "@/hooks/use-app-store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Separator } from "../ui/separator";
import { id as idLocale } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const StatCard = ({ title, value, valueClassName, icon: Icon, iconClassName, description, footer }: { title: string, value: string, valueClassName?: string, icon: React.ElementType, iconClassName?: string, description?: React.ReactNode, footer?: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
        </CardHeader>
        <CardContent>
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
  
  const totalMonthProduction = monthlyProductionData.reduce((sum, day) => sum + day.totalEggs, 0);
  
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
    "Produktifitas": totalDucks > 0 ? parseFloat(((d.totalEggs / totalDucks) * 100).toFixed(1)) : 0,
  }));
  
  const chartConfig = {
    "Produksi Telur": {
      label: "Produksi Telur",
      color: "hsl(var(--chart-1))",
    },
    "Produktifitas": {
      label: "Produktifitas (%)",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;
  
  const bestProductionRecord = monthlyProductionData.length > 0
    ? monthlyProductionData.reduce((best, current) => current.totalEggs > best.totalEggs ? current : best)
    : null;

  const worstProductionRecord = monthlyProductionData.length > 0
    ? monthlyProductionData.reduce((worst, current) => current.totalEggs < worst.totalEggs ? current : worst)
    : null;
  
  const totalDeaths = ducks.reduce((sum, duck) => sum + duck.deaths, 0);
  
  const getFeedStockStyling = (stock: number) => {
    if (stock <= 100) return { value: 'text-red-500', icon: 'text-red-500 animate-pulse' };
    if (stock <= 300) return { value: 'text-yellow-500', icon: 'text-yellow-500' };
    if (stock <= 500) return { value: 'text-green-500', icon: 'text-green-500' };
    return { value: 'text-blue-500', icon: 'text-blue-500' };
  };
  const feedStockStyling = getFeedStockStyling(feedStock);

  const weeklyDataForMonth = eggProduction.weekly.filter(w => {
    const endDate = new Date(w.endDate);
    return endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear;
  });

  const gradeCSum = weeklyDataForMonth.reduce((sum, week) => sum + week.gradeC, 0);
  const consumptionSum = weeklyDataForMonth.reduce((sum, week) => sum + week.consumption, 0);
  
  // Update the monthProduction calculation
  const monthProduction = totalMonthProduction - gradeCSum - consumptionSum;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard 
            title="Total Bebek" 
            value={totalDucks.toLocaleString('id-ID')} 
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
            title="Produksi Hari Ini" 
            value={todayProduction.toLocaleString('id-ID')} 
            valueClassName={cn({
                'text-green-600 dark:text-green-500': productionDifference > 0,
                'text-red-600 dark:text-red-500': productionDifference < 0,
            })}
            icon={Egg}
            footer={
                productionYesterdayRecord && (
                    <div className={cn('flex items-center text-xs w-full pt-2', {
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
            title={`Telur Bulan ${format(new Date(), 'MMMM', { locale: idLocale })}`} 
            value={monthProduction.toLocaleString('id-ID')}
            icon={CalendarDays}
            footer={
              <div className="w-full flex justify-between pt-2">
                <div className="font-medium text-red-500">Grade C: {gradeCSum.toLocaleString('id-ID')}</div>
                <div className="font-medium text-blue-500">Konsumsi: {consumptionSum.toLocaleString('id-ID')}</div>
              </div>
            }
        />
        <StatCard 
            title="Stok Pakan (Kg)" 
            value={`${feedStock.toLocaleString('id-ID')} Kg`} 
            icon={Package} 
            valueClassName={feedStockStyling.value}
            iconClassName={feedStockStyling.icon}
            footer={
                <div className="w-full space-y-1 pt-2">
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
            icon={Wheat}
            footer={
                <div className="w-full space-y-1 pt-2">
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
        <StatCard title="Laba Bersih Bulan Ini" 
          value={`Rp ${netProfit.toLocaleString('id-ID')}`} 
          icon={Wallet}
          footer={
            <div className="w-full pt-2 flex justify-between">
              <div className="flex items-center text-green-500">
                <TrendingUp className="h-4 w-4 mr-1"/>
                <span>Rp {monthlyIncome.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center text-red-500">
                 <TrendingDown className="h-4 w-4 mr-1"/>
                <span>Rp {monthlyExpense.toLocaleString('id-ID')}</span>
              </div>
            </div>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grafik Produksi 30 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="h-80 w-full">
                <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
                  <RechartsBarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Produksi Telur" radius={4} fill="var(--color-Produksi Telur)" />
                    <Bar yAxisId="right" dataKey="Produktifitas" radius={4} fill="var(--color-Produktifitas)" />
                  </RechartsBarChart>
                </ChartContainer>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
