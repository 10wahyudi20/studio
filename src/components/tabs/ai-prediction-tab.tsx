
"use client";

import React from "react";
import { predictEggProduction, PredictEggProductionInput, PredictEggProductionOutput } from "@/ai/flows/predict-egg-production";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Loader2, PlayCircle, Table, Info, Calendar as CalendarIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';


const DataDisplayCard = ({ title, data, columns, footerData }: { title: string, data: any[], columns: { header: string, accessor: string, format?: (value: any) => React.ReactNode }[], footerData?: React.ReactNode }) => (
    <div className="space-y-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <Card className="bg-muted/50">
            <CardContent className="p-3">
                {data.length > 0 ? (
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left">
                                {columns.map(col => <th key={col.header} className="p-1 font-medium text-muted-foreground">{col.header}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="border-t">
                                    {columns.map(col => (
                                        <td key={col.accessor} className="p-1">
                                            {col.format ? col.format(item[col.accessor]) : item[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {footerData && (
                            <tfoot>
                                {footerData}
                            </tfoot>
                        )}
                    </table>
                ) : (
                    <p className="text-xs text-center text-muted-foreground p-2">Tidak ada data.</p>
                )}
            </CardContent>
        </Card>
    </div>
);


export default function AiPredictionTab() {
  const { ducks, feed, eggProduction, companyInfo } = useAppStore();
  const { toast } = useToast();
  
  const [prediction, setPrediction] = React.useState<PredictEggProductionOutput | null>(null);
  const [audio, setAudio] = React.useState<TextToSpeechOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [audioError, setAudioError] = React.useState<string | null>(null);
  const [housingInfo, setHousingInfo] = React.useState("Kandang baterai dan umbaran, sirkulasi udara cukup baik, suhu rata-rata 28°C.");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 6),
  });

  const productionHistoryForAI = eggProduction.daily.slice(-30).map(d => ({
      date: format(new Date(d.date), 'yyyy-MM-dd'),
      totalEggs: d.totalEggs,
  }));

  const duckInfoForAI = ducks.map(d => ({
      cage: d.cage,
      quantity: d.quantity,
      ageMonths: d.ageMonths,
      cageSize: d.cageSize,
      cageSystem: d.cageSystem
  }));

  const lastDailyRecord = eggProduction.daily.at(-1);
  const productionInfoForAI = lastDailyRecord ? Object.entries(lastDailyRecord.perCage).map(([cage, production]) => {
      const duckInCage = ducks.find(d => String(d.cage) === cage);
      const productivity = (duckInCage && duckInCage.quantity > 0) ? (production / duckInCage.quantity) * 100 : 0;
      return {
          cage: Number(cage),
          production: production,
          productivity: parseFloat(productivity.toFixed(2))
      };
  }) : [];
  
  const totalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);

  const feedInfoForAI = feed.map(f => ({
      name: f.name,
      schema: f.schema,
      dailyConsumption: (totalDucks * f.schema) / 1000 // in Kg
  }));
  
  const totalSchema = feedInfoForAI.reduce((sum, f) => sum + f.schema, 0);
  const totalDailyConsumption = feedInfoForAI.reduce((sum, f) => sum + f.dailyConsumption, 0);

  const canPredict = duckInfoForAI.length > 0 && productionInfoForAI.length > 0 && feedInfoForAI.length > 0 && dateRange?.from && dateRange?.to;

  const handleSubmit = async () => {
    if (!canPredict) {
        toast({
            variant: "destructive",
            title: "Data Tidak Lengkap",
            description: "Pastikan ada data di Populasi, Produksi (minimal 1 hari), Pakan, dan rentang tanggal prediksi telah dipilih."
        });
        return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setAudio(null);
    setAudioError(null);

    try {
      const input: PredictEggProductionInput = {
        duckInfo: duckInfoForAI,
        productionInfo: productionInfoForAI,
        feedInfo: feedInfoForAI.map(({dailyConsumption, ...rest}) => rest), // Exclude dailyConsumption from AI input
        housingInformation: housingInfo,
        startDate: format(dateRange.from!, 'yyyy-MM-dd'),
        endDate: format(dateRange.to!, 'yyyy-MM-dd'),
      };
      const result = await predictEggProduction(input);
      setPrediction(result);
    } catch (e: any) {
      setError(`Gagal menghasilkan prediksi: ${e.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!prediction) return;
    
    setIsGeneratingAudio(true);
    setAudioError(null);
    setAudio(null);
    try {
      const audioResult = await textToSpeech({ text: prediction.reasoning, voice: companyInfo.ttsVoice });
      setAudio(audioResult);
    } catch (e: any) {
      console.error("Audio generation failed:", e);
      if (e.message?.includes('429')) {
          setAudioError("Terlalu banyak permintaan (Kuota API harian habis). Coba lagi dalam beberapa saat.");
      } else {
          setAudioError("Gagal membuat audio. Silakan coba lagi.");
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };
  
  const predictionDays = dateRange?.from && dateRange?.to ? (differenceInDays(dateRange.to, dateRange.from) + 1) : 0;


  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Prediksi Produksi Telur</CardTitle>
          <CardDescription>
            AI akan menganalisis data dari seluruh aplikasi untuk memprediksi produksi.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <DataDisplayCard
                    title="Informasi Populasi Bebek"
                    data={duckInfoForAI}
                    columns={[
                        { header: "Kdg", accessor: "cage" },
                        { header: "Jml", accessor: "quantity" },
                        { header: "Usia", accessor: "ageMonths" },
                        { header: "Ukuran", accessor: "cageSize" },
                        { header: "Sistem", accessor: "cageSystem" },
                    ]}
                />
                <DataDisplayCard
                    title={`Informasi Produksi (Data Terakhir)`}
                    data={productionInfoForAI}
                    columns={[
                        { header: "Kdg", accessor: "cage" },
                        { header: "Telur/Kandang", accessor: "production" },
                        { header: "Produktifitas (%)", accessor: "productivity" },
                    ]}
                />
                 <DataDisplayCard
                    title="Informasi Pakan"
                    data={feedInfoForAI}
                    columns={[
                        { header: "Nama Pakan", accessor: "name" },
                        { header: "Skema (g)", accessor: "schema" },
                        { 
                            header: "Pakan/Hari (Kg)", 
                            accessor: "dailyConsumption",
                            format: (value) => `${value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg`
                        },
                    ]}
                    footerData={
                        <tr className="border-t font-bold">
                            <td className="p-1">Total</td>
                            <td className="p-1">{totalSchema} g</td>
                            <td className="p-1">{totalDailyConsumption.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kg</td>
                        </tr>
                    }
                />
                <div className="space-y-2">
                    <Label htmlFor="housingInformation" className="font-semibold text-sm">Informasi Kandang & Lingkungan (Opsional)</Label>
                    <Textarea id="housingInformation" value={housingInfo} onChange={(e) => setHousingInfo(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="predictionDateRange" className="font-semibold text-sm">Rentang Tanggal Prediksi</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="predictionDateRange"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "dd LLL, y")} -{" "}
                                    {format(dateRange.to, "dd LLL, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "dd LLL, y")
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
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSubmit} disabled={isLoading || !canPredict}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              Hasilkan Prediksi
            </Button>
            {!canPredict && (
                <Alert variant="destructive" className="ml-4 text-xs">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Data Kurang</AlertTitle>
                    <AlertDescription>Data dari Populasi, Produksi, dan Pakan dibutuhkan, serta rentang tanggal harus dipilih.</AlertDescription>
                </Alert>
            )}
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <Card className="sticky top-24">
           <CardHeader>
            <CardTitle>Hasil Prediksi AI</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">AI sedang berpikir...</p>
              </div>
            )}
            {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {!isLoading && !error && !prediction && (
                 <div className="text-center text-muted-foreground h-48 flex items-center justify-center">
                    <p>Hasil prediksi akan muncul di sini.</p>
                </div>
            )}
            {prediction && (
                <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Prediksi Produksi ({predictionDays} Hari)</p>
                        <p className="text-5xl font-bold text-primary">{prediction.totalPredictedProduction.toLocaleString('id-ID')}</p>
                        <p className="font-medium">butir telur</p>
                    </div>
                    
                    <div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b">
                                    <th className="p-2 font-medium text-muted-foreground">Tanggal</th>
                                    <th className="p-2 font-medium text-muted-foreground text-right">Prediksi Telur</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prediction.dailyPredictions.map((dailyPred) => (
                                    <tr key={dailyPred.day} className="border-b">
                                        <td className="p-2">{dailyPred.day}</td>
                                        <td className="p-2 text-right font-medium">{dailyPred.predictedEggs.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Separator />
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">Alasan Prediksi:</h4>
                             <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio} variant="ghost" size="icon">
                                {isGeneratingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
                                <span className="sr-only">Putar Audio</span>
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prediction.reasoning}</p>
                        {audioError && <Alert variant="destructive" className="mt-2"><AlertDescription>{audioError}</AlertDescription></Alert>}
                        {audio && (
                            <audio controls autoPlay className="w-full h-8 mt-2">
                                <source src={audio.media} type="audio/wav" />
                                Browser Anda tidak mendukung elemen audio.
                            </audio>
                        )}
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
