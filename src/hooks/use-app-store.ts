
import { create } from 'zustand';
import { AppState, Duck, Transaction, Feed, DailyProduction, WeeklyProduction, MonthlyProduction } from '@/lib/types';
import { format } from 'date-fns';

const getInitialState = (): AppState => ({
  companyInfo: {
    name: "Peternakan Bebek Jaya",
    address: "Jl. Raya Bebek No. 123, Desa Makmur, Indonesia",
    phone: "0812-3456-7890",
    email: "info@peternakanbebekjaya.com",
    logo: "",
  },
  ducks: [
    { cage: 1, quantity: 100, deaths: 2, entryDate: new Date('2023-11-01'), ageMonths: 8, status: 'Bebek Petelur', cageSize: '10x5m', cageSystem: 'baterai' },
    { cage: 2, quantity: 120, deaths: 1, entryDate: new Date('2024-03-15'), ageMonths: 4, status: 'Bebek Bayah', cageSize: '12x5m', cageSystem: 'umbaran' },
  ],
  eggProduction: {
    daily: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const totalEggs = Math.floor(60 + Math.random() * 20);
        return {
            date,
            totalEggs,
            productivity: 75 + Math.random() * 10,
            perCage: { 1: Math.floor(totalEggs * 0.45), 2: Math.floor(totalEggs * 0.55) }
        };
    }),
    weekly: [
        { week: 1, productivity: 82.5, gradeA: 450, gradeB: 120, gradeC: 30, consumption: 25, priceA: 2500, priceB: 2300, priceC: 2000, priceConsumption: 1800, totalEggs: 625, totalValue: 1533500 },
    ],
    monthly: [
        { month: 'Juni 2024', gradeA: 1800, gradeB: 480, gradeC: 120, consumption: 100, totalEggs: 2500 },
    ]
  },
  feed: [
    { id: 1, name: 'Konsentrat A', supplier: 'PT Pakan Sejahtera', lastUpdated: new Date(), stock: 500, pricePerBag: 350000, pricePerKg: 7000, schema: 120 },
    { id: 2, name: 'Jagung Giling', supplier: 'Lokal Jaya', lastUpdated: new Date(), stock: 1200, pricePerBag: 250000, pricePerKg: 5000, schema: 80 },
  ],
  finance: [
    { id: 1, date: new Date(), description: "Penjualan Telur Grade A", quantity: 450, unitPrice: 2500, total: 1125000, type: 'debit' },
    { id: 2, date: new Date(), description: "Pembelian Pakan Konsentrat", quantity: 10, unitPrice: 350000, total: 3500000, type: 'credit' },
  ],
  isDirty: false,
});

const calculateDuckStatus = (ageMonths: number): Duck['status'] => {
  if (ageMonths <= 5) return 'Bebek Bayah';
  if (ageMonths <= 12) return 'Bebek Petelur';
  if (ageMonths <= 18) return 'Bebek Tua';
  return 'Bebek Afkir';
};

