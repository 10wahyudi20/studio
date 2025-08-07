
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
  const { ducks, eggProduction, feed, finance } = useAppStore();
  const [history, setHistory] = React.useState<Message[]>([]);
  const [prompt, setPrompt] = React.useState('');
  const [imageDataUri, setImageDataUri] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
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
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsLoading(true);
    setError(null);

    try {
      const result = await personalAssistant({
        history,
        prompt: currentPrompt,
        imageDataUri: currentImageDataUri ?? undefined,
        ducks: ducks.map(d => ({...d, entryDate: d.entryDate.toISOString()})),
        eggProduction: {
            daily: eggProduction.daily.map(d => ({...d, date: d.date.toISOString()})),
            weekly: eggProduction.weekly.map(w => ({
                ...w, 
                startDate: new Date(w.startDate).toISOString(), 
                endDate: new Date(w.endDate).toISOString()
            })),
            monthly: eggProduction.monthly,
        },
        feed: feed.map(f => ({...f, lastUpdated: new Date(f.lastUpdated).toISOString()})),
        finance: finance.map(t => ({...t, date: new Date(t.date).toISOString()})),
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
            "ai-dialog fixed left-[50%] top-[50%] z-50 grid w-full max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          )}
          data-loading={isLoading}
        >
          <div className="flex flex-col h-[70vh] p-6">
            <DialogHeader>
              <DialogTitle>Asisten AI Pribadi</DialogTitle>
              <DialogDescription>
                Ketik "hallo bebek" untuk memulai analisis peternakan Anda. Riwayat obrolan hanya sementara.
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
                      if (fileInputRef.current) fileInputRef.current.value = '';
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
                  <Input id="file-upload" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
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
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
