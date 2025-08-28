
"use client";

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/hooks/use-app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowRight, DollarSign, Egg, Users, Wheat } from 'lucide-react';

const SimulationInput = ({ label, id, value, onChange, unit, ...props }: { label: string, id: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center">
            <Input id={id} type="number" value={value} onChange={onChange} className="text-primary font-semibold" {...props} />
            {unit && <span className="ml-2 text-muted-foreground">{unit}</span>}
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

    // Initialize state with sensible defaults or derived values
    const initialTotalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
    const activeFeeds = feed.filter(f => f.stock > 0);
    const initialFeedSchema = activeFeeds.length > 0 ? activeFeeds.reduce((sum, f) => sum + f.schema, 0) / activeFeeds.length : 150;
    const initialFeedPrice = activeFeeds.length > 0 ? activeFeeds.reduce((sum, f) => sum + f.pricePerBag, 0) / activeFeeds.length : 400000;

    const [eggPercentage, setEggPercentage] = useState(80);
    const [totalDucks, setTotalDucks] = useState(initialTotalDucks);
    const [feedSchema, setFeedSchema] = useState(initialFeedSchema);
    const [feedPricePer50Kg, setFeedPricePer50Kg] = useState(initialFeedPrice);
    const [eggPrice, setEggPrice] = useState(2500);

    // Update state if store changes (e.g., after initial load)
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
    const eggYield = Math.floor(totalDucks * (eggPercentage / 100));
    const feedPricePerKg = feedPricePer50Kg / 50;
    const totalFeedConsumptionKg = (totalDucks * feedSchema) / 1000;
    const totalFeedCostPerDay = totalFeedConsumptionKg * feedPricePerKg;
    const grossIncomePerDay = eggYield * eggPrice;
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
                    <div className="space-y-4">
                        <Label htmlFor="eggPercentage">Persentase Telur ({eggPercentage}%)</Label>
                        <Slider
                            id="eggPercentage"
                            min={0}
                            max={100}
                            step={1}
                            value={[eggPercentage]}
                            onValueChange={(value) => setEggPercentage(value[0])}
                        />
                    </div>
                    <SimulationInput label="Total Bebek" id="totalDucks" value={totalDucks} onChange={(e) => setTotalDucks(Number(e.target.value))} unit="ekor" />
                    <SimulationInput label="Skema Pakan" id="feedSchema" value={feedSchema} onChange={(e) => setFeedSchema(Number(e.target.value))} unit="gram/ekor" />
                    <SimulationInput label="Harga Pakan / 50 Kg" id="feedPrice" value={feedPricePer50Kg} onChange={(e) => setFeedPricePer50Kg(Number(e.target.value))} />
                    <SimulationInput label="Harga Jual Telur" id="eggPrice" value={eggPrice} onChange={(e) => setEggPrice(Number(e.target.value))} unit="/butir" />
                </div>
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Hasil Simulasi</h3>
                    <div className="space-y-3">
                        <ResultDisplay label="Hasil Telur / Hari" value={`${eggYield.toLocaleString('id-ID')} butir`} icon={Egg} />
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
