
"use client";

import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center justify-center h-12 px-4 text-sm text-muted-foreground">
        <p>&copy; {currentYear} Eko Wahyudi. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
