# 🎯 E.C.H.O Lexical Analyzer
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.2.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.17-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-Educational-yellow.svg)](LICENSE)

---

## 📖 Overview

Real-time lexical analyzer that visualizes E.C.H.O source code tokenization. Built with **React 19** and **Vite 7** for instant feedback and educational clarity.

---

## ✨ Features

- ⚡ **Real-Time Tokenization** – Instant visual feedback as you type
- 🎨 **Color-Coded Display** – Keywords, identifiers, operators, and literals
- 📊 **Token Table View** – Line numbers, types, and lexemes at a glance
- 🔖 **Interactive Legend** – Quick reference for token categories
- 📱 **Fully Responsive** – Desktop, tablet, and mobile support
- 🚀 **Sample Code Loader** – Pre-loaded examples for immediate testing

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** ≥ 16.x
- **npm** ≥ 7.x

### Quick Start

```bash
# Clone repository
git clone https://github.com/ntoonie/ECHO_Programming_Language.git
cd ECHO_Programming_Language/Lexical-Analyzer

# Install dependencies
npm install

# Start development server
npm run dev
```

**Open** → `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

---

## 🚀 Usage Guide

1. **Enter Code** – Type E.C.H.O source in the editor
2. **Load Sample** – Click button for example code
3. **Analyze** – Press "Analyze Code" to tokenize
4. **Review** – Examine token table output

### Example Code

```echo
start
    number x = 10
    number y = 20
    number sum = x + y
    echo "The sum is: @sum"
end
```

### 🏷️ Token Categories

| Category | Examples | Color |
|----------|----------|-------|
| **Keywords** | `start`, `end`, `number` | 🔵 Blue |
| **Identifiers** | `x`, `sum` | 🟢 Green |
| **Operators** | `+`, `-`, `=` | 🟠 Orange |
| **Literals** | `42`, `"Hello"` | 🟣 Purple |
| **Delimiters** | `(`, `)`, `,` | ⚫ Gray |

---

## 📂 Project Structure

```plaintext
Lexical-Analyzer/
├── src/
│   ├── components/
│   │   ├── Editor.jsx          # Code input editor
│   │   ├── TokenTable.jsx      # Token display
│   │   └── Legend.jsx          # Token reference
│   ├── lexer/
│   │   └── tokenizer.js        # Tokenization logic
│   ├── App.jsx                 # Main component
│   └── main.jsx                # Entry point
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies
```

---

## 📦 Dependencies

### Production
- **React** `19.2.0` – UI framework
- **React DOM** `19.2.0` – Rendering engine

### Development
- **Vite** `7.2.2` – Build tool & dev server
- **@vitejs/plugin-react** `4.2.0` – React integration
- **ESLint** – Code quality

```bash
npm install react@19.2.0 react-dom@19.2.0
npm install -D vite@7.2.2 @vitejs/plugin-react
```

---

<div align="center">

**Built with React, Vite, and Tailwind CSS**

Educational project

</div>
