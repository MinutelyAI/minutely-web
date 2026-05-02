# Minutely Web

The web browser client for Minutely. This project is built using React, Vite, and Tailwind CSS. It consumes `@minutely/shared` for its UI primitives and API connectivity.

## Setup

Ensure you have installed the dependencies:

```bash
cd minutely-web
pnpm install
```

*(Note: Since it depends on `@minutely/shared` via the `file:` protocol, ensure `minutely-shared` is present in the parent directory).*

## How to Run

To run the web application locally for development:

```bash
pnpm run dev
```

This will start the Vite development server. Open the provided `localhost` URL in your browser.

## How to Build

To build the web application for production:

```bash
pnpm run build
```

This will run TypeScript type-checking and bundle the application into the `dist/` directory. You can preview the production build using:

```bash
pnpm run preview
```
