
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Calculator, LogOut, Moon, Save, Sun, Wifi, Phone, Mail } from "lucide-react";
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

// Simple Calculator Component
const SimpleCalculator = () => {
    const [display, setDisplay] = React.useState("0");
    const [firstOperand, setFirstOperand] = React.useState<number | null>(null);
    const [operator, setOperator] = React.useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = React.useState(false);

    const inputDigit = (digit: string) => {
        if (waitingForSecondOperand) {
            setDisplay(digit);
            setWaitingForSecondOperand(false);
        } else {
            setDisplay(display === "0" ? digit : display + digit);
        }
    };

    const inputDecimal = () => {
        if (waitingForSecondOperand) {
            setDisplay("0.");
            setWaitingForSecondOperand(false);
            return;
        }
        if (!display.includes(".")) {
            setDisplay(display + ".");
        }
    };

    const clearDisplay = () => {
        setDisplay("0");
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

        if (operator && waitingForSecondOperand) {
            setOperator(nextOperator);
            return;
        }

        if (firstOperand === null) {
            setFirstOperand(inputValue);
        } else if (operator) {
            const result = calculate(firstOperand, inputValue, operator);
            const resultString = String(result);
            setDisplay(resultString.includes('.') ? resultString.replace('.', ',') : resultString);
            setFirstOperand(result);
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
            default: return second;
        }
    };

    const handleEquals = () => {
        if (operator && firstOperand !== null) {
            const inputValue = parseFloat(display.replace(/\./g, '').replace(',', '.'));
            const result = calculate(firstOperand, inputValue, operator);
            const resultString = String(result);
            setDisplay(resultString.includes('.') ? resultString.replace('.', ',') : resultString);
            setFirstOperand(null);
            setOperator(null);
            setWaitingForSecondOperand(false);
        }
    };
    
    const handleButtonClick = (btn: string) => {
        if (/\d/.test(btn)) inputDigit(btn);
        else if (btn === ".") inputDecimal();
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
                handleButtonClick('.');
            } else if (key === '+' || key === '-' || key === '*' || key === '/') {
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
        "0", ".", "="
      ];
      
      const formatDisplay = (value: string) => {
          if (value === "Infinity" || value === "-Infinity") return "Error";
          const [integerPart, decimalPart] = value.split(',');
          const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
      };
  
      const getButtonClass = (btn: string) => {
          if (btn === "AC") return "bg-destructive hover:bg-destructive/90";
          if (btn === "0") return "col-span-2";
          if (["/", "*", "-", "+", "="].includes(btn)) return "bg-accent hover:bg-accent/90";
          if (["DEL", "%"].includes(btn)) return "bg-muted hover:bg-muted/90";
          return "bg-secondary hover:bg-secondary/80";
      };

    return (
        <div className="p-4 bg-background rounded-lg shadow-lg w-64">
            <div className="bg-muted text-right text-3xl font-code p-4 rounded-md mb-4 overflow-x-auto text-foreground">
                {formatDisplay(display)}
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
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="bg-transparent border-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                        <Calculator className="h-5 w-5 text-blue-500" />
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

    

    