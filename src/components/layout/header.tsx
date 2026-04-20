"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Calculator, LogOut, Save, Wifi, Phone, Mail, Cloud, WifiOff, Trash2, Sparkles, Send, Loader2, User, Bot, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { useAppStore } from "@/hooks/use-app-store";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aiAssistant } from "@/ai/flows/ai-assistant-flow";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

// Duck Icon SVG
const DuckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M11.372 13.061C11.12 12.56 10.636 12 10.001 12c-.552 0-1 .448-1 1s.449 1 1 1c.552 0 1.135-.448 1.499-1.24.331.144.69.24 1.059.24 1.381 0 2.5-1.119 2.5-2.5s-1.119-2.5-2.5-2.5c-1.282 0-2.343.967-2.484 2.212C12.19 11.08 12 10.562 12 10c0-1.339 1.01-2.433 2.288-2.494C14.624 5.438 16.657 4 19.001 4c2.761 0 5 2.239 5 5s-2.239 5-5 5c-1.636 0-3.111-.79-4.029-2.035a3.465 3.465 0 0 1-1.21.285c-1.112 0-2.11-.539-2.73-1.378a3.53 3.53 0 0 1-.66.814C4.249 13.921 2 14.058 2 12.5c0-.663.486-1.22 1.123-1.428.21-.069.428-.103.649-.103.422 0 .821.143 1.145.404.223.18.423.388.599.615a4.52 4.52 0 0 0 .543.61c.45.494 1.066.8 1.741.8.498 0 .97-.158 1.372-.439z" />
    </svg>
  );

