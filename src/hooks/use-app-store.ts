
import { create } from 'zustand';
import { AppState, Duck, Transaction, Feed, DailyProduction, WeeklyProduction, MonthlyProduction } from '@/lib/types';
import { format, getMonth, getYear, parse } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const getInitialState = (): AppState => ({
  companyInfo: {
    name: "Nama Peternakan Anda",
    address: "Alamat Peternakan Anda",
    phone: "Telepon Peternakan Anda",
    email: "email@peternakan.com",
    logo: "",
    ttsVoice: "algenib",
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

const recalculateMonthlyProduction = (weeklyData: WeeklyProduction[]): MonthlyProduction[] => {
    const monthlyData: { [month: string]: MonthlyProduction } = {};
    const now = new Date(); // Use a fixed date for the recalculation session

    weeklyData.forEach(week => {
        // This is still a placeholder as weekly data lacks a specific date.
        // We'll associate it with the current month and year for simplicity.
        // A more robust solution would be to add a date to weekly entries.
        const monthKey = format(now, 'MMMM yyyy', { locale: idLocale });

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
    });

    // Also process existing monthly data to aggregate correctly
    const allMonthlyData = Object.values(monthlyData);
    
    // This logic needs to be more robust to handle multiple months if weekly data had dates.
    // For now, it just overwrites with the current month's calculation.
    const finalMonthlyMap: { [month: string]: MonthlyProduction } = {};

    [...allMonthlyData].forEach(monthEntry => {
        if (!finalMonthlyMap[monthEntry.month]) {
            finalMonthlyMap[monthEntry.month] = { ...monthEntry };
        } else {
            finalMonthlyMap[monthEntry.month].gradeA += monthEntry.gradeA;
            finalMonthlyMap[monthEntry.month].gradeB += monthEntry.gradeB;
            finalMonthlyMap[monthEntry.month].gradeC += monthEntry.gradeC;
            finalMonthlyMap[monthEntry.month].consumption += monthEntry.consumption;
            finalMonthlyMap[monthEntry.month].totalEggs += monthEntry.totalEggs;
        }
    });

    return Object.values(finalMonthlyMap).sort((a,b) => {
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

export const useAppStore = create<AppState & {
  setDirty: () => void;
  updateCompanyInfo: (info: AppState['companyInfo']) => void;
  addDuck: (duck: Omit<Duck, 'id' | 'ageMonths' | 'status'>) => void;
  updateDuck: (cage: number, duck: Partial<Omit<Duck, 'cage' | 'ageMonths' | 'status'>>) => void;
  removeDuck: (cage: number) => void;
  resetDuck: (cage: number) => void;
  addDailyProduction: (data: DailyProductionInput) => void;
  updateDailyProduction: (date: Date, data: DailyProductionInput) => void;
  addWeeklyProduction: (data: WeeklyProductionInput) => void;
  updateWeeklyProduction: (id: number, data: Partial<WeeklyProductionInput>) => void;
  removeWeeklyProduction: (id: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: number, transaction: Partial<Omit<Transaction, 'id'>>) => void;
  removeTransaction: (id: number) => void;
  addFeed: (feed: Omit<Feed, 'id' | 'pricePerKg'>) => void;
  updateFeed: (id: number, feed: Partial<Omit<Feed, 'id'>>) => void;
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
      const newDuck = { ...duck, ageMonths, status };
      return { ducks: [...state.ducks, newDuck], isDirty: true };
    });
  },

  updateDuck: (cage, updatedDuck) => {
    set(state => ({
      ducks: state.ducks.map(d => {
        if (d.cage === cage) {
          const newEntryDate = updatedDuck.entryDate || d.entryDate;
          const ageMonths = calculateAge(newEntryDate);
          const status = calculateDuckStatus(ageMonths);
          return { ...d, ...updatedDuck, entryDate: newEntryDate, ageMonths, status };
        }
        return d;
      }),
      isDirty: true
    }));
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
            lastUpdated: new Date(),
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
          return { ...f, ...updatedFeed, pricePerKg, lastUpdated: new Date() };
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

  saveState: () => {
    try {
        const stateToSave = get().getFullState();
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
        const revivedState = {
            ...getInitialState(), // Start with defaults
            ...parsedState,
            companyInfo: {
              ...getInitialState().companyInfo,
              ...parsedState.companyInfo,
            },
            ducks: parsedState.ducks.map((d: any) => ({...d, entryDate: new Date(d.entryDate)})),
            eggProduction: {
                ...parsedState.eggProduction,
                daily: parsedState.eggProduction.daily.map((d: any) => ({...d, date: new Date(d.date)})),
                weekly: parsedState.eggProduction.weekly.map((w: any) => ({...w, id: w.id || Date.now() })),
                monthly: parsedState.eggProduction.monthly || [],
            },
            feed: parsedState.feed.map((f: any) => ({...f, lastUpdated: new Date(f.lastUpdated)})),
            finance: parsedState.finance.map((t: any) => ({...t, date: new Date(t.date)}))
        };
        // Recalculate monthly production on load to ensure consistency
        revivedState.eggProduction.monthly = recalculateMonthlyProduction(revivedState.eggProduction.weekly);
        set(revivedState);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  },
  
  getFullState: () => {
    const { isDirty, ...state } = get();
    // Exclude functions before returning state
    const st: any = state;
    delete st.setDirty;
    delete st.updateCompanyInfo;
    delete st.addDuck;
    delete st.updateDuck;
    delete st.removeDuck;
    delete st.resetDuck;
    delete st.addDailyProduction;
    delete st.updateDailyProduction;
    delete st.addWeeklyProduction;
    delete st.updateWeeklyProduction;
    delete st.removeWeeklyProduction;
    delete st.addTransaction;
    delete st.updateTransaction;
    delete st.removeTransaction;
    delete st.addFeed;
    delete st.updateFeed;
    delete st.removeFeed;
    delete st.saveState;
    delete st.loadState;
    delete st.getFullState;
    delete st.loadFullState;
    delete st.resetState;
    delete st.getInitialState;
    return st as Omit<AppState, 'isDirty'>;
  },

  loadFullState: (state) => {
      const revivedState = {
            ...state,
            ducks: state.ducks.map((d: any) => ({...d, entryDate: new Date(d.entryDate)})),
            eggProduction: {
                ...state.eggProduction,
                daily: state.eggProduction.daily.map((d: any) => ({...d, date: new Date(d.date)})),
                 weekly: state.eggProduction.weekly.map((w: any) => ({...w, id: w.id || Date.now() })),
                 monthly: state.eggProduction.monthly || [],
            },
            feed: state.feed.map((f: any) => ({...f, lastUpdated: new Date(f.lastUpdated)})),
            finance: state.finance.map((t: any) => ({...t, date: new Date(t.date)}))
        };
      // Recalculate monthly production on load to ensure consistency
      revivedState.eggProduction.monthly = recalculateMonthlyProduction(revivedState.eggProduction.weekly);
      set({...revivedState, isDirty: true});
  },

  resetState: () => {
      set({...getInitialState(), isDirty: true});
  },

}));
