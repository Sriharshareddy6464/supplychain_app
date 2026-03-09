# SupplyChain Pro

A React + TypeScript application built with Vite.

## Project Structure

This project uses:
- **React**: UI library
- **TypeScript**: Static typing
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible UI components
- **Shadcn/UI**: Component library (likely, given the `components.json` and structure)
- **Zustand**: State management
- **React Router**: Routing

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown in the terminal (usually `http://localhost:5173`).

3.  **Build for Production**
    ```bash
    npm run build
    ```
    The output will be in the `dist` folder.

4.  **Lint Code**
    ```bash
    npm run lint
    ```

## Environment Variables

Currently, the project does not rely on any specific environment variables for basic functionality. If you need to add any, create a `.env` file in the root directory and use the `VITE_` prefix for variables exposed to the client.

Example `.env`:
```
VITE_API_URL=http://localhost:3000
```
