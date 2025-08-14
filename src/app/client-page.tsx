
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
import { Separator } from "@/components/ui/separator";
import { Home, Users, Egg, Wheat, DollarSign, FileText, Sparkles, Settings } from "lucide-react";

export default function ClientPage() {
  const { activeTab, setActiveTab } = useAppStore(state => ({
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
  }));
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl font-semibold text-primary">Memuat CluckSmart...</div>
      </div>
    );
  }

  const NavLink = ({ value, icon: Icon, label }: { value: string, icon: React.ElementType, label: string }) => (
    <TabsTrigger value={value} className="flex flex-col sm:flex-row items-center gap-1.5 h-full">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </TabsTrigger>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <Header />
      <main className="flex-grow">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <div className="sticky top-20 z-40 -mt-1 pt-1 pb-2 bg-background/80 backdrop-blur-sm">
            <div className="px-4 sm:px-6 lg:px-8">
                <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 bg-transparent p-0 gap-y-2">
                  <NavLink key="home" value="home" icon={Home} label="Home" />
                  <NavLink key="population" value="population" icon={Users} label="Populasi" />
                  <NavLink key="production" value="production" icon={Egg} label="Produksi" />
                  <NavLink key="feed" value="feed" icon={Wheat} label="Pakan" />
                  <NavLink key="finance" value="finance" icon={DollarSign} label="Keuangan" />
                  <NavLink key="reports" value="reports" icon={FileText} label="Laporan" />
                  <NavLink key="ai" value="ai" icon={Sparkles} label="Prediksi AI" />
                  <NavLink key="settings" value="settings" icon={Settings} label="Pengaturan" />
                </TabsList>
            </div>
            <Separator className="mt-2" />
          </div>
          <div className="mt-4 px-4 sm:px-6 lg:px-8 pb-8">
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
      </main>
      <Footer />
      {/* Defer Toaster rendering to client-side only */}
      {isMounted && <Toaster />}
    </div>
  );
}
