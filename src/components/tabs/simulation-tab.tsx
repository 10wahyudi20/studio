
"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowRight, DollarSign, Egg, Users, Wheat, RefreshCw, Package, Inbox } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import type { Feed } from '@/lib/types';

const SimulationInput = ({ label, id, value, onChange, unit, ...props }: { label: string, id: string, value: number | string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-2">
        <Label htmlFor={id} className="text-sm">{label}</Label>
        <div className="flex items-center">
            <Input id={id} type="number" value={value} onChange={onChange} className="h-9 text-primary font-semibold" {...props} />
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
    const { ducks, feed } = useAppStore();

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

    useEffect(() => {
        setSimulationState(getInitialState());
    }, [ducks, feed]);

    const handleReset = () => {
        setSimulationState(getInitialState());
    };

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

    // Calculations
    const activeFeedsForCalc = feed.filter(f => f.stock > 0);
    const eggYield = simulationState.gradeA + simulationState.gradeB + simulationState.gradeC + simulationState.consumption;
    
    const totalSchemaFromInputs = Object.values(simulationState.feedSchemas).reduce((sum, schema) => sum + (schema || 0), 0);
    const totalFeedConsumptionKg = (simulationState.totalDucks * totalSchemaFromInputs) / 1000;
    
    const totalFeedCostPerDay = activeFeedsForCalc.reduce((sum, item) => {
        const schemaForThisFeed = simulationState.feedSchemas[item.id] || 0;
        const consumptionForThisFeedKg = (simulationState.totalDucks * schemaForThisFeed) / 1000;
        return sum + (consumptionForThisFeedKg * item.pricePerKg);
    }, 0);
    
    const pA = typeof simulationState.priceA === 'number' ? simulationState.priceA : 0;
    const pB = typeof simulationState.priceB === 'number' ? simulationState.priceB : 0;
    const pC = typeof simulationState.priceC === 'number' ? simulationState.priceC : 0;
    const pCons = typeof simulationState.priceConsumption === 'number' ? simulationState.priceConsumption : 0;

    const grossIncomePerDay = (simulationState.gradeA * pA) + (simulationState.gradeB * pB) + (simulationState.gradeC * pC) + (simulationState.consumption * pCons);
    const netIncomePerDay = grossIncomePerDay - totalFeedCostPerDay;
    const netIncomePerMonth = netIncomePerDay * 30;

    const formatCurrency = (value: number) => {
        return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Kalkulator Simulasi Pendapatan</CardTitle>
                        <CardDescription>
                            Gunakan alat ini untuk memproyeksikan pendapatan bersih dengan menyesuaikan parameter kunci.
                        </CardDescription>
                    </div>
                     <Button variant="outline" size="sm" onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset Simulasi
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Parameter Simulasi</h3>
                    
                    <SimulationInput label="Total Bebek" id="totalDucks" value={simulationState.totalDucks} onChange={handleInputChange('totalDucks')} unit="ekor" />
                    
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
                                    <Input id={`schema-${f.id}`} type="number" value={simulationState.feedSchemas[f.id] || ''} onChange={handleSchemaChange(f.id)} />
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
                        <h4 className="font-medium mb-3">Input Kuantitas & Harga Telur Harian</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                           <SimulationInput label="Telur Grade A" id="gradeA" value={simulationState.gradeA} onChange={handleInputChange('gradeA')} unit="butir" />
                           <SimulationInput label="Harga Grd. A" id="priceA" value={simulationState.priceA} onChange={handleInputChange('priceA')} />
                           
                           <SimulationInput label="Telur Grade B" id="gradeB" value={simulationState.gradeB} onChange={handleInputChange('gradeB')} unit="butir" />
                           <SimulationInput label="Harga Grd. B" id="priceB" value={simulationState.priceB} onChange={handleInputChange('priceB')} />

                           <SimulationInput label="Telur Grade C" id="gradeC" value={simulationState.gradeC} onChange={handleInputChange('gradeC')} unit="butir" />
                           <SimulationInput label="Harga Grd. C" id="priceC" value={simulationState.priceC} onChange={handleInputChange('priceC')} />

                           <SimulationInput label="Telur Konsumsi" id="consumption" value={simulationState.consumption} onChange={handleInputChange('consumption')} unit="butir" />
                           <SimulationInput label="Harga Konsumsi" id="priceConsumption" value={simulationState.priceConsumption} onChange={handleInputChange('priceConsumption')} />
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Hasil Simulasi</h3>
                    <div className="space-y-3">
                        <ResultDisplay label="Total Hasil Telur / Hari" value={`${eggYield.toLocaleString('id-ID')} butir`} icon={Egg} />
                        <ResultDisplay label="Total Konsumsi Pakan / Hari" value={`${totalFeedConsumptionKg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg`} icon={Wheat} />
                        <ResultDisplay label="Biaya Pakan / Hari" value={formatCurrency(totalFeedCostPerDay)} icon={ArrowRight} />
                        <ResultDisplay label="Pendapatan Kotor / Hari" value={formatCurrency(grossIncomePerDay)} icon={DollarSign} />
                    </div>
                    <div className="space-y-3 pt-4 border-t">
                         <ResultDisplay label="Pendapatan Bersih / Hari" value={formatCurrency(netIncomePerDay)} icon={DollarSign} isProfit={netIncomePerDay > 0} isLoss={netIncomePerDay < 0} />
                         <ResultDisplay label="Pendapatan Bersih / Bulan" value={formatCurrency(netIncomePerMonth)} icon={DollarSign} isProfit={netIncomePerMonth > 0} isLoss={netIncomePerMonth < 0} />
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
