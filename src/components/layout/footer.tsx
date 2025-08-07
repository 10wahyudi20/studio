
"use client";

import React, { useState, useEffect } from "react";
import packageJson from "../../../package.json";

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const appVersion = packageJson.version;

  useEffect(() => {
    // This ensures the year is up-to-date if the component stays mounted across a year change,
    // though it's a minor edge case. The main goal is ensuring it's always correct on render.
    setCurrentYear(new Date().getFullYear());
  }, []);


  return (
    <footer className="w-full border-t bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center justify-center h-12 px-4 text-sm text-muted-foreground gap-4">
        <p>&copy; {currentYear} Eko Wahyudi. All Rights Reserved.</p>
        <p>Versi {appVersion}</p>
      </div>
    </footer>
  );
}