const calculateAge = (entryDate: Date): number => {
    return Math.floor((new Date().getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
};

type DailyProductionInput = {
    date: Date;
    perCage: { [key: string]: number };
}

export const useAppStore = create<AppState & {
  setDirty: () => void;
  updateCompanyInfo: (info: AppState['companyInfo']) => void;
  addDuck: (duck: Duck) => void;
  updateDuck: (cage: number, duck: Duck) => void;
  removeDuck: (cage: number) => void;
  resetDuck: (cage: number) => void;
  addDailyProduction: (data: DailyProductionInput) => void;
  addWeeklyProduction: (data: Omit<WeeklyProduction, 'totalEggs' | 'totalValue' | 'productivity'>) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: number, transaction: Transaction) => void;
  removeTransaction: (id: number) => void;
  addFeed: (feed: Feed) => void;
  updateFeed: (id: number, feed: Feed) => void;
  removeFeed: (id: number) => void;
  saveState: () => void;
  loadState: () => void;
  getFullState: () => Omit<AppState, 'isDirty'>;
  loadFullState: (state: Omit<AppState, 'isDirty'>) => void;
  resetState: () => void;
  getInitialState: () => AppState;
}>((set, get) => ({
  ...getInitialState(),

  setDirty: () => set({ isDirty: true }),
  
  getInitialState: getInitialState,

  updateCompanyInfo: (info) => {
    set({ companyInfo: info, isDirty: true });
  },

  addDuck: (duck) => {
    set(state => {
      const ageMonths = calculateAge(duck.entryDate);
      const status = calculateDuckStatus(ageMonths);
      return { ducks: [...state.ducks, { ...duck, ageMonths, status }], isDirty: true };
    });
  },

  updateDuck: (cage, updatedDuck) => {
    set(state => {
      const ageMonths = calculateAge(updatedDuck.entryDate);
      const status = calculateDuckStatus(ageMonths);
      return {
        ducks: state.ducks.map(d => d.cage === cage ? { ...updatedDuck, ageMonths, status } : d),
        isDirty: true
      };
    });
  },

  removeDuck: (cage) => {
    set(state => ({
      ducks: state.ducks.filter(d => d.cage !== cage),
      isDirty: true
    }));
  },

  resetDuck: (cage) => {
    set(state => ({
      ducks: state.ducks.map(d => d.cage === cage ? { ...d, quantity: 0, deaths: 0 } : d),
      isDirty: true
    }))
  },

  addDailyProduction: (data) => {
    set(state => {
        const totalEggs = Object.values(data.perCage).reduce((sum, count) => sum + count, 0);
        const totalDucks = state.ducks.reduce((sum, duck) => sum + duck.quantity, 0);
        const productivity = totalDucks > 0 ? (totalEggs / totalDucks) * 100 : 0;
        
        const newDailyRecord: DailyProduction = {
            date: data.date,
            totalEggs,
            productivity,
            perCage: data.perCage
        };

        const updatedDaily = [...state.eggProduction.daily, newDailyRecord]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            eggProduction: {
                ...state.eggProduction,
                daily: updatedDaily
            },
            isDirty: true,
        };
    });
  },
  
  addWeeklyProduction: (data) => {
    set(state => {
        const totalEggs = data.gradeA + data.gradeB + data.gradeC + data.consumption;
        const totalValue = (data.gradeA * data.priceA) + (data.gradeB * data.priceB) + (data.gradeC * data.priceC) + (data.consumption * data.priceConsumption);
        const totalDucks = state.ducks.reduce((s, d) => s + d.quantity, 0);
        const productivity = totalDucks > 0 ? (totalEggs / 7 / totalDucks * 100) : 0;
        const newRecord: WeeklyProduction = {...data, totalEggs, totalValue, productivity};
        return {
            eggProduction: {
                ...state.eggProduction,
                weekly: [...state.eggProduction.weekly, newRecord]
            },
            isDirty: true,
        };
    });
  },

  addTransaction: (transaction) => {
    set(state => ({ finance: [...state.finance, transaction], isDirty: true }));
  },

  updateTransaction: (id, updatedTransaction) => {
    set(state => ({
      finance: state.finance.map(t => t.id === id ? updatedTransaction : t),
      isDirty: true
    }));
  },

  removeTransaction: (id) => {
    set(state => ({
      finance: state.finance.filter(t => t.id !== id),
      isDirty: true
    }));
  },

  addFeed: (feed) => {
    set(state => ({ feed: [...state.feed, feed], isDirty: true }));
  },

  updateFeed: (id, updatedFeed) => {
    set(state => ({
      feed: state.feed.map(f => f.id === id ? updatedFeed : f),
      isDirty: true
    }));
  },

  removeFeed: (id) => {
    set(state => ({
      feed: state.feed.filter(f => f.id !== id),
      isDirty: true
    }));
  },

  saveState: () => {
    try {
        const stateToSave = get().getFullState();
        // Convert Date objects to ISO strings
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem('clucksmart-state', serializedState);
        set({ isDirty: false });
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
  },

  loadState: () => {
    try {
      const savedState = localStorage.getItem('clucksmart-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Convert ISO strings back to Date objects
        const revivedState = {
            ...parsedState,
            ducks: parsedState.ducks.map((d: Duck) => ({...d, entryDate: new Date(d.entryDate)})),
            eggProduction: {
                ...parsedState.eggProduction,
                daily: parsedState.eggProduction.daily.map((d: DailyProduction) => ({...d, date: new Date(d.date)})),
            },
            feed: parsedState.feed.map((f: Feed) => ({...f, lastUpdated: new Date(f.lastUpdated)})),
            finance: parsedState.finance.map((t: Transaction) => ({...t, date: new Date(t.date)}))
        };
        set(revivedState);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  },
  
  getFullState: () => {
    const { isDirty, ...state } = get();
    return state;
  },

  loadFullState: (state) => {
      set({...state, isDirty: true});
  },

  resetState: () => {
      set({...getInitialState(), isDirty: true});
  },

}));

    