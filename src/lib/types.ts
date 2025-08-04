
export interface CompanyInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
    ttsVoice: string;
    username?: string;
    password?: string;
}

export interface Duck {
    cage: number;
    quantity: number;
    deaths: number;
    entryDate: Date;
    ageMonths: number;
    status: 'Bebek Bayah' | 'Bebek Petelur' | 'Bebek Tua' | 'Bebek Afkir';
    cageSize: string;
    cageSystem: 'baterai' | 'umbaran';
}

export interface DailyProduction {
    date: Date;
    totalEggs: number;
    productivity: number;
    perCage: { [cageNumber: number]: number };
}

export interface WeeklyProduction {
    id: number;
    week: number;
    buyer: string;
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

export interface AppState {
    companyInfo: CompanyInfo;
    ducks: Duck[];
    eggProduction: EggProduction;
    feed: Feed[];
    finance: Transaction[];
    isDirty: boolean;
    lastStockUpdate: string | null;
}
