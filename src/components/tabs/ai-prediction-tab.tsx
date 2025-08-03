
"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { predictEggProduction, PredictEggProductionInput, PredictEggProductionOutput } from "@/ai/flows/predict-egg-production";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Loader2, PlayCircle, Volume2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const predictionSchema = z.object({
  duckQuantity: z.coerce.number().min(1, "Jumlah bebek harus diisi"),
  duckAgeMonths: z.coerce.number().min(1, "Usia rata-rata harus diisi"),
  duckCondition: z.string().nonempty("Kondisi bebek harus dipilih"),
  feedQuality: z.string().nonempty("Kualitas pakan harus dipilih"),
  housingInformation: z.string().nonempty("Informasi kandang harus diisi"),
});

type PredictionFormData = z.infer<typeof predictionSchema>;

export default function AiPredictionTab() {
  const { ducks, companyInfo } = useAppStore();
  const [prediction, setPrediction] = React.useState<PredictEggProductionOutput | null>(null);
  const [audio, setAudio] = React.useState<TextToSpeechOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [audioError, setAudioError] = React.useState<string | null>(null);

  const totalDucks = ducks.reduce((sum, duck) => sum + duck.quantity, 0);
  const totalAge = ducks.reduce((sum, duck) => sum + (duck.quantity * duck.ageMonths), 0);
  const avgAge = totalDucks > 0 ? Math.round(totalAge / totalDucks) : 0;
  
  const { register, handleSubmit, control, formState: { errors } } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      duckQuantity: totalDucks,
      duckAgeMonths: avgAge,
      duckCondition: "healthy",
      feedQuality: "medium",
      housingInformation: "Kandang baterai dan umbaran, sirkulasi udara cukup baik, suhu rata-rata 28°C.",
    }
  });

  const onSubmit = async (data: PredictionFormData) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setAudio(null);
    setAudioError(null);
    try {
      const result = await predictEggProduction(data);
      setPrediction(result);
    } catch (e) {
      setError("Gagal menghasilkan prediksi. Silakan coba lagi.");
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
          setAudioError("Terlalu banyak permintaan. Coba lagi dalam satu menit.");
      } else {
          setAudioError("Gagal membuat audio.");
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Prediksi Produksi Telur</CardTitle>
          <CardDescription>
            Masukkan data untuk memprediksi jumlah produksi telur untuk hari berikutnya menggunakan AI.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duckQuantity">Jumlah Bebek</Label>
                <Input id="duckQuantity" type="number" {...register("duckQuantity")} />
                {errors.duckQuantity && <p className="text-sm text-destructive mt-1">{errors.duckQuantity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="duckAgeMonths">Rata-rata Usia Bebek (Bulan)</Label>
                <Input id="duckAgeMonths" type="number" {...register("duckAgeMonths")} />
                 {errors.duckAgeMonths && <p className="text-sm text-destructive mt-1">{errors.duckAgeMonths.message}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label>Kondisi Bebek</Label>
                <Controller name="duckCondition" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih kondisi" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="healthy">Sehat</SelectItem>
                            <SelectItem value="minor_sickness">Sakit Ringan</SelectItem>
                            <SelectItem value="major_sickness">Sakit Berat</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
              </div>
               <div className="space-y-2">
                <Label>Kualitas Pakan</Label>
                 <Controller name="feedQuality" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Pilih kualitas" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high">Tinggi</SelectItem>
                            <SelectItem value="medium">Sedang</SelectItem>
                            <SelectItem value="low">Rendah</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="housingInformation">Informasi Kandang & Lingkungan</Label>
                <Textarea id="housingInformation" {...register("housingInformation")} rows={4} />
                {errors.housingInformation && <p className="text-sm text-destructive mt-1">{errors.housingInformation.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              Hasilkan Prediksi
            </Button>
          </CardFooter>
        </form>
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
                        <p className="text-sm text-muted-foreground">Prediksi Produksi Besok</p>
                        <p className="text-5xl font-bold text-primary">{prediction.predictedEggProduction}</p>
                        <p className="font-medium">butir telur</p>
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
                        <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
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
