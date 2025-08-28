
"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowRight, DollarSign, Egg, Users, Wheat } from 'lucide-react';
import { Separator } from '../ui/separator';

const SimulationInput = ({ label, id, value, onChange, unit, ...props }: { label: string, id: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
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

export default function SimulationTab() {
    const { ducks, feed } = useAppStore();

    const initialTotalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
    const activeFeeds = feed.filter(f => f.stock > 0);
    const initialFeedSchema = activeFeeds.length > 0 ? activeFeeds.reduce((sum, f) => sum + f.schema, 0) / activeFeeds.length : 150;
    const initialFeedPrice = activeFeeds.length > 0 ? activeFeeds.reduce((sum, f) => sum + f.pricePerBag, 0) / activeFeeds.length : 400000;

    const [totalDucks, setTotalDucks] = useState(initialTotalDucks);
    const [feedSchema, setFeedSchema] = useState(initialFeedSchema);
    const [feedPricePer50Kg, setFeedPricePer50Kg] = useState(initialFeedPrice);
    
    const [gradeA, setGradeA] = useState(0);
    const [gradeB, setGradeB] = useState(0);
    const [gradeC, setGradeC] = useState(0);
    const [consumption, setConsumption] = useState(0);

    const [priceA, setPriceA] = useState(2500);
    const [priceB, setPriceB] = useState(2400);
    const [priceC, setPriceC] = useState(2300);
    const [priceConsumption, setPriceConsumption] = useState(2000);

    useEffect(() => {
        const newTotalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
        const newActiveFeeds = feed.filter(f => f.stock > 0);
        const newFeedSchema = newActiveFeeds.length > 0 ? newActiveFeeds.reduce((sum, f) => sum + f.schema, 0) / newActiveFeeds.length : 150;
        const newFeedPrice = newActiveFeeds.length > 0 ? newActiveFeeds.reduce((sum, f) => sum + f.pricePerBag, 0) / newActiveFeeds.length : 400000;

        setTotalDucks(newTotalDucks);
        setFeedSchema(Math.round(newFeedSchema));
        setFeedPricePer50Kg(Math.round(newFeedPrice));
    }, [ducks, feed]);


    // Calculations
    const eggYield = gradeA + gradeB + gradeC + consumption;
    const feedPricePerKg = feedPricePer50Kg / 50;
    const totalFeedConsumptionKg = (totalDucks * feedSchema) / 1000;
    const totalFeedCostPerDay = totalFeedConsumptionKg * feedPricePerKg;
    const grossIncomePerDay = (gradeA * priceA) + (gradeB * priceB) + (gradeC * priceC) + (consumption * priceConsumption);
    const netIncomePerDay = grossIncomePerDay - totalFeedCostPerDay;
    const netIncomePerMonth = netIncomePerDay * 30;

    const formatCurrency = (value: number) => {
        return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kalkulator Simulasi Pendapatan</CardTitle>
                <CardDescription>
                    Gunakan alat ini untuk memproyeksikan pendapatan bersih harian Anda dengan menyesuaikan parameter kunci.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Parameter Simulasi</h3>
                    
                    <SimulationInput label="Total Bebek" id="totalDucks" value={totalDucks} onChange={(e) => setTotalDucks(Number(e.target.value))} unit="ekor" />
                    <SimulationInput label="Skema Pakan" id="feedSchema" value={feedSchema} onChange={(e) => setFeedSchema(Number(e.target.value))} unit="gram/ekor" />
                    <SimulationInput label="Harga Pakan / 50 Kg" id="feedPrice" value={feedPricePer50Kg} onChange={(e) => setFeedPricePer50Kg(Number(e.target.value))} />
                    
                    <Separator />
                    
                    <div>
                        <h4 className="font-medium mb-3">Input Kuantitas & Harga Telur</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                           <SimulationInput label="Telur Grade A" id="gradeA" value={gradeA} onChange={(e) => setGradeA(Number(e.target.value))} unit="butir" />
                           <SimulationInput label="Harga Grd. A" id="priceA" value={priceA} onChange={(e) => setPriceA(Number(e.target.value))} />
                           
                           <SimulationInput label="Telur Grade B" id="gradeB" value={gradeB} onChange={(e) => setGradeB(Number(e.target.value))} unit="butir" />
                           <SimulationInput label="Harga Grd. B" id="priceB" value={priceB} onChange={(e) => setPriceB(Number(e.target.value))} />

                           <SimulationInput label="Telur Grade C" id="gradeC" value={gradeC} onChange={(e) => setGradeC(Number(e.target.value))} unit="butir" />
                           <SimulationInput label="Harga Grd. C" id="priceC" value={priceC} onChange={(e) => setPriceC(Number(e.target.value))} />

                           <SimulationInput label="Telur Konsumsi" id="consumption" value={consumption} onChange={(e) => setConsumption(Number(e.target.value))} unit="butir" />
                           <SimulationInput label="Harga Konsumsi" id="priceConsumption" value={priceConsumption} onChange={(e) => setPriceConsumption(Number(e.target.value))} />
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
                    {initialTotalDucks === 0 && (
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
