# E.C.H.O Lexical Analyzer

## Overview
- **Purpose:** Tokenize E.C.H.O (Executable Code, Human Output) source code in the browser.
- **What you get:** A React-based playground that lists tokens, line numbers, and categories in real time.

## Highlights
- **Live editor:** Type or paste code and watch tokens update instantly.
- **Smart display:** Color-coded table plus legend for quick scanning.
- **Sample loader:** Try the analyzer without writing code first.
- **Responsive UI:** Works on desktop, tablet, and phone.

## Getting Started
1. Install Node.js 16+ and npm.
2. Clone this repo and install dependencies:
   ```
   npm install
   ```
3. Launch the dev server:
   ```
   npm run dev
   ```
4. Visit `http://localhost:5173` (Vite picks another port if needed).

## Usage
1. Enter E.C.H.O code or click **Load Sample**.
2. Press **Analyze Code** to generate tokens.
3. Review line numbers, token types, and lexemes in the results table.

### Minimal E.C.H.O example
```echo
start
number x = 10
echo "Result: @x"
end
```

## Contributing & License
- Contributions are welcome for educational improvements.
- Provided **as-is** for learning and experimentation; no warranty implied.
