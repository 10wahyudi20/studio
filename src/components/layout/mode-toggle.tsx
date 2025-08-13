
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="bg-transparent border-none hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-transparent border-none shadow-none text-[10px] p-0">
          <p>Ganti Tema</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

    