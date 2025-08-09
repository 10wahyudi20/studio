
"use client";

import React from "react";
import { useAppStore } from "@/hooks/use-app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, Download, Cloud, Trash2, Volume2, Loader2, Eye, EyeOff, ShieldCheck, ChevronRight } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { textToSpeech, TextToSpeechOutput } from "@/ai/flows/text-to-speech";
import { Alert, AlertDescription, AlertTitle as AlertTitleComponent } from "@/components/ui/alert";
import { Separator } from "../ui/separator";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ttsVoices = [
    { id: 'algenib', name: 'Female 1 (Algenib)' },
    { id: 'rasalgethi', name: 'Female 2 (Rasalgethi)' },
    { id: 'schedar', name: 'Female 3 (Schedar)' },
    { id: 'vindemiatrix', name: 'Female 4 (Vindemiatrix)' },
    { id: 'achernar', name: 'Male 1 (Achernar)' },
    { id: 'gacrux', name: 'Male 2 (Gacrux)' },
    { id: 'sadaltager', name: 'Male 3 (Sadaltager)' },
    { id: 'zubenelgenubi', name: 'Male 4 (Zubenelgenubi)' },
];


const MegaCloudAuthDialog = () => {
    const { companyInfo } = useAppStore();
    const { toast } = useToast();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isAuthSuccessful, setIsAuthSuccessful] = React.useState(false);

    const isMegaConfigured = !!companyInfo.megaUsername && !!companyInfo.megaPassword;

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state on close
            setUsername('');
            setPassword('');
            setShowPassword(false);
            setIsAuthSuccessful(false);
        }
    };

    const handleInitialAuth = () => {
        if (!companyInfo.megaUsername || !companyInfo.megaPassword) {
            toast({ variant: "destructive", title: "Gagal", description: "Kredensial Mega Cloud belum diatur di Pengaturan." });
            return;
        }

        if (username === companyInfo.megaUsername && password === companyInfo.megaPassword) {
            setIsAuthSuccessful(true);
            toast({ title: "Otentikasi Berhasil!", description: "Silakan periksa peringatan sebelum melanjutkan." });
        } else {
            toast({ variant: "destructive", title: "Gagal", description: "Username atau password Mega Cloud salah." });
        }
    };
    
    const handleContinueToMega = () => {
        window.open('https://mega.nz/', '_blank');
        handleOpenChange(false);
    };

    const buttonStyles = cn(
        "w-full",
        isMegaConfigured && "bg-green-600 hover:bg-green-700 text-white"
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant={isMegaConfigured ? "default" : "outline"} className={buttonStyles}>
                    <Cloud className="mr-2 h-4 w-4" /> Buka Akun Mega Cloud
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 {!isAuthSuccessful ? (
                     <>
                        <DialogHeader>
                            <DialogTitle>Otentikasi Mega Cloud</DialogTitle>
                            <DialogDescription>Masukkan kredensial Anda untuk membuka Mega Cloud.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="mega-username">Username</Label>
                                <Input id="mega-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username Mega Anda" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mega-password-dialog">Password</Label>
                                <div className="relative">
                                    <Input id="mega-password-dialog" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password Mega Anda" />
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        <span className="sr-only">{showPassword ? "Sembunyikan" : "Tampilkan"} password</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Batal</Button>
                            </DialogClose>
                            <Button onClick={handleInitialAuth}>Verifikasi</Button>
                        </DialogFooter>
                     </>
                 ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                               <ShieldCheck className="h-6 w-6 text-green-500"/> Peringatan Keamanan
                            </DialogTitle>
                            <DialogDescription>
                                Pastikan Anda sudah **keluar (logout)** dari akun Mega Cloud lain di browser Anda sebelum melanjutkan. Browser mungkin akan menampilkan akun yang sudah login sebelumnya.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                             <Button type="button" variant="secondary" onClick={() => setIsAuthSuccessful(false)}>Kembali</Button>
                             <Button onClick={handleContinueToMega}>Lanjutkan ke Mega Cloud</Button>
                        </DialogFooter>
                    </>
                 )}
            </DialogContent>
        </Dialog>
    );
};


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
  const [backgroundPreview, setBackgroundPreview] = React.useState<string | null>(companyInfo.loginBackground || null);
  const [audioPreview, setAudioPreview] = React.useState<TextToSpeechOutput | null>(null);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [audioError, setAudioError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showMegaPassword, setShowMegaPassword] = React.useState(false);
  const [isAppCredsOpen, setIsAppCredsOpen] = React.useState(false);
  const [isMegaCredsOpen, setIsMegaCredsOpen] = React.useState(false);


  const { toast } = useToast();

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };
  
  const handleVoiceChange = (voice: string) => {
    setInfo({ ...info, ttsVoice: voice });
    setAudioPreview(null);
    setAudioError(null);
  };

  const handlePreviewVoice = async () => {
      if (!info.ttsVoice) return;
      setIsPreviewing(true);
      setAudioPreview(null);
      setAudioError(null);
      try {
          const result = await textToSpeech({ text: "Ini adalah pratinjau suara yang dipilih.", voice: info.ttsVoice });
          setAudioPreview(result);
      } catch (error: any) {
          console.error("Gagal membuat pratinjau suara:", error);
          if (error.message?.includes('429')) {
            setAudioError("Kuota API harian untuk pratinjau suara telah habis. Silakan coba lagi besok.");
          } else {
            setAudioError("Gagal membuat pratinjau suara. Coba lagi.");
          }
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

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBackgroundPreview(result);
        setInfo({ ...info, loginBackground: result });
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
    link.download = `clucksmart_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    if (companyInfo.megaUsername && companyInfo.megaPassword) {
        toast({ 
            title: "Data Diekspor", 
            description: "File backup telah diunduh. Jangan lupa unggah ke Mega Cloud untuk cadangan." 
        });
    } else {
        toast({ title: "Data Diekspor", description: "File backup telah diunduh." });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target?.result as string);
          loadFullState(state);
          // Manually update local state after store hydration
          const newCompanyInfo = useAppStore.getState().companyInfo;
          setInfo(newCompanyInfo);
          setLogoPreview(newCompanyInfo.logo);
          setBackgroundPreview(newCompanyInfo.loginBackground || null);
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
    setBackgroundPreview(newInitialState.companyInfo.loginBackground || null);
    toast({ variant: "destructive", title: "Reset Berhasil", description: "Semua data telah dikosongkan." });
  }

  // Effect to update local state when global state changes (e.g., after import)
  React.useEffect(() => {
    setInfo(companyInfo);
    setLogoPreview(companyInfo.logo);
    setBackgroundPreview(companyInfo.loginBackground || null);
  }, [companyInfo]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
          <CardDescription>Ubah detail perusahaan dan preferensi aplikasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Logo Perusahaan</Label>
              <div className="h-24 w-full bg-muted rounded-lg flex items-center justify-center p-2">
                <Image src={logoPreview || "https://placehold.co/96x96.png"} alt="Logo" width={96} height={96} className="rounded-lg object-contain max-h-full max-w-full" data-ai-hint="duck logo" />
              </div>
              <div>
                <Label htmlFor="logo" className="sr-only">Ganti Logo</Label>
                <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
              </div>
            </div>
             <div className="space-y-2">
              <Label>Latar Belakang Halaman Login</Label>
               <div className="h-24 w-full bg-muted rounded-lg flex items-center justify-center p-2">
                <Image src={backgroundPreview || "https://placehold.co/256x96.png"} alt="Login Background Preview" width={256} height={96} className="rounded-lg object-contain max-h-full max-w-full" data-ai-hint="farm landscape" />
              </div>
              <div>
                  <Label htmlFor="loginBackground" className="sr-only">Ganti Latar Belakang</Label>
                  <Input id="loginBackground" type="file" accept="image/*" onChange={handleBackgroundChange} />
              </div>
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

          <Separator />
          
          <Collapsible open={isAppCredsOpen} onOpenChange={setIsAppCredsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex justify-between items-center w-full py-2 font-semibold">
                <span>Kredensial Aplikasi</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isAppCredsOpen && "rotate-90")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
               <div>
                <Label htmlFor="username">Username Aplikasi</Label>
                <Input id="username" name="username" value={info.username || ''} onChange={handleInfoChange} />
              </div>
              <div>
                <Label htmlFor="password">Password Aplikasi</Label>
                <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} value={info.password || ''} onChange={handleInfoChange} />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? "Sembunyikan" : "Tampilkan"} password</span>
                    </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <Separator />

          <Collapsible open={isMegaCredsOpen} onOpenChange={setIsMegaCredsOpen}>
             <CollapsibleTrigger asChild>
              <button className="flex justify-between items-center w-full py-2 font-semibold">
                <span>Kredensial Mega Cloud</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isMegaCredsOpen && "rotate-90")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
               <div>
                <Label htmlFor="megaUsername">Username Mega Cloud</Label>
                <Input id="megaUsername" name="megaUsername" value={info.megaUsername || ''} onChange={handleInfoChange} />
              </div>
              <div>
                <Label htmlFor="megaPassword">Password Mega Cloud</Label>
                <div className="relative">
                    <Input id="megaPassword" name="megaPassword" type={showMegaPassword ? "text" : "password"} value={info.megaPassword || ''} onChange={handleInfoChange} />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={() => setShowMegaPassword(!showMegaPassword)}>
                        {showMegaPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showMegaPassword ? "Sembunyikan" : "Tampilkan"} password</span>
                    </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <div className="space-y-2 pt-2">
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
              {audioError && <Alert variant="destructive" className="mt-2"><AlertDescription>{audioError}</AlertDescription></Alert>}
              {audioPreview && (
                  <audio controls autoPlay className="w-full h-10 mt-2">
                      <source src={audioPreview.media} type="audio/wav" />
                  </audio>
              )}
          </div>

          <Button onClick={handleSaveInfo} className="w-full">Simpan Pengaturan</Button>
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
            <MegaCloudAuthDialog />
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Reset Semua Data
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Anda benar-benar yakin?</AlertDialogTitle>
                    <AlertDialogDesc>
                        Aksi ini akan menghapus semua data yang telah Anda masukkan (inventaris, produksi, keuangan, dll) secara permanen dan mengembalikan aplikasi ke keadaan kosong. Aksi ini tidak dapat dibatalkan.
                    </AlertDialogDesc>
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
