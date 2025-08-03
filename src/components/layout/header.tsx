
"use client";
import React from "react";
import { BrainCircuit, Calculator, Moon, Save, Sun, Wifi } from "lucide-react";
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

    const performOperation = (nextOperator: string) => {
        const inputValue = parseFloat(display);

        if (firstOperand === null) {
            setFirstOperand(inputValue);
        } else if (operator) {
            const result = calculate(firstOperand, inputValue, operator);
            setDisplay(String(result));
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
            case "/": return first / second;
            default: return second;
        }
    };

    const handleEquals = () => {
        if (operator && firstOperand !== null) {
            const result = calculate(firstOperand, parseFloat(display), operator);
            setDisplay(String(result));
            setFirstOperand(null);
            setOperator(null);
            setWaitingForSecondOperand(false);
        }
    };

    const buttons = [
        "7", "8", "9", "/",
        "4", "5", "6", "*",
        "1", "2", "3", "-",
        "0", ".", "=", "+"
    ];

    const handleButtonClick = (btn: string) => {
        if (/\d/.test(btn)) inputDigit(btn);
        else if (btn === ".") inputDecimal();
        else if (btn === "=") handleEquals();
        else performOperation(btn);
    };

    return (
        <div className="p-4 bg-background rounded-lg shadow-lg w-64">
            <div className="bg-muted text-right text-3xl font-code p-4 rounded-md mb-4 overflow-x-auto">
                {display}
            </div>
            <div className="grid grid-cols-4 gap-2">
                <Button onClick={clearDisplay} className="col-span-4 bg-destructive hover:bg-destructive/90">AC</Button>
                {buttons.map(btn => (
                    <Button
                        key={btn}
                        onClick={() => handleButtonClick(btn)}
                        variant={/\d|\./.test(btn) ? "secondary" : "default"}
                        className={btn === "=" ? "bg-accent hover:bg-accent/90" : ""}
                    >
                        {btn}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default function Header() {
    const { companyInfo, isDirty, saveState } = useAppStore();
    const { toast } = useToast();

    const handleSave = () => {
        saveState();
        toast({
            title: "Data Disimpan!",
            description: "Semua perubahan telah disimpan di browser.",
        });
    };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            <DuckIcon className="h-10 w-10 text-primary" data-ai-hint="duck logo"/>
            <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold text-primary font-headline">
                    {companyInfo.name}
                </h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                    {companyInfo.address}
                </p>
                <p className="text-xs text-muted-foreground hidden md:block">
                    {companyInfo.phone} | {companyInfo.email}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={handleSave}>
                <Save className={cn("h-5 w-5", isDirty && "text-accent blinking-save")} />
                <span className="sr-only">Simpan Data</span>
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Calculator className="h-5 w-5" />
                        <span className="sr-only">Kalkulator</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-min p-0 bg-transparent border-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Kalkulator</DialogTitle>
                        <DialogDescription>
                            Kalkulator sederhana untuk perhitungan cepat.
                        </DialogDescription>
                    </DialogHeader>
                    <SimpleCalculator />
                </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="cursor-default">
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="sr-only">Online</span>
            </Button>
        </div>
      </div>
    </header>
  );
}
