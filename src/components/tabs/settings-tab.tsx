
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, Download, Cloud, Trash2, Volume2, Loader2 } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech";

const ttsVoices = [
    { id: 'Algenib', name: 'Female 1' },
    { id: 'Antares', name: 'Male 1' },
    { id: 'Arcturus', name: 'Female 2' },
    { id: 'Capella', name: 'Male 2' },
    { id: 'Deneb', name: 'Female 3' },
    { id: 'Fomalhaut', name: 'Male 3' },
    { id: 'Hadar', name: 'Female 4' },
    { id: 'Izar', name: 'Male 4' },
];

export default function SettingsTab() {
  const {
    companyInfo,
    updateCompanyInfo,
    getFullState,
    loadFullState,
    resetState,
    setDirty
  } = useAppStore();
  
  const [info, setInfo] = React.useState(companyInfo);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(companyInfo.logo);
  const [audioPreview, setAudioPreview] = React.useState<TextToSpeechOutput | null>(null);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  const { toast } = useToast();

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };
  
  const handleVoiceChange = (voice: string) => {
    setInfo({ ...info, ttsVoice: voice });
  };

  const handlePreviewVoice = async () => {
      if (!info.ttsVoice) return;
      setIsPreviewing(true);
      setAudioPreview(null);
      try {
          const result = await textToSpeech({ text: "Ini adalah pratinjau suara yang dipilih.", voice: info.ttsVoice });
          setAudioPreview(result);
      } catch (error) {
          console.error("Gagal membuat pratinjau suara:", error);
          toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat membuat pratinjau suara." });
      } finally {
          setIsPreviewing(false);
      }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setInfo({ ...info, logo: result });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveInfo = () => {
    updateCompanyInfo(info);
    toast({ title: "Informasi Perusahaan Disimpan", description: "Data di header telah diperbarui." });
  };

  const handleExport = () => {
    const state = getFullState();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "clucksmart_backup.json";
    link.click();
    toast({ title: "Data Diekspor", description: "File backup telah diunduh." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target?.result as string);
          loadFullState(state);
          // Manually update local state after store hydration
          setInfo(useAppStore.getState().companyInfo);
          setLogoPreview(useAppStore.getState().companyInfo.logo);
          toast({ title: "Data Diimpor", description: "Aplikasi telah dimuat dengan data Anda." });
        } catch (error) {
          console.error("Import error:", error);
          toast({ variant: "destructive", title: "Gagal Impor", description: "File JSON tidak valid atau rusak." });
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };
  
  const handleReset = () => {
    resetState();
    // After reset, need to get the new initial state
    const newInitialState = useAppStore.getState().getInitialState();
    setInfo(newInitialState.companyInfo);
    setLogoPreview(newInitialState.companyInfo.logo);
    toast({ variant: "destructive", title: "Reset Berhasil", description: "Semua data telah dikosongkan." });
  }

  // Effect to update local state when global state changes (e.g., after import)
  React.useEffect(() => {
    setInfo(companyInfo);
    setLogoPreview(companyInfo.logo);
  }, [companyInfo]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
          <CardDescription>Ubah detail perusahaan dan preferensi aplikasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logoPreview && <Image src={logoPreview} alt="Logo" width={64} height={64} className="rounded-full bg-muted object-cover" data-ai-hint="duck logo" />}
            <div className="w-full">
              <Label htmlFor="logo">Ganti Logo</Label>
              <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="name">Nama Perusahaan</Label>
            <Input id="name" name="name" value={info.name} onChange={handleInfoChange} />
          </div>
          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" value={info.address} onChange={handleInfoChange} />
          </div>
          <div>
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input id="phone" name="phone" value={info.phone} onChange={handleInfoChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" value={info.email} onChange={handleInfoChange} />
          </div>
          
          <div className="space-y-2 pt-4 border-t">
              <Label>Suara Text-to-Speech</Label>
              <div className="flex items-center gap-2">
                  <Select value={info.ttsVoice} onValueChange={handleVoiceChange}>
                      <SelectTrigger>
                          <SelectValue placeholder="Pilih suara..." />
                      </SelectTrigger>
                      <SelectContent>
                          {ttsVoices.map(voice => (
                              <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={handlePreviewVoice} disabled={isPreviewing}>
                      {isPreviewing ? <Loader2 className="animate-spin" /> : <Volume2 />}
                  </Button>
              </div>
              {audioPreview && (
                  <audio controls autoPlay className="w-full h-10 mt-2">
                      <source src={audioPreview.media} type="audio/wav" />
                  </audio>
              )}
          </div>

          <Button onClick={handleSaveInfo}>Simpan Pengaturan</Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manajemen Data</CardTitle>
            <CardDescription>Simpan dan muat data aplikasi Anda.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Ekspor Data ke JSON
            </Button>
            <Button asChild variant="outline">
                <Label htmlFor="import" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Impor Data dari JSON
                    <Input id="import" type="file" accept=".json" className="hidden" onChange={handleImport} />
                </Label>
            </Button>
            <Button variant="outline" disabled>
              <Cloud className="mr-2 h-4 w-4" /> Simpan ke Mega Cloud
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Reset Semua Data
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Anda benar-benar yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Aksi ini akan menghapus semua data yang telah Anda masukkan (inventaris, produksi, keuangan, dll) secara permanen dan mengembalikan aplikasi ke keadaan kosong. Aksi ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">Ya, Reset Semua Data</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
