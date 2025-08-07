
"use client";
import React, {useRef, useEffect} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useRouter } from "next/navigation";
import { Sparkles, Calculator, LogOut, Moon, Save, Sun, Wifi, Phone, Mail, Bot, User, Trash2, Send, X, Paperclip, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { personalAssistant, Message } from "@/ai/flows/personal-assistant-flow";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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

// Personal AI Assistant Component
const PersonalAssistant = () => {
    const { ducks, eggProduction, feed, finance } = useAppStore();
    const [history, setHistory] = React.useState<Message[]>([]);
    const [prompt, setPrompt] = React.useState('');
    const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    // Effect to focus the input when dialog opens or after a message is sent
    useEffect(() => {
        if (!isLoading) {
             // We use a small timeout to ensure the input is rendered and visible before focusing
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isLoading]);
    
    // Effect to scroll to the bottom of the chat history when new messages are added
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [history]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageDataUri(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async () => {
        if (!prompt.trim() && !imageDataUri) return;

        const newUserMessage: Message = { role: 'user', content: prompt, imageUrl: imageDataUri ?? undefined };
        setHistory(prev => [...prev, newUserMessage]);
        
        const currentPrompt = prompt;
        const currentImageDataUri = imageDataUri;

        setPrompt('');
        setImageDataUri(null);
        if(fileInputRef.current) fileInputRef.current.value = '';

        setIsLoading(true);
        setError(null);

        try {
            // Pass the current state of the farm data to the AI
            const result = await personalAssistant({
                history,
                prompt: currentPrompt,
                imageDataUri: currentImageDataUri ?? undefined,
                ducks: ducks.map(d => ({...d, entryDate: d.entryDate.toISOString()})),
                eggProduction,
                feed,
                finance
            });
            const aiResponse: Message = { role: 'model', content: result.response };
            setHistory(prev => [...prev, aiResponse]);
        } catch (e) {
            console.error("AI Assistant Error:", e);
            setError("Maaf, terjadi kesalahan saat menghubungi asisten AI. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setHistory([]);
        setError(null);
        setImageDataUri(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-[70vh] p-6">
            <DialogHeader>
                <DialogTitle>Asisten AI Pribadi</DialogTitle>
                <DialogDescription>
                    Ajukan pertanyaan apa pun, termasuk analisis data peternakan Anda. Riwayat obrolan hanya sementara.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow my-4 overflow-hidden">
                <ScrollArea className="h-full pr-4" viewportRef={viewportRef}>
                    <div className="space-y-4">
                        {history.length === 0 && !imageDataUri && (
                            <div className="text-center text-muted-foreground py-8">
                                <Bot className="mx-auto h-12 w-12" />
                                <p className="mt-2">Bagaimana saya bisa membantu Anda hari ini?</p>
                            </div>
                        )}
                        {history.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                                {msg.role === 'model' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                                <div className={cn("p-3 rounded-lg max-w-sm", msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                    {msg.imageUrl && <Image src={msg.imageUrl} alt="Lampiran" width={200} height={200} className="rounded-md mb-2" />}
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                                {msg.role === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-start gap-3">
                                <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                                <div className="p-3 rounded-lg bg-muted">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            
            <div className="space-y-2">
                 {imageDataUri && (
                    <div className="relative w-fit">
                        <Image src={imageDataUri} alt="Pratinjau" width={80} height={80} className="rounded-md object-cover" />
                        <Button
                            variant="destructive" size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => {
                                setImageDataUri(null);
                                if(fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="ghost" size="icon" onClick={handleClear} className="absolute left-4 bottom-4">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Hapus Obrolan</span>
                    </Button>
                    <div className="relative flex-grow flex items-center">
                         <label htmlFor="file-upload" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute left-1.5 h-8 w-8 text-muted-foreground cursor-pointer")}>
                            <Paperclip className="h-4 w-4" />
                            <span className="sr-only">Lampirkan file</span>
                        </label>
                        <Input id="file-upload" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange}/>
                        <Input
                            ref={inputRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ketik pesan Anda..."
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={isLoading}
                            className="pl-12 pr-12"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            onClick={handleSend}
                            disabled={isLoading || (!prompt.trim() && !imageDataUri)}
                            className="absolute right-1.5 h-8 w-8"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogFooter>
            </div>
        </div>
    );
};


// Simple Calculator Component
const SimpleCalculator = () => {
    const [display, setDisplay] = React.useState("0");
    const [history, setHistory] = React.useState("");
    const [firstOperand, setFirstOperand] = React.useState<number | null>(null);
    const [operator, setOperator] = React.useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = React.useState(false);

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
            setWaitingForSecondOperand(true); // Allow starting new calculation
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
    }, [display, firstOperand, operator, waitingForSecondOperand]);

    const buttons = [
      "AC", "DEL", "%", "/",
      "7", "8", "9", "*",
      "4", "5", "6", "-",
      "1", "2", "3", "+",
      "0", ",", "="
    ];

    const getButtonClass = (btn: string) => {
        if (btn === "AC") return "bg-destructive hover:bg-destructive/90";
        if (btn === "0") return "col-span-2";
        if (["/", "*", "-", "+", "="].includes(btn)) return "bg-accent hover:bg-accent/90";
        if (["DEL", "%"].includes(btn)) return "bg-muted hover:bg-muted/90";
        return "bg-secondary hover:bg-secondary/80";
    };

    return (
        <div className="p-4 bg-background rounded-lg shadow-lg w-64">
            <div className="bg-muted text-right p-4 rounded-md mb-4 text-foreground">
                 <div className="text-sm text-muted-foreground h-6 truncate" title={history}>{history}</div>
                 <div className={cn("font-code overflow-x-auto", displayFontSizeClass())}>
                    {formattedDisplayValue}
                 </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                 {buttons.map(btn => (
                    <Button
                        key={btn}
                        onClick={() => handleButtonClick(btn)}
                        className={cn("text-xl font-bold h-14 text-foreground", getButtonClass(btn))}
                    >
                        {btn}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default function Header() {
    const { companyInfo, isDirty, saveState, logout } = useAppStore();
    const { toast } = useToast();
    const router = useRouter();
    const [aiDialogOpen, setAiDialogOpen] = React.useState(false);

    const handleSave = () => {
        saveState();
        toast({
            title: "Data Disimpan!",
            description: "Semua perubahan telah disimpan di browser.",
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
            <h1 className="text-xl font-bold text-blue-800 dark:text-white font-headline">
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
            <Button size="icon" variant="ghost" onClick={handleSave} className="bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                <Save className={cn("h-5 w-5", isDirty ? "text-accent blinking-save" : "text-blue-500")} />
                <span className="sr-only">Simpan Data</span>
            </Button>
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <DialogTrigger asChild>
                     <Button size="icon" variant="ghost" className="bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <span className="sr-only">Asisten AI</span>
                    </Button>
                </DialogTrigger>
                 <DialogPortal>
                    <DialogOverlay />
                    <DialogPrimitive.Content
                    className={cn(
                        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
                    )}
                    >
                    <PersonalAssistant />
                    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                    </DialogPrimitive.Content>
                </DialogPortal>
            </Dialog>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                        <Calculator className="h-5 w-5 text-black dark:text-yellow-500" />
                        <span className="sr-only">Kalkulator</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-min p-0 bg-transparent border-0 shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Kalkulator</DialogTitle>
                        <DialogDescription>
                            Kalkulator sederhana untuk perhitungan cepat.
                        </DialogDescription>
                    </DialogHeader>
                    <SimpleCalculator />
                </DialogContent>
            </Dialog>
            <Button size="icon" variant="ghost" className="cursor-default bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="sr-only">Online</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={handleLogout} className="bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="sr-only">Logout</span>
            </Button>
        </div>
      </div>
    </header>
  );
}

    

    

