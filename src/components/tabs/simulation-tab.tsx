
"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowRight, DollarSign, Egg, Users, Wheat, RefreshCw, Package, Inbox, Scale, Printer } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import type { Feed, WeeklyProduction } from '@/lib/types';
import { getMonth, getYear, format, startOfWeek, endOfWeek, parse, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const SimulationInput = ({ label, id, value, onChange, unit, ...props }: { label: string, id: string, value: number | string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="text-sm">{label}</Label>
        <div className="flex items-center">
            <Input id={id} type="number" value={value} onChange={onChange} className={cn("text-primary font-semibold", props.className)} {...props} />
            {unit && <span className="ml-2 text-muted-foreground text-sm">{unit}</span>}
        </div>
    </div>
);

const ResultDisplay = ({ label, value, icon: Icon, isProfit = false, isLoss = false }: { label: string, value: string, icon: React.ElementType, isProfit?: boolean, isLoss?: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
        <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{label}</span>
        </div>
        <span className={cn("text-lg font-bold", isProfit && "text-green-500", isLoss && "text-red-500")}>{value}</span>
    </div>
);

const FeedPriceCard = ({ name, pricePerBag, pricePerKg }: { name: string, pricePerBag: number, pricePerKg: number}) => (
    <Card className="bg-secondary/50 p-3 flex-shrink-0">
        <h5 className="font-semibold text-sm text-center">{name}</h5>
        <Separator className="my-1.5" />
        <div className="text-xs space-y-1 text-center">
            <p>Rp {pricePerBag.toLocaleString('id-ID')}/zak</p>
            <p className="font-bold text-primary">Rp {pricePerKg.toLocaleString('id-ID')}/Kg</p>
        </div>
    </Card>
);

export default function SimulationTab() {
    const { ducks, feed, eggProduction, companyInfo } = useAppStore();
    const { toast } = useToast();
    const [mode, setMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [availableWeeks, setAvailableWeeks] = useState<Record<string, WeeklyProduction[]>>({});
    const [selectedWeek, setSelectedWeek] = useState<string>("");

    const getInitialState = () => {
        const initialTotalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
        const activeFeeds = feed.filter(f => f.stock > 0);
        
        const initialFeedSchemas = activeFeeds.reduce((acc, f) => {
            acc[f.id] = f.schema;
            return acc;
        }, {} as Record<number, number>);
        
        return {
            totalDucks: initialTotalDucks,
            feedSchemas: initialFeedSchemas,
            gradeA: 0,
            gradeB: 0,
            gradeC: 0,
            consumption: 0,
            priceA: '' as number | string,
            priceB: '' as number | string,
            priceC: '' as number | string,
            priceConsumption: '' as number | string,
        };
    };

    const [simulationState, setSimulationState] = useState(getInitialState());

    const handleReset = () => {
        setSimulationState(getInitialState());
        setSelectedWeek("");
    };
    
    useEffect(() => {
        handleReset();

        const currentMonth = getMonth(new Date());
        const currentYearValue = getYear(new Date());

        const weeklyDataForMonth = eggProduction.weekly.filter(w => {
            const endDate = new Date(w.endDate);
            return getMonth(endDate) === currentMonth && getYear(endDate) === currentYearValue;
        });

        if (mode === 'monthly') {
            if (weeklyDataForMonth.length > 0) {
                const totals = weeklyDataForMonth.reduce((acc, week) => {
                    acc.gradeA += week.gradeA;
                    acc.gradeB += week.gradeB;
                    acc.gradeC += week.gradeC;
                    acc.consumption += week.consumption;
                    acc.valueA += week.gradeA * week.priceA;
                    acc.valueB += week.gradeB * week.priceB;
                    acc.valueC += week.gradeC * week.priceC;
                    acc.valueConsumption += week.consumption * week.priceConsumption;
                    return acc;
                }, { gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0, valueA: 0, valueB: 0, valueC: 0, valueConsumption: 0 });

                setSimulationState(prevState => ({
                    ...prevState,
                    gradeA: totals.gradeA,
                    gradeB: totals.gradeB,
                    gradeC: totals.gradeC,
                    consumption: totals.consumption,
                    priceA: totals.gradeA > 0 ? Math.round(totals.valueA / totals.gradeA) : 0,
                    priceB: totals.gradeB > 0 ? Math.round(totals.valueB / totals.gradeB) : 0,
                    priceC: totals.gradeC > 0 ? Math.round(totals.valueC / totals.gradeC) : 0,
                    priceConsumption: totals.consumption > 0 ? Math.round(totals.valueConsumption / totals.consumption) : 0,
                }));
            }
        } else if (mode === 'weekly') {
             const groupedByPeriod = weeklyDataForMonth.reduce((acc, week) => {
                const periodKey = `${format(new Date(week.startDate), 'dd MMM yyyy', { locale: idLocale })} - ${format(new Date(week.endDate), 'dd MMM yyyy', { locale: idLocale })}`;
                if (!acc[periodKey]) {
                    acc[periodKey] = [];
                }
                acc[periodKey].push(week);
                return acc;
            }, {} as Record<string, WeeklyProduction[]>);
            setAvailableWeeks(groupedByPeriod);
        }
    }, [mode, eggProduction.weekly]);
    
    useEffect(() => {
        if (mode === 'weekly' && selectedWeek && availableWeeks[selectedWeek]) {
            const weekEntries = availableWeeks[selectedWeek];
            const subtotal = weekEntries.reduce((acc, week) => {
                acc.gradeA += week.gradeA;
                acc.gradeB += week.gradeB;
                acc.gradeC += week.gradeC;
                acc.consumption += week.consumption;
                acc.valueA += week.gradeA * week.priceA;
                acc.valueB += week.gradeB * week.priceB;
                acc.valueC += week.gradeC * week.priceC;
                acc.valueConsumption += week.consumption * week.priceConsumption;
                return acc;
            }, { gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0, valueA: 0, valueB: 0, valueC: 0, valueConsumption: 0 });

            setSimulationState(prevState => ({
                ...prevState,
                gradeA: subtotal.gradeA,
                gradeB: subtotal.gradeB,
                gradeC: subtotal.gradeC,
                consumption: subtotal.consumption,
                priceA: subtotal.gradeA > 0 ? Math.round(subtotal.valueA / subtotal.gradeA) : 0,
                priceB: subtotal.gradeB > 0 ? Math.round(subtotal.valueB / subtotal.gradeB) : 0,
                priceC: subtotal.gradeC > 0 ? Math.round(subtotal.valueC / subtotal.gradeC) : 0,
                priceConsumption: subtotal.consumption > 0 ? Math.round(subtotal.valueConsumption / subtotal.consumption) : 0,
            }));
        } else if (mode === 'weekly' && !selectedWeek) {
            handleReset();
        }
    }, [selectedWeek, mode, availableWeeks]);


    const handleInputChange = (field: keyof typeof simulationState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSimulationState(prevState => ({
            ...prevState,
            [field]: value === '' ? '' : Number(value)
        }));
    };
    
    const handleSchemaChange = (feedId: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSimulationState(prevState => ({
            ...prevState,
            feedSchemas: {
                ...prevState.feedSchemas,
                [feedId]: value === '' ? 0 : Number(value)
            }
        }));
    };

    const timeMultiplier = mode === 'weekly' ? 7 : mode === 'monthly' ? 30 : 1;
    const activeFeedsForCalc = feed.filter(f => f.stock > 0);
    const eggYield = simulationState.gradeA + simulationState.gradeB + simulationState.gradeC + simulationState.consumption;
    
    const totalSchemaFromInputs = Object.values(simulationState.feedSchemas).reduce((sum, schema) => sum + (schema || 0), 0);
    const totalFeedConsumptionKgPerDay = (simulationState.totalDucks * totalSchemaFromInputs) / 1000;
    const totalFeedConsumptionKg = totalFeedConsumptionKgPerDay * timeMultiplier;
    
    const totalFeedCostPerDay = activeFeedsForCalc.reduce((sum, item) => {
        const schemaForThisFeed = simulationState.feedSchemas[item.id] || 0;
        const consumptionForThisFeedKg = (simulationState.totalDucks * schemaForThisFeed) / 1000;
        return sum + (consumptionForThisFeedKg * item.pricePerKg);
    }, 0);
    const totalFeedCost = totalFeedCostPerDay * timeMultiplier;

    const averageFeedCostPerKg = totalFeedConsumptionKgPerDay > 0 ? totalFeedCostPerDay / totalFeedConsumptionKgPerDay : 0;
    
    const pA = typeof simulationState.priceA === 'number' ? simulationState.priceA : 0;
    const pB = typeof simulationState.priceB === 'number' ? simulationState.priceB : 0;
    const pC = typeof simulationState.priceC === 'number' ? simulationState.priceC : 0;
    const pCons = typeof simulationState.priceConsumption === 'number' ? simulationState.priceConsumption : 0;

    const grossIncome = (simulationState.gradeA * pA) + (simulationState.gradeB * pB) + (simulationState.gradeC * pC) + (simulationState.consumption * pCons);
    const netIncome = grossIncome - totalFeedCost;
    
    const projectedMonthlyIncome = 
        mode === 'daily' ? netIncome * 30 : 
        mode === 'weekly' ? netIncome * 4 : 
        netIncome;

    const formatCurrency = (value: number) => {
        return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const periodLabel = mode === 'daily' ? 'Harian' : mode === 'weekly' ? 'Mingguan' : 'Bulanan';
    const periodLabelShort = mode === 'daily' ? 'Hari' : mode === 'weekly' ? 'Minggu' : 'Bulan';
    const isDataAutoFilled = mode === 'monthly' || (mode === 'weekly' && !!selectedWeek);

    const sortedWeekKeys = Object.keys(availableWeeks).sort((a, b) => {
        const dateA = parse(a.split(' - ')[0], 'dd MMM yyyy', new Date(), { locale: idLocale });
        const dateB = parse(b.split(' - ')[0], 'dd MMM yyyy', new Date(), { locale: idLocale });
        return dateA.getTime() - dateB.getTime();
    });

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({
                variant: "destructive",
                title: "Gagal Membuka Jendela Cetak",
                description: "Pastikan pop-up diizinkan untuk situs ini."
            });
            return;
        }

        const feedSchemaHtml = activeFeedsForCalc.map(f => `
            <tr>
                <td>${f.name}</td>
                <td class="text-right">${simulationState.feedSchemas[f.id] || 0} g</td>
            </tr>
        `).join('');
        
        const eggHtml = `
            <tr><td>Grade A</td><td class="text-right">${simulationState.gradeA.toLocaleString('id-ID')} butir</td><td class="text-right">${formatCurrency(pA)}</td></tr>
            <tr><td>Grade B</td><td class="text-right">${simulationState.gradeB.toLocaleString('id-ID')} butir</td><td class="text-right">${formatCurrency(pB)}</td></tr>
            <tr><td>Grade C</td><td class="text-right">${simulationState.gradeC.toLocaleString('id-ID')} butir</td><td class="text-right">${formatCurrency(pC)}</td></tr>
            <tr><td>Konsumsi</td><td class="text-right">${simulationState.consumption.toLocaleString('id-ID')} butir</td><td class="text-right">${formatCurrency(pCons)}</td></tr>
        `;

        const printContent = `
            <html>
                <head>
                    <title>Laporan Simulasi Pendapatan - ${companyInfo.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        h1, h2 { margin: 0; }
                        p { margin: 5px 0; color: #555; }
                        table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px;}
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .section { margin-bottom: 20px; }
                        .section-title { font-size: 14pt; font-weight: bold; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
                        .summary-table td { font-size: 12pt; }
                        .summary-table .label { font-weight: bold; }
                        .summary-table .value { text-align: right; font-weight: bold; }
                        .summary-table .profit { color: green; }
                        .summary-table .loss { color: red; }
                        .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Laporan Simulasi Pendapatan (${periodLabel})</h1>
                        <p>${companyInfo.name}</p>
                        <p>Dicetak pada: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: idLocale })}</p>
                    </div>

                    <div class="section">
                        <div class="section-title">Parameter Simulasi</div>
                        <table>
                            <tr><td width="50%">Total Bebek</td><td class="text-right">${simulationState.totalDucks.toLocaleString('id-ID')} ekor</td></tr>
                            <tr><td colspan="2"><b>Skema Pakan</b></td></tr>
                            ${feedSchemaHtml}
                             <tr><td><b>Total Skema</b></td><td class="text-right"><b>${totalSchemaFromInputs.toLocaleString('id-ID')} g</b></td></tr>
                            <tr><td colspan="2"><b>Hasil & Harga Telur / ${periodLabelShort}</b></td></tr>
                            ${eggHtml}
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">Hasil Simulasi</div>
                        <table class="summary-table">
                            <tr><td class="label">Total Hasil Telur / ${periodLabelShort}</td><td class="value">${eggYield.toLocaleString('id-ID')} butir</td></tr>
                            <tr><td class="label">Total Konsumsi Pakan / ${periodLabelShort}</td><td class="value">${totalFeedConsumptionKg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg</td></tr>
                            <tr><td class="label">Biaya Pakan / Kg</td><td class="value">${formatCurrency(averageFeedCostPerKg)}</td></tr>
                            <tr><td class="label">Total Biaya Pakan / ${periodLabelShort}</td><td class="value">${formatCurrency(totalFeedCost)}</td></tr>
                            <tr><td class="label">Pendapatan Kotor / ${periodLabelShort}</td><td class="value">${formatCurrency(grossIncome)}</td></tr>
                            <tr class="${netIncome >= 0 ? 'profit' : 'loss'}"><td class="label">Pendapatan Bersih / ${periodLabelShort}</td><td class="value">${formatCurrency(netIncome)}</td></tr>
                            <tr class="${projectedMonthlyIncome >= 0 ? 'profit' : 'loss'}"><td class="label">Proyeksi Pendapatan / Bulan</td><td class="value">${formatCurrency(projectedMonthlyIncome)}</td></tr>
                        </table>
                    </div>

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
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Kalkulator Simulasi Pendapatan</CardTitle>
                <CardDescription>
                    Gunakan alat ini untuk memproyeksikan pendapatan bersih dengan menyesuaikan parameter kunci.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className='space-y-2'>
                        <h3 className="text-lg font-semibold">Pilih Mode Simulasi</h3>
                        <div className="flex gap-2">
                             <Button onClick={() => setMode('daily')} variant="ghost" className={cn("w-full hover:bg-transparent", mode === 'daily' ? "text-primary font-bold" : "text-muted-foreground")}>Harian</Button>
                             <Button onClick={() => setMode('weekly')} variant="ghost" className={cn("w-full hover:bg-transparent", mode === 'weekly' ? "text-primary font-bold" : "text-muted-foreground")}>Mingguan</Button>
                             <Button onClick={() => setMode('monthly')} variant="ghost" className={cn("w-full hover:bg-transparent", mode === 'monthly' ? "text-primary font-bold" : "text-muted-foreground")}>Bulanan</Button>
                        </div>
                    </div>
                     {mode === 'weekly' && (
                        <div className="space-y-2">
                            <Label>Pilih Periode Mingguan</Label>
                            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih minggu dari tab Produksi..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedWeekKeys.length > 0 ? (
                                        sortedWeekKeys.map(periodKey => (
                                            <SelectItem key={periodKey} value={periodKey}>
                                                {periodKey}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground text-center">Tidak ada data mingguan di bulan ini.</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Separator />
                    <h3 className="text-lg font-semibold border-b pb-2">Parameter Simulasi</h3>
                    
                    <SimulationInput label="Total Bebek" id="totalDucks" value={simulationState.totalDucks} onChange={handleInputChange('totalDucks')} unit="ekor" className="h-16 text-[40px] font-bold" />
                    
                    <div>
                        <Label className="text-sm">Harga Pakan (dari Inventaris Aktif)</Label>
                        <div className="flex gap-2 overflow-x-auto p-1">
                             {activeFeedsForCalc.length > 0 ? (
                                activeFeedsForCalc.map(f => (
                                    <FeedPriceCard key={f.id} name={f.name} pricePerBag={f.pricePerBag} pricePerKg={f.pricePerKg} />
                                ))
                             ) : (
                                <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md w-full text-center">Tidak ada pakan aktif di inventaris.</div>
                             )}
                        </div>
                    </div>
                    
                    <div>
                        <Label className="text-sm mb-2 block">Skema Pakan (gram/ekor)</Label>
                         <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                            {activeFeedsForCalc.map(f => (
                                <div key={f.id}>
                                    <Label htmlFor={`schema-${f.id}`} className="text-xs text-muted-foreground">{f.name}</Label>
                                    <Input id={`schema-${f.id}`} type="number" value={simulationState.feedSchemas[f.id] || ''} onChange={handleSchemaChange(f.id)} className="h-9"/>
                                </div>
                            ))}
                         </div>
                         <div className="flex items-center gap-2 mt-3 p-2 bg-muted rounded-md">
                            <Inbox className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Total Skema Pakan:</span>
                            <span className="text-sm font-bold text-primary">{totalSchemaFromInputs.toLocaleString('id-ID')} g</span>
                         </div>
                    </div>

                    <Separator />
                    
                    <div>
                        <h4 className="font-medium mb-3">Input Kuantitas & Harga Telur ({periodLabelShort})</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                           <SimulationInput label="Telur Grade A" id="gradeA" value={simulationState.gradeA} onChange={handleInputChange('gradeA')} unit="butir" className="h-9" disabled={isDataAutoFilled} />
                           <SimulationInput label="Harga Grd. A" id="priceA" value={simulationState.priceA} onChange={handleInputChange('priceA')} className="h-9" disabled={isDataAutoFilled} />
                           
                           <SimulationInput label="Telur Grade B" id="gradeB" value={simulationState.gradeB} onChange={handleInputChange('gradeB')} unit="butir" className="h-9" disabled={isDataAutoFilled} />
                           <SimulationInput label="Harga Grd. B" id="priceB" value={simulationState.priceB} onChange={handleInputChange('priceB')} className="h-9" disabled={isDataAutoFilled} />

                           <SimulationInput label="Telur Grade C" id="gradeC" value={simulationState.gradeC} onChange={handleInputChange('gradeC')} unit="butir" className="h-9" disabled={isDataAutoFilled} />
                           <SimulationInput label="Harga Grd. C" id="priceC" value={simulationState.priceC} onChange={handleInputChange('priceC')} className="h-9" disabled={isDataAutoFilled} />

                           <SimulationInput label="Telur Konsumsi" id="consumption" value={simulationState.consumption} onChange={handleInputChange('consumption')} unit="butir" className="h-9" disabled={isDataAutoFilled} />
                           <SimulationInput label="Harga Konsumsi" id="priceConsumption" value={simulationState.priceConsumption} onChange={handleInputChange('priceConsumption')} className="h-9" disabled={isDataAutoFilled} />
                        </div>
                         {isDataAutoFilled && (
                             <div className="flex items-start text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 mt-3 rounded-md border border-blue-200 dark:border-blue-700/50">
                                <AlertCircle className="h-3 w-3 mr-2 mt-0.5 shrink-0" />
                                <span>Data kuantitas dan harga telur diambil secara otomatis dari tab Produksi. Input dinonaktifkan.</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-lg font-semibold">Hasil Simulasi</h3>
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={handlePrint} className="text-foreground hover:text-foreground bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                                            <Printer className="h-4 w-4" />
                                            <span className="sr-only">Cetak</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
                                        <p>Cetak</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Button variant="outline" size="sm" onClick={handleReset} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive">
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <ResultDisplay label={`Total Hasil Telur / ${periodLabelShort}`} value={`${eggYield.toLocaleString('id-ID')} butir`} icon={Egg} />
                        <ResultDisplay label={`Total Konsumsi Pakan / ${periodLabelShort}`} value={`${totalFeedConsumptionKg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg`} icon={Wheat} />
                        <ResultDisplay label="Biaya Pakan / Kg" value={formatCurrency(averageFeedCostPerKg)} icon={Scale} />
                        <ResultDisplay label={`Biaya Pakan / ${periodLabelShort}`} value={formatCurrency(totalFeedCost)} icon={ArrowRight} />
                        <ResultDisplay label={`Pendapatan Kotor / ${periodLabelShort}`} value={formatCurrency(grossIncome)} icon={DollarSign} />
                    </div>
                    <div className="space-y-3 pt-4 border-t">
                         <ResultDisplay label={`Pendapatan Bersih / ${periodLabelShort}`} value={formatCurrency(netIncome)} icon={DollarSign} isProfit={netIncome > 0} isLoss={netIncome < 0} />
                         <ResultDisplay label="Proyeksi Pendapatan / Bulan" value={formatCurrency(projectedMonthlyIncome)} icon={DollarSign} isProfit={projectedMonthlyIncome > 0} isLoss={projectedMonthlyIncome < 0} />
                    </div>
                    {simulationState.totalDucks === 0 && (
                        <div className="flex items-start text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-700/50">
                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                            <span>
                                Data awal diambil dari tab Populasi dan Pakan. Karena data masih kosong, simulasi menggunakan nilai default. Isi data di tab lain untuk simulasi yang lebih akurat.
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
