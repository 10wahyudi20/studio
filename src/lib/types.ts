

import type { PredictEggProductionOutput } from "@/ai/flows/predict-egg-production";

export interface CompanyInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
    ttsVoice: string;
    username?: string;
    password?: string;
    loginBackground?: string;
    megaUsername?: string;
    megaPassword?: string;
}

export interface Duck {
    id: number;
    cage: number;
    quantity: number;
    deaths: number;
    entryDate: Date;
    ageMonths: number;
    status: 'Bebek Bayah' | 'Bebek Petelur' | 'Bebek Tua' | 'Bebek Afkir';
    cageSize: string;
    cageSystem: 'baterai' | 'umbaran';
}

export type DuckUpdate = Partial<Omit<Duck, 'id' | 'ageMonths' | 'status' | 'cageSize'>> & {
  cageSizeLength?: number;
  cageSizeWidth?: number;
  entryDate?: Date;
};


export interface DailyProduction {
    date: Date;
    totalEggs: number;
    productivity: number;
    perCage: { [cageNumber: number]: number };
}

export interface WeeklyProduction {
    id: number;
    startDate: Date;
    endDate: Date;
    buyer: string;
    description: string;
    gradeA: number;
    gradeB: number;
    gradeC: number;
    consumption: number;
    priceA: number;
    priceB: number;
    priceC: number;
    priceConsumption: number;
    totalEggs: number;
    totalValue: number;
}

export interface MonthlyProduction {
    month: string;
    gradeA: number;
    gradeB: number;
    gradeC: number;
    consumption: number;
    totalEggs: number;
}

export interface EggProduction {
    daily: DailyProduction[];
    weekly: WeeklyProduction[];
    monthly: MonthlyProduction[];
}

export interface Feed {
    id: number;
    name: string;
    supplier: string;
    lastUpdated: Date;
    stock: number;
    pricePerBag: number;
    pricePerKg: number;
    schema: number;
}

export interface Transaction {
    id: number;
    date: Date;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    type: 'debit' | 'credit';
}

export interface DeathRecord {
    id: number;
    date: Date;
    cage: number;
    quantity: number;
    notes?: string;
}

export interface DeathRecordInput extends Omit<DeathRecord, 'id'> {}

export interface AppState {
    companyInfo: CompanyInfo;
    ducks: Duck[];
    eggProduction: EggProduction;
    feed: Feed[];
    finance: Transaction[];
    deathRecords: DeathRecord[];
    isDirty: boolean;
    isAuthenticated: boolean;
    isOnline: boolean;
    lastStockUpdate: string | null;
    activeTab: string;
    lastPrediction: PredictEggProductionOutput | null;
}