// AI Assistant Component
const AIAssistant = () => {
    const [messages, setMessages] = React.useState<{role: 'user' | 'model', content: string}[]>([]);
    const [input, setInput] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await aiAssistant({
                message: userMsg,
                history: messages
            });
            setMessages(prev => [...prev, { role: 'model', content: response.reply }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'model', content: "Maaf, terjadi kesalahan saat menghubungi asisten AI. Silakan coba lagi." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[550px] w-full max-w-xl bg-background rounded-xl overflow-hidden">
            {/* Elegant Header */}
            <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold leading-tight">Asisten Gemini AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Model 2.0 Flash</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redesigned Chat Area */}
            <ScrollArea className="flex-grow px-4" ref={scrollRef}>
                <div className="space-y-6 py-6 max-w-lg mx-auto">
                    {messages.length === 0 && (
                        <div className="text-center py-12 space-y-4">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-2">
                                <Sparkles className="h-7 w-7 text-muted-foreground opacity-50" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Apa yang bisa saya bantu hari ini?</h2>
                            <p className="text-xs text-muted-foreground px-8 leading-relaxed">
                                Saya adalah asisten riset dan edukasi Anda. Ajukan pertanyaan seputar peternakan, nutrisi, atau hal lainnya.
                            </p>
                        </div>
                    )}
                    
                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn(
                            "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                            {/* Simple Avatar */}
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold",
                                msg.role === 'user' ? "bg-accent/10 border-accent/20" : "bg-primary/10 border-primary/20"
                            )}>
                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
                            </div>

                            {/* Gemini Style Bubble */}
                            <div className={cn(
                                "relative max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm",
                                msg.role === 'user' 
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none" 
                                    : "bg-muted border rounded-2xl rounded-tl-none"
                            )}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}

                    {/* Gemini Thinking Animation */}
                    {isLoading && (
                        <div className="flex gap-3 animate-pulse">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="bg-muted border rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Floating Style Input Area */}
            <div className="p-4 bg-background border-t">
                <div className="max-w-lg mx-auto">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                        className="relative group"
                    >
                        <Textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Ketik pertanyaan untuk riset..." 
                            disabled={isLoading}
                            rows={1}
                            className="min-h-[52px] max-h-32 py-4 px-5 pr-14 resize-none bg-muted/30 rounded-2xl border-2 border-transparent focus-visible:border-primary/30 focus-visible:ring-0 transition-all text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 bottom-2 h-9 w-9 rounded-xl shadow-lg transition-transform active:scale-95"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                    <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground font-medium">
                        <Info className="h-3 w-3" />
                        <span>Gunakan untuk edukasi. Gemini dapat memberikan info yang tidak akurat.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Calculator Component
const SimpleCalculator = () => {
    const [calcMode, setCalcMode] = React.useState<'standart' | 'skema' | 'rincian'>('standart');
    const [display, setDisplay] = React.useState("0");
    const [history, setHistory] = React.useState("");
    const [firstOperand, setFirstOperand] = React.useState<number | null>(null);
    const [operator, setOperator] = React.useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = React.useState(false);

    // Skema State
    const [bebekQty, setBebekQty] = React.useState<string>("");
    const [skemaGram, setSkemaGram] = React.useState<string>("");

    // Rincian State (Breakdown / Mixer)
    const [rincianRows, setRincianRows] = React.useState([
        { name: '', value: '' },
        { name: '', value: '' },
        { name: '', value: '' },
        { name: '', value: '' },
    ]);

    const handleRincianChange = (index: number, field: 'name' | 'value', val: string) => {
        const newRows = [...rincianRows];
        newRows[index] = { ...newRows[index], [field]: val };
        setRincianRows(newRows);
    };

    const clearRincian = () => {
        setRincianRows([
            { name: '', value: '' },
            { name: '', value: '' },
            { name: '', value: '' },
            { name: '', value: '' },
        ]);
    };

    const totalRincianValue = rincianRows.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
    
    // Auto-calculate percentages
    const rincianWithPercents = rincianRows.map(row => {
        const val = Number(row.value) || 0;
        const percent = totalRincianValue > 0 ? (val / totalRincianValue) * 100 : 0;
        return { ...row, percent: percent.toFixed(1) };
    });

    const totalRincianPercent = rincianWithPercents.reduce((sum, r) => sum + Number(r.percent), 0);

    const formatDisplay = (value: string) => {
        if (value === "Infinity" || value === "-Infinity") return "Error";
        const [integerPart, decimalPart] = value.split(',');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
    };

    const formattedDisplayValue = formatDisplay(display);
    const displayFontSizeClass = () => {
        const len = formattedDisplayValue.length;
        if (len > 16) return 'text-xl';
        if (len > 9) return 'text-2xl';
        return 'text-3xl';
    }
    
    const inputDigit = (digit: string) => {
        if (display.replace(/[.,]/g, '').length >= 15 && !waitingForSecondOperand) return;
        if (waitingForSecondOperand) {
            setDisplay(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplay(display === "0" ? digit : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForSecondOperand) {
            setDisplay("0,");
            setWaitingForSecondOperand(false);
            return;
        }
        if (!display.includes(",")) {
            setDisplay(display + ",");
        }
    };

    const clearDisplay = () => {
        setDisplay("0");
        setHistory("");
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const deleteLast = () => {
        if (waitingForSecondOperand) return;
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay("0");
        }
    };

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display.replace(/\./g, '').replace(',', '.'));
        const formattedDisplayForHistory = formatDisplay(display.replace(',', '.'));

        if (operator && waitingForSecondOperand) {
            setOperator(nextOperator);
            setHistory(prev => prev.slice(0, -2) + ` ${nextOperator} `);
            return;
        }

        if (firstOperand === null) {
            setFirstOperand(inputValue);
            setHistory(`${formattedDisplayForHistory} ${nextOperator} `);
        } else if (operator) {
            const result = calculate(firstOperand, inputValue, operator);
            const resultString = String(result).replace('.', ',');
            setDisplay(resultString);
            setFirstOperand(result);
            setHistory(prev => `${prev}${formattedDisplayForHistory} ${nextOperator} `);
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator);
    };

    const calculate = (first: number, second: number, op: string) => {
        switch (op) {
            case "+": return first + second;
            case "-": return first - second;
            case "*": return first * second;
            case "/": return second !== 0 ? first / second : Infinity;
            case "%": return first * (second / 100);
            default: return second;
        }
    };

    const handleEquals = () => {
        if (operator && firstOperand !== null) {
            const inputValue = parseFloat(display.replace(/\./g, '').replace(',', '.'));
            const result = calculate(firstOperand, inputValue, operator);
            const resultString = String(result).replace('.', ',');
            const formattedDisplayForHistory = formatDisplay(display.replace(',', '.'));
            
            setHistory(prev => `${prev}${formattedDisplayForHistory} =`);
            setDisplay(resultString);
            setFirstOperand(null);
            setOperator(null);
            setWaitingForSecondOperand(true);
        }
    };
    
    const handleButtonClick = (btn: string) => {
        if (/\d/.test(btn)) inputDigit(btn);
        else if (btn === ",") inputDecimal();
        else if (btn === "=") handleEquals();
        else if (btn === "DEL") deleteLast();
        else if (btn === "AC") clearDisplay();
        else performOperation(btn);
    };

    React.useEffect(() => {
        if (calcMode !== 'standart') return;
        const handleKeyDown = (event: KeyboardEvent) => {
            const { key } = event;
            if (/\d/.test(key)) {
                handleButtonClick(key);
            } else if (key === '.' || key === ',') {
                handleButtonClick(',');
            } else if (['+', '-', '*', '/', '%'].includes(key)) {
                handleButtonClick(key);
            } else if (key === 'Enter' || key === '=') {
                event.preventDefault();
                handleButtonClick('=');
            } else if (key === 'Backspace') {
                handleButtonClick('DEL');
            } else if (key === 'Escape') {
                handleButtonClick('AC');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [display, firstOperand, operator, waitingForSecondOperand, calcMode]);

    const buttons = [
      "AC", "DEL", "%", "/",
      "7", "8", "9", "*",
      "4", "5", "6", "-",
      "1", "2", "3", "+",
      "0", ",", "="
    ];

    const getButtonClass = (btn: string) => {
        if (btn === "AC") return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
        if (btn === "0") return "col-span-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground";
        if (["/", "*", "-", "+", "="].includes(btn)) return "bg-accent hover:bg-accent/90 text-accent-foreground";
        if (["DEL", "%"].includes(btn)) return "bg-muted hover:bg-muted/90 text-muted-foreground";
        return "bg-secondary hover:bg-secondary/80 text-secondary-foreground";
    };

    // Skema Logic
    const totalPakanKg = (Number(bebekQty) * Number(skemaGram)) / 1000;

    return (
        <div className="p-4 bg-background rounded-lg shadow-xl border w-80 h-[460px] flex flex-col gap-4 overflow-hidden">
            <div className="flex-shrink-0 flex gap-1 bg-muted/50 p-1 rounded-md">
                <Button 
                    variant={calcMode === 'standart' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className={cn("flex-1 h-8 text-[10px] uppercase font-bold", calcMode === 'standart' && "shadow-sm")} 
                    onClick={() => setCalcMode('standart')}
                >
                    Standart
                </Button>
                <Button 
                    variant={calcMode === 'skema' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className={cn("flex-1 h-8 text-[10px] uppercase font-bold", calcMode === 'skema' && "shadow-sm")} 
                    onClick={() => setCalcMode('skema')}
                >
                    Skema
                </Button>
                <Button 
                    variant={calcMode === 'rincian' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className={cn("flex-1 h-8 text-[10px] uppercase font-bold", calcMode === 'rincian' && "shadow-sm")} 
                    onClick={() => setCalcMode('rincian')}
                >
                    Rincian
                </Button>
            </div>

            <div className="flex-grow flex flex-col justify-start">
                {calcMode === 'standart' ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-muted text-right p-4 rounded-md text-foreground h-20 flex flex-col justify-center">
                             <div className="text-sm text-muted-foreground h-6 truncate" title={history}>{history}</div>
                             <div className={cn("font-code overflow-x-auto no-scrollbar", displayFontSizeClass())}>
                                {formattedDisplayValue}
                             </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                             {buttons.map(btn => (
                                <Button
                                    key={btn}
                                    onClick={() => handleButtonClick(btn)}
                                    className={cn("text-xl font-bold h-12", getButtonClass(btn))}
                                >
                                    {btn}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : calcMode === 'skema' ? (
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="skema_bebek" className="text-xs text-muted-foreground">Jumlah Bebek (Ekor)</Label>
                            <Input id="skema_bebek" type="number" value={bebekQty} onChange={(e) => setBebekQty(e.target.value)} placeholder="0" className="h-10 text-lg font-bold text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="skema_gram" className="text-xs text-muted-foreground">Skema Pakan (Gram/Ekor)</Label>
                            <Input id="skema_gram" type="number" value={skemaGram} onChange={(e) => setSkemaGram(e.target.value)} placeholder="0" className="h-10 text-lg font-bold text-green-500" />
                        </div>
                        <div className="bg-primary/10 p-6 rounded-md border border-primary/20 text-center my-4">
                            <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Total Kebutuhan Pakan</div>
                            <div className="text-4xl font-black text-primary">{totalPakanKg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-bold">Kg</span></div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => { setBebekQty(""); setSkemaGram(""); }}>
                            <Trash2 className="h-3 w-3 mr-2" /> Bersihkan
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3 py-1">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground uppercase px-1">
                            <div className="col-span-6 text-center">Nama Pakan</div>
                            <div className="col-span-3 text-center">Nilai</div>
                            <div className="col-span-3 text-center">%</div>
                        </div>
                        
                        <div className="space-y-2">
                            {rincianWithPercents.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2">
                                    <Input 
                                        type="text" 
                                        value={row.name} 
                                        onChange={(e) => handleRincianChange(idx, 'name', e.target.value)} 
                                        placeholder="Pakan..." 
                                        className="col-span-6 h-10 text-sm px-2" 
                                    />
                                    <Input 
                                        type="number" 
                                        value={row.value} 
                                        onChange={(e) => handleRincianChange(idx, 'value', e.target.value)} 
                                        placeholder="0" 
                                        className="col-span-3 h-10 text-sm text-center px-1 font-bold" 
                                    />
                                    <Input 
                                        type="text" 
                                        value={row.percent + "%"} 
                                        readOnly 
                                        className="col-span-3 h-10 text-sm text-center px-1 bg-muted/30 font-bold" 
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-12 gap-2 mt-4 pt-2 border-t border-dashed">
                            <div className="col-span-6 flex items-center justify-center text-xs font-bold text-muted-foreground italic">
                                Ringkasan Campuran
                            </div>
                            <div className="col-span-3 bg-primary/10 rounded py-1.5 text-center">
                                <div className="text-[10px] uppercase font-bold text-primary opacity-70">Total Nilai</div>
                                <div className="text-sm font-black text-primary">{totalRincianValue.toLocaleString('id-ID')}</div>
                            </div>
                            <div className={cn("col-span-3 rounded py-1.5 text-center", (totalRincianPercent > 0 && Math.abs(totalRincianPercent - 100) > 0.01) ? "bg-red-500/10" : "bg-green-500/10")}>
                                <div className="text-[10px] uppercase font-bold opacity-70">Total %</div>
                                <div className={cn("text-sm font-black", (totalRincianPercent > 0 && Math.abs(totalRincianPercent - 100) > 0.01) ? "text-red-600" : "text-green-600")}>
                                    {totalRincianValue > 0 ? totalRincianPercent.toFixed(1) : "0"}%
                                </div>
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-4" onClick={clearRincian}>
                            <Trash2 className="h-3 w-3 mr-2" /> Bersihkan Rincian
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Header() {
    const { companyInfo, isDirty, saveState, logout, getFullState, isOnline } = useAppStore();
    const { toast } = useToast();
    const router = useRouter();

    const isCloudConnected = !!companyInfo.megaUsername && !!companyInfo.megaPassword;

    const handleSave = () => {
        saveState();

        const state = getFullState();
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(state, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `clucksmart_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        toast({
            title: "Data Disimpan!",
            description: "Perubahan disimpan di browser & file backup telah diunduh.",
        });
    };

    const handleLogout = () => {
        logout();
        toast({
            title: "Logout Berhasil",
            description: "Anda telah keluar dari aplikasi.",
        });
        router.push("/login");
    };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            {companyInfo.logo ? (
                <Image src={companyInfo.logo} alt="Company Logo" width={40} height={40} className="h-10 w-10 rounded-lg object-cover bg-transparent border-none" data-ai-hint="company logo"/>
            ) : (
                <DuckIcon className="h-10 w-10 text-primary" data-ai-hint="duck logo"/>
            )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-[22px] font-bold text-primary dark:text-white font-headline">
                {companyInfo.name}
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">
                {companyInfo.address}
            </p>
            <div className="text-xs text-muted-foreground hidden md:flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {companyInfo.phone}</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {companyInfo.email}</span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <ModeToggle />
            
            <Dialog>
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                              <Sparkles className="h-5 w-5 text-accent" />
                              <span className="sr-only">Asisten AI</span>
                          </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
                      <p>Asisten AI</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent className="sm:max-w-xl p-0 bg-transparent border-0 shadow-none outline-none overflow-hidden">
                  <DialogHeader className="sr-only">
                      <DialogTitle>Asisten Gemini AI</DialogTitle>
                      <DialogDescription>
                          Interaksi dengan model AI Gemini untuk riset dan edukasi peternakan.
                      </DialogDescription>
                  </DialogHeader>
                  <AIAssistant />
              </DialogContent>
            </Dialog>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={handleSave} className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0">
                      <Save className={cn("h-5 w-5", isDirty ? "text-accent blinking-save" : "text-blue-500")} />
                      <span className="sr-only">Simpan Data</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
                  <p>Simpan Data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Dialog>
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                              <Calculator className="h-5 w-5 text-foreground" />
                              <span className="sr-only">Kalkulator</span>
                          </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
                      <p>Kalkulator</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent className="sm:max-w-min p-0 bg-transparent border-0 shadow-none outline-none">
                  <DialogHeader className="sr-only">
                      <DialogTitle>Kalkulator Multimode</DialogTitle>
                      <DialogDescription>
                          Kalkulator serbaguna untuk kebutuhan peternakan.
                      </DialogDescription>
                  </DialogHeader>
                  <SimpleCalculator />
              </DialogContent>
            </Dialog>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="cursor-default bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" aria-label={`Status Mega Cloud: ${isCloudConnected ? "Terkonfigurasi" : "Belum Terhubung"}`}>
                      <Cloud className={cn("h-5 w-5", isCloudConnected ? "text-green-500" : "text-red-500")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
                  <p>Mega Cloud: {isCloudConnected ? "Terkonfigurasi" : "Belum Terhubung"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="cursor-default bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" aria-label={`Status Koneksi: ${isOnline ? "Online" : "Offline"}`}>
                            {isOnline ? (
                                <Wifi className="h-5 w-5 text-green-500" />
                            ) : (
                                <WifiOff className="h-5 w-5 text-red-500" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
                        <p>Status: {isOnline ? "Online" : "Offline"}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={handleLogout} className="bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                      <LogOut className="h-5 w-5 text-red-500" />
                      <span className="sr-only">Logout</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
                    <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
      </div>
    </header>
  );
}