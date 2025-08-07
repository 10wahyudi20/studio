
"use client";

import React from "react";
import packageJson from "../../../package.json";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appVersion = packageJson.version;

  return (
    <footer className="w-full border-t bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center justify-center h-12 px-4 text-sm text-muted-foreground gap-4">
        <p>&copy; {currentYear} Eko Wahyudi. All Rights Reserved.</p>
        <p>Versi {appVersion}</p>
      </div>
    </footer>
  );
}
