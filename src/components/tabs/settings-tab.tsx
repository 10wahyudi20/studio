
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
import { Upload, Download, Cloud, Trash2 } from "lucide-react";

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
  const { toast } = useToast();

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
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
          setInfo(state.companyInfo);
          setLogoPreview(state.companyInfo.logo);
          toast({ title: "Data Diimpor", description: "Aplikasi telah dimuat dengan data Anda." });
        } catch (error) {
          toast({ variant: "destructive", title: "Gagal Impor", description: "File JSON tidak valid." });
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

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Perusahaan</CardTitle>
          <CardDescription>Ubah detail perusahaan yang ditampilkan di header.</CardDescription>
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
          <Button onClick={handleSaveInfo}>Simpan Informasi</Button>
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
