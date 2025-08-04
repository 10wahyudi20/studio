
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { BarChart, PieChart, Egg, Package, DollarSign, Wallet, Wheat, TrendingUp, TrendingDown } from "lucide-react";
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
  const todayProduction = eggProduction.daily[eggProduction.daily.length - 1]?.totalEggs || 0;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthProduction = eggProduction.daily
    .filter(d => new Date(d.date).getMonth() === currentMonth && new Date(d.date).getFullYear() === currentYear)
    .reduce((sum, day) => sum + day.totalEggs, 0);
  
  const feedStock = feed.reduce((sum, item) => sum + item.stock, 0);
  
  const dailyFeedConsumptionKg = feed.reduce((sum, item) => sum + (item.stock > 0 ? (totalDucks * item.schema / 1000) : 0), 0);
  const dailyFeedCost = feed.reduce((sum, item) => sum + (item.stock > 0 ? (dailyFeedConsumptionKg * item.pricePerKg) : 0), 0);
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

  const bestProduction = Math.max(...eggProduction.daily.map(d => d.totalEggs), 0);
  
  const worstProductionRecord = eggProduction.daily.length > 0 
    ? eggProduction.daily.reduce((min, p) => p.totalEggs < min.totalEggs ? p : min, eggProduction.daily[0]) 
    : null;

  const StatCard = ({ title, value, icon: Icon, description, footer }: { title: string, value: string, icon: React.ElementType, description?: string, footer?: React.ReactNode }) => (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
        <StatCard title="Total Bebek" value={totalDucks.toLocaleString('id-ID')} icon={Egg} />
        <StatCard title="Produksi Hari Ini" value={todayProduction.toLocaleString('id-ID')} icon={BarChart} />
        <StatCard 
            title="Produksi Terbaik" 
            value={bestProduction.toLocaleString('id-ID')} 
            icon={TrendingUp} 
            footer={worstProductionRecord && (
                 <div className="w-full pt-2 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center"><TrendingDown className="h-3 w-3 mr-1 text-red-500"/>Terendah:</span>
                        <span className="font-semibold">{worstProductionRecord.totalEggs} <span className="text-muted-foreground">({format(new Date(worstProductionRecord.date), 'd MMM')})</span></span>
                    </div>
                </div>
            )}
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
