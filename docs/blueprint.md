# **App Name**: CluckSmart

## Core Features:

- Persistent Header: Implement header with company name, address, contact info centered, logo on the left, and light/dark mode toggle & save icons on the right. The save icon indicates if the user has saved data.
- Tabbed Navigation: Design tabs for 'Home', 'Duck Population', 'Egg Production', 'Feed Management', 'Financial Analysis', 'Reports', 'AI Prediction', and 'Settings'.
- Interactive Tables: Implement interactive tables with functionalities like add, edit, delete, and reset. Table structure dynamically adapts based on data inputs, and reflects a Windows 11-inspired modern UI.
- Real-time Dashboard: Show real-time dashboard on the 'Home' tab, presenting essential metrics and switchable bar and pie charts.
- AI Prediction Tool: Implement AI powered prediction to estimate the egg production of the farm considering variables such as quantity of the duck, age of the duck, condition, the quality of the food. Use the predicted production amount to plan the next day.
- Persistence: Add settings page with all of the values of the farm with button to persist configuration to a local json file. All changes in configuration and data should also be synced to MEGA Cloud.
- Data Export: Implement functionality to export/import all application data/configuration from/to a local JSON file for local backup.

## Style Guidelines:

- Primary color: Light and modern blue (#64B5F6) to give a sense of reliability.
- Background color: Very light blue (#F0F8FF, HSL 208 100% 97%) for light mode, very dark blue (#080B12, HSL 222.2 84% 4.9%) for dark mode, mirroring the user's specifications.
- Accent color: A slightly darker, analogous blue (#42A5F5) for interactive elements and highlights.
- Body and headline font: 'Inter' (sans-serif) for a clean and modern feel.
- Code font: 'Source Code Pro' (monospace) for displaying data.
- Employ 'Glassmorphism' using translucent backgrounds and backdrop blur (as described in the prompt), consistent with Windows 11 aesthetics.
- Use a set of Windows 11 style icons to maintain visual style parity.