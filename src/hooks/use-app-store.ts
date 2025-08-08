import { create } from 'zustand';
import { AppState, Duck, Transaction, Feed, DailyProduction, WeeklyProduction, MonthlyProduction, DeathRecord } from '@/lib/types';
import { format, getMonth, getYear, parse, startOfDay, subMonths, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined') {
    channel = new BroadcastChannel('clucksmart-channel');
}


const getInitialState = (): AppState => ({
  companyInfo: {
    name: "Nama Peternakan Anda",
    address: "Alamat Peternakan Anda",
    phone: "Telepon Peternakan Anda",
    email: "email@peternakan.com",
    logo: "",
    ttsVoice: "algenib",
    username: "",
    password: "",
    loginBackground: "",
  },
  ducks: [],
  eggProduction: {
    daily: [],
    weekly: [],
    monthly: [],
  },
  feed: [],
  finance: [],
  deathRecords: [],
  isDirty: false,
  isAuthenticated: false, 
  lastStockUpdate: null,
  activeTab: 'home',
});

const calculateDuckStatus = (ageMonths: number): Duck['status'] => {
  if (ageMonths < 6) return 'Bebek Bayah';
  if (ageMonths < 13) return 'Bebek Petelur';
  if (ageMonths < 19) return 'Bebek Tua';
  return 'Bebek Afkir';
};

const calculateAge = (entryDate: Date): number => {
    const now = new Date();
    const diff = now.getTime() - new Date(entryDate).getTime();
    const ageInDays = diff / (1000 * 60 * 60 * 24);
    return parseFloat((ageInDays / 30.44).toFixed(1)); // Return age with one decimal place
};

const recalculateMonthlyProduction = (weeklyData: WeeklyProduction[]): MonthlyProduction[] => {
    const monthlyData: { [month: string]: MonthlyProduction } = {};

    weeklyData.forEach(week => {
        if (week && week.startDate && !isNaN(new Date(week.startDate).getTime())) {
            const monthKey = format(new Date(week.startDate), 'MMMM yyyy', { locale: idLocale });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    gradeA: 0, gradeB: 0, gradeC: 0, consumption: 0, totalEggs: 0
                };
            }

            monthlyData[monthKey].gradeA += week.gradeA;
            monthlyData[monthKey].gradeB += week.gradeB;
            monthlyData[monthKey].gradeC += week.gradeC;
            monthlyData[monthKey].consumption += week.consumption;
            monthlyData[monthKey].totalEggs += week.totalEggs;
        }
    });

    return Object.values(monthlyData).sort((a,b) => {
        const dateA = parse(a.month, 'MMMM yyyy', new Date(), { locale: idLocale });
        const dateB = parse(b.month, 'MMMM yyyy', new Date(), { locale: idLocale });
        return dateA.getTime() - dateB.getTime();
    });
};


type DailyProductionInput = {
    date: Date;
    perCage: { [key: string]: number };
}

type WeeklyProductionInput = Omit<WeeklyProduction, 'id' | 'totalEggs' | 'totalValue'>;
type DeathRecordInput = Omit<DeathRecord, 'id' | 'date'>;


