
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HomeTab from "@/components/tabs/home-tab";
import PopulationTab from "@/components/tabs/population-tab";
import ProductionTab from "@/components/tabs/production-tab";
import FeedTab from "@/components/tabs/feed-tab";
import FinanceTab from "@/components/tabs/finance-tab";
import ReportsTab from "@/components/tabs/reports-tab";
import AiPredictionTab from "@/components/tabs/ai-prediction-tab";
import SettingsTab from "@/components/tabs/settings-tab";
import { useAppStore } from "@/hooks/use-app-store";
import { Toaster } from "@/components/ui/toaster";

export default function ClientPage() {
  const loadState = useAppStore(state => state.loadState);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    loadState();
    setIsMounted(true);
  }, [loadState]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-primary">Memuat CluckSmart...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow">
        <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-sm -mt-1 pt-1">
          <Tabs defaultValue="home" className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="population">Populasi Bebek</TabsTrigger>
              <TabsTrigger value="production">Produksi Telur</TabsTrigger>
              <TabsTrigger value="feed">Manajemen Pakan</TabsTrigger>
              <TabsTrigger value="finance">Analisis Keuangan</TabsTrigger>
              <TabsTrigger value="reports">Laporan</TabsTrigger>
              <TabsTrigger value="ai">Prediksi AI</TabsTrigger>
              <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="home"><HomeTab /></TabsContent>
              <TabsContent value="population"><PopulationTab /></TabsContent>
              <TabsContent value="production"><ProductionTab /></TabsContent>
              <TabsContent value="feed"><FeedTab /></TabsContent>
              <TabsContent value="finance"><FinanceTab /></TabsContent>
              <TabsContent value="reports"><ReportsTab /></TabsContent>
              <TabsContent value="ai"><AiPredictionTab /></TabsContent>
              <TabsContent value="settings"><SettingsTab /></TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
