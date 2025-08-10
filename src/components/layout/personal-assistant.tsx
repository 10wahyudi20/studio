
"use client";

import React, { useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Sparkles, Bot, User, Trash2, Send, X, Paperclip, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import Image from "next/image";
import { personalAssistant, Message } from "@/ai/flows/personal-assistant-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";


export default function PersonalAssistant() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const [history, setHistory] = React.useState<Message[]>([]);
  const [prompt, setPrompt] = React.useState('');
  const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDialogOpen && !isLoading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isDialogOpen, isLoading]);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [history, isLoading]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsLoading(true);
    setError(null);

    try {
      const result = await personalAssistant({
        history,
        prompt: currentPrompt,
        imageDataUri: currentImageDataUri ?? undefined,
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                "fixed left-1/2 top-1/2 z-50 flex w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col border-none bg-background p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]",
                "h-full sm:h-[90vh] sm:rounded-lg",
                "ai-dialog"
            )}
             data-loading={isLoading}
        >
             <DialogHeader className="p-6 pb-2 flex-shrink-0">
                <DialogTitle>Asisten AI Pribadi</DialogTitle>
                <DialogDescription>
                Tanyakan apa saja. Asisten Anda memiliki wawasan yang luas.
                </DialogDescription>
            </DialogHeader>

             <div className="flex-grow my-4 flex flex-col overflow-hidden">
                <ScrollArea className="flex-grow pr-4" viewportRef={viewportRef}>
                    <div className="space-y-4 pr-2 sm:pr-0">
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
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
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

            {error && (
                <div className="px-6 pb-4 flex-shrink-0">
                    <Alert variant="destructive" className="mb-0"><AlertDescription>{error}</AlertDescription></Alert>
                </div>
            )}

            <DialogFooter className="p-6 pt-2 flex-shrink-0">
                {imageDataUri && (
                <div className="relative w-fit mb-2">
                    <Image src={imageDataUri} alt="Pratinjau" width={80} height={80} className="rounded-md object-cover" />
                    <Button
                    variant="destructive" size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => {
                        setImageDataUri(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    >
                    <X className="h-4 w-4" />
                    </Button>
                </div>
                )}
                <div className="relative flex-grow flex items-center w-full">
                    <Button variant="ghost" size="icon" onClick={handleClear} className="absolute left-[-10px] bottom-0 text-muted-foreground">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Hapus Obrolan</span>
                    </Button>
                    <label htmlFor="file-upload" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute left-6 bottom-0 h-10 w-10 text-muted-foreground cursor-pointer")}>
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Lampirkan file</span>
                    </label>
                    <Input id="file-upload" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                    <Input
                    ref={inputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ketik pesan Anda..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={isLoading}
                    className="pl-20 pr-12"
                    />
                    <Button
                    type="submit"
                    size="icon"
                    onClick={handleSend}
                    disabled={isLoading || (!prompt.trim() && !imageDataUri)}
                    className="absolute right-1.5 bottom-1 h-8 w-8"
                    >
                    <Send className="h-4 w-4" />
                    </Button>
                </div>
            </DialogFooter>

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