export const useAppStore = create<AppState & {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setDirty: () => void;
  setActiveTab: (tab: string) => void;
  updateCompanyInfo: (info: AppState['companyInfo']) => void;
  addDuck: (duck: Omit<Duck, 'id' | 'ageMonths' | 'status' | 'cageSize'> & { cageSizeLength: number, cageSizeWidth: number }) => void;
  updateDuck: (id: number, duck: Partial<Omit<Duck, 'id' | 'ageMonths' | 'status' | 'cageSize'>> & { cageSizeLength?: number, cageSizeWidth?: number, entryDate?: Date }) => void;
  removeDuck: (id: number) => void;
  resetDuck: (id: number) => void;
  addDailyProduction: (data: DailyProductionInput) => void;
  updateDailyProduction: (date: Date, data: DailyProductionInput) => void;
  addWeeklyProduction: (data: WeeklyProductionInput) => void;
  updateWeeklyProduction: (id: number, data: Partial<WeeklyProductionInput>) => void;
  removeWeeklyProduction: (id: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: number, transaction: Partial<Omit<Transaction, 'id'>>) => void;
  removeTransaction: (id: number) => void;
  addFeed: (feed: Omit<Feed, 'id' | 'pricePerKg'>) => void;
  updateFeed: (id: number, feed: Partial<Omit<Feed, 'id' | 'pricePerKg'>>) => void;
  removeFeed: (id: number) => void;
  addDeathRecord: (record: DeathRecordInput) => void;
  saveState: () => void;
  loadState: () => void;
  getFullState: () => Omit<AppState, 'isDirty' | 'isAuthenticated'>;
  loadFullState: (state: Omit<AppState, 'isDirty' | 'isAuthenticated'>) => void;
  resetState: () => void;
  getInitialState: () => AppState;
}>((set, get) => ({
  ...getInitialState(),

  login: (username, password) => {
    const { companyInfo } = get();
    const noCredentialsSet = !companyInfo.username && !companyInfo.password;
    
    if (noCredentialsSet || (username === companyInfo.username && password === companyInfo.password)) {
      set({ isAuthenticated: true });
      localStorage.setItem('clucksmart-auth', 'true');
      channel?.postMessage({ type: 'auth-change' });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
    localStorage.removeItem('clucksmart-auth');
    channel?.postMessage({ type: 'auth-change' });
  },

  setDirty: () => set({ isDirty: true }),
  
  setActiveTab: (tab) => {
    set(state => {
      if (state.activeTab !== tab) {
        localStorage.setItem('clucksmart-activeTab', tab);
        channel?.postMessage({ type: 'tab-change' });
        return { activeTab: tab };
      }
      return {};
    });
  },

  getInitialState: getInitialState,

  updateCompanyInfo: (info) => {
    set({ companyInfo: info, isDirty: true });
  },

  addDuck: (duck) => {
    set(state => {
      const ageMonths = calculateAge(duck.entryDate);
      const status = calculateDuckStatus(ageMonths);
      const cageSize = `${duck.cageSizeLength}m x ${duck.cageSizeWidth}m`;
      const newDuck = { ...duck, id: Date.now(), ageMonths, status, cageSize };
      return { ducks: [...state.ducks, newDuck], isDirty: true };
    });
  },

  updateDuck: (id, updatedDuck) => {
    set(state => ({
      ducks: state.ducks.map(d => {
        if (d.id === id) {
          const updated = { ...d, ...updatedDuck };
          
          const newEntryDate = updated.entryDate;
          const ageMonths = calculateAge(newEntryDate);
          const status = calculateDuckStatus(ageMonths);
          
          const cageSizeLength = updatedDuck.cageSizeLength ?? (d.cageSize?.split('x')[0].replace(/m/g, '').trim() || '0');
          const cageSizeWidth = updatedDuck.cageSizeWidth ?? (d.cageSize?.split('x')[1]?.replace(/m/g, '').trim() || '0');
          const cageSize = `${cageSizeLength}m x ${cageSizeWidth}m`;

          return { ...updated, entryDate: newEntryDate, ageMonths, status, cageSize };
        }
        return d;
      }),
      isDirty: true
    }));
  },

  removeDuck: (id) => {
    set(state => ({
      ducks: state.ducks.filter(d => d.id !== id),
      deathRecords: state.deathRecords.filter(r => r.cage !== state.ducks.find(d => d.id === id)?.cage), // This might need adjustment if cage is not unique
      isDirty: true
    }));
  },

  resetDuck: (id) => {
    set(state => ({
      ducks: state.ducks.map(d => d.id === id ? { ...d, quantity: 0, deaths: 0 } : d),
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

  updateDailyProduction: (date, data) => {
    set(state => {
        const totalEggs = Object.values(data.perCage).reduce((sum, count) => sum + count, 0);
        const totalDucks = state.ducks.reduce((sum, duck) => sum + duck.quantity, 0);
        const productivity = totalDucks > 0 ? (totalEggs / totalDucks) * 100 : 0;
        
        const updatedDailyRecord: DailyProduction = {
            date: data.date,
            totalEggs,
            productivity,
            perCage: data.perCage
        };
        
        const updatedDaily = state.eggProduction.daily.map(d => 
            new Date(d.date).toDateString() === new Date(date).toDateString() ? updatedDailyRecord : d
        );

        return {
            eggProduction: {
                ...state.eggProduction,
                daily: updatedDaily
            },
            isDirty: true,
        };
    })
  },
  
  addWeeklyProduction: (data) => {
    set(state => {
        const totalEggs = data.gradeA + data.gradeB + data.gradeC + data.consumption;
        const totalValue = (data.gradeA * data.priceA) + (data.gradeB * data.priceB) + (data.gradeC * data.priceC) + (data.consumption * data.priceConsumption);
        const newRecord: WeeklyProduction = {...data, id: Date.now(), totalEggs, totalValue};
        
        const updatedWeekly = [...state.eggProduction.weekly, newRecord];
        const updatedMonthly = recalculateMonthlyProduction(updatedWeekly);

        return {
            eggProduction: {
                ...state.eggProduction,
                weekly: updatedWeekly,
                monthly: updatedMonthly,
            },
            isDirty: true,
        };
    });
  },
  
  updateWeeklyProduction: (id, data) => {
     set(state => {
        const updatedWeekly = state.eggProduction.weekly.map(prod => {
            if (prod.id === id) {
                const updatedProd = { ...prod, ...data };
                const totalEggs = updatedProd.gradeA + updatedProd.gradeB + updatedProd.gradeC + updatedProd.consumption;
                const totalValue = (updatedProd.gradeA * updatedProd.priceA) + (updatedProd.gradeB * updatedProd.priceB) + (updatedProd.gradeC * updatedProd.priceC) + (updatedProd.consumption * updatedProd.priceConsumption);
                return { ...updatedProd, totalEggs, totalValue };
            }
            return prod;
        });
        const updatedMonthly = recalculateMonthlyProduction(updatedWeekly);
        return {
            eggProduction: {
                ...state.eggProduction,
                weekly: updatedWeekly,
                monthly: updatedMonthly,
            },
            isDirty: true,
        };
     })
  },

  removeWeeklyProduction: (id) => {
      set(state => {
          const updatedWeekly = state.eggProduction.weekly.filter(prod => prod.id !== id);
          const updatedMonthly = recalculateMonthlyProduction(updatedWeekly);
          return {
              eggProduction: {
                  ...state.eggProduction,
                  weekly: updatedWeekly,
                  monthly: updatedMonthly,
              },
              isDirty: true,
          }
      });
  },

  addTransaction: (transaction) => {
    set(state => ({ finance: [...state.finance, { ...transaction, id: Date.now() }], isDirty: true }));
  },

  updateTransaction: (id, updatedTransaction) => {
    set(state => ({
      finance: state.finance.map(t => {
        if (t.id === id) {
          const newTotal = (updatedTransaction.quantity ?? t.quantity) * (updatedTransaction.unitPrice ?? t.unitPrice);
          return { ...t, ...updatedTransaction, total: newTotal };
        }
        return t;
      }),
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
    set(state => ({ 
        feed: [...state.feed, { 
            ...feed, 
            id: Date.now(), 
            pricePerKg: feed.pricePerBag > 0 ? feed.pricePerBag / 50 : 0
        }], 
        isDirty: true 
    }));
  },

  updateFeed: (id, updatedFeed) => {
    set(state => ({
      feed: state.feed.map(f => {
        if (f.id === id) {
          const pricePerBag = updatedFeed.pricePerBag ?? f.pricePerBag;
          const pricePerKg = pricePerBag > 0 ? pricePerBag / 50 : 0;
          return { ...f, ...updatedFeed, pricePerKg, lastUpdated: updatedFeed.lastUpdated ?? f.lastUpdated };
        }
        return f;
      }),
      isDirty: true
    }));
  },

  removeFeed: (id) => {
    set(state => ({
      feed: state.feed.filter(f => f.id !== id),
      isDirty: true
    }));
  },

  addDeathRecord: (record) => {
    set(state => {
      const newRecord: DeathRecord = {
        ...record,
        id: Date.now(),
        date: new Date(),
      };
      const updatedDucks = state.ducks.map(duck => {
        if(duck.cage === record.cage) {
            return { ...duck, deaths: duck.deaths + record.quantity };
        }
        return duck;
      });

      return {
        deathRecords: [...state.deathRecords, newRecord],
        ducks: updatedDucks,
        isDirty: true,
      };
    });
  },

  saveState: () => {
    try {
        const stateToSave = get().getFullState();
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem('clucksmart-state', serializedState);
        set({ isDirty: false });
        channel?.postMessage({ type: 'state-change' }); // Notify other tabs that state was saved
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
  },

  loadState: () => {
    try {
      const isAuthenticated = localStorage.getItem('clucksmart-auth') === 'true';
      const savedState = localStorage.getItem('clucksmart-state');
      const savedTab = localStorage.getItem('clucksmart-activeTab');

      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const revivedState: AppState = {
            ...getInitialState(), 
            ...parsedState,
            isAuthenticated,
            activeTab: savedTab || 'home',
            companyInfo: {
              ...getInitialState().companyInfo,
              ...parsedState.companyInfo,
            },
            ducks: parsedState.ducks.map((d: any) => ({...d, id: d.id || d.cage, entryDate: new Date(d.entryDate)})),
            eggProduction: {
                ...parsedState.eggProduction,
                daily: parsedState.eggProduction.daily.map((d: any) => ({...d, date: new Date(d.date)})),
                weekly: parsedState.eggProduction.weekly.map((w: any) => ({...w, id: w.id || Date.now(), startDate: new Date(w.startDate), endDate: new Date(w.endDate), description: w.description || '' })),
                monthly: parsedState.eggProduction.monthly || [],
            },
            feed: parsedState.feed.map((f: any) => ({...f, lastUpdated: new Date(f.lastUpdated)})),
            finance: parsedState.finance.map((t: any) => ({...t, date: new Date(t.date)})),
            deathRecords: (parsedState.deathRecords || []).map((r: any) => ({ ...r, date: new Date(r.date) })),
            lastStockUpdate: parsedState.lastStockUpdate || null,
        };
        
        revivedState.eggProduction.monthly = recalculateMonthlyProduction(revivedState.eggProduction.weekly);
        
        set(revivedState);
      } else {
        set({ isAuthenticated, activeTab: savedTab || 'home' });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  },
  
  getFullState: () => {
    const { isDirty, isAuthenticated, ...state } = get();
    const st: any = state;
    const functions = [
        "login", "logout", "setDirty", "setActiveTab", "updateCompanyInfo", "addDuck",
        "updateDuck", "removeDuck", "resetDuck", "addDailyProduction", "updateDailyProduction",
        "addWeeklyProduction", "updateWeeklyProduction", "removeWeeklyProduction", "addTransaction",
        "updateTransaction", "removeTransaction", "addFeed", "updateFeed", "removeFeed",
        "addDeathRecord", "saveState", "loadState", "getFullState", "loadFullState", "resetState", "getInitialState"
    ];
    functions.forEach(f => delete st[f]);
    return st as Omit<AppState, 'isDirty' | 'isAuthenticated'>;
  },

  loadFullState: (state) => {
      const revivedState = {
            ...state,
            ducks: state.ducks.map((d: any) => ({...d, id: d.id || d.cage, entryDate: new Date(d.entryDate)})),
            eggProduction: {
                ...state.eggProduction,
                daily: state.eggProduction.daily.map((d: any) => ({...d, date: new Date(d.date)})),
                 weekly: state.eggProduction.weekly.map((w: any) => ({...w, id: w.id || Date.now(), startDate: new Date(w.startDate), endDate: new Date(w.endDate), description: w.description || '' })),
                 monthly: state.eggProduction.monthly || [],
            },
            feed: state.feed.map((f: any) => ({...f, lastUpdated: new Date(f.lastUpdated)})),
            finance: state.finance.map((t: any) => ({...t, date: new Date(t.date)})),
            deathRecords: (state.deathRecords || []).map((r: any) => ({ ...r, date: new Date(r.date) })),
        };
      revivedState.eggProduction.monthly = recalculateMonthlyProduction(revivedState.eggProduction.weekly);
      set({...revivedState, isDirty: true});
      get().saveState(); 
  },

  resetState: () => {
    const initialState = get().getInitialState();
    set(initialState);
    get().saveState();
  },

}));


if (channel) {
    channel.onmessage = (event) => {
        const { loadState } = useAppStore.getState();
        if (event.data?.type === 'state-change') {
            loadState(); // Force reload from storage if another tab saved
        }
        if (event.data?.type === 'auth-change') {
            const isAuthenticated = localStorage.getItem('clucksmart-auth') === 'true';
            useAppStore.setState({ isAuthenticated });
        }
        if (event.data?.type === 'tab-change') {
            const activeTab = localStorage.getItem('clucksmart-activeTab') || 'home';
            useAppStore.setState({ activeTab });
        }
    };
}
