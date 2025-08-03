
import { create } from 'zustand';
import { AppState, Duck, Transaction, Feed, DailyProduction, WeeklyProduction, MonthlyProduction } from '@/lib/types';
import { format } from 'date-fns';

const getInitialState = (): AppState => ({
  companyInfo: {
    name: "Nama Peternakan Anda",
    address: "Alamat Peternakan Anda",
    phone: "Telepon Peternakan Anda",
    email: "email@peternakan.com",
    logo: "",
  },
  ducks: [],
  eggProduction: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  feed: [],
  finance: [],
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
  addDuck: (duck: Omit<Duck, 'cage' | 'ageMonths' | 'status'>) => void;
  updateDuck: (cage: number, duck: Omit<Duck, 'cage' | 'ageMonths' | 'status'>) => void;
  removeDuck: (cage: number) => void;
  resetDuck: (cage: number) => void;
  addDailyProduction: (data: DailyProductionInput) => void;
  addWeeklyProduction: (data: Omit<WeeklyProduction, 'totalEggs' | 'totalValue' | 'productivity'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: number, transaction: Transaction) => void;
  removeTransaction: (id: number) => void;
  addFeed: (feed: Omit<Feed, 'id'>) => void;
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
      const cage = state.ducks.length > 0 ? Math.max(...state.ducks.map(d => d.cage)) + 1 : 1;
      const newDuck = { ...duck, cage, ageMonths, status };
      return { ducks: [...state.ducks, newDuck], isDirty: true };
    });
  },

  updateDuck: (cage, updatedDuck) => {
    set(state => {
      const ageMonths = calculateAge(updatedDuck.entryDate);
      const status = calculateDuckStatus(ageMonths);
      const newDuck = { ...updatedDuck, cage, ageMonths, status };
      return {
        ducks: state.ducks.map(d => d.cage === cage ? newDuck : d),
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
    set(state => ({ finance: [...state.finance, { ...transaction, id: Date.now() }], isDirty: true }));
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
    set(state => ({ feed: [...state.feed, { ...feed, id: Date.now() }], isDirty: true }));
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
