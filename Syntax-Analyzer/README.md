<div align="center">

# 🔍 E.C.H.O Syntax Analyzer

**Real-time lexical and syntax analysis for the ECHO programming language**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.2.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.17-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-Educational-yellow.svg)](LICENSE)

*Executable Code, Human Output*

[Features](#-features) • [Install](#-installation) • [Usage](#-usage) • [Structure](#-structure)

---

</div>

## 📖 Overview

Web-based tokenizer and syntax validator for ECHO source code. Built with **React 19** and **Vite 7** for instant analysis in your browser.

---

## ✨ Features

**Core Analysis**
- 🔬 Lexical tokenization with token type classification
- 🌳 Syntax validation enforcing ECHO grammar rules
- ⚡ Real-time error detection with line/column precision
- 📊 Performance metrics (tokens, lines, analysis time)

**Editor**
- 📝 Line-numbered code editor with syntax highlighting
- 🎯 Click-to-navigate error highlighting
- ⌨️ Undo/redo support with full history
- ✨ Auto-formatter with proper indentation

**Tools**
- 🌓 Dark/light theme toggle
- 📦 Pre-loaded test cases (valid & invalid syntax)
- 📤 File upload (.txt)
- 📥 Export & clipboard copy
- 📱 Fully responsive design

---

## 🛠️ Installation

**Prerequisites:** Node.js 16+ and npm

```bash
# Clone repository
git clone https://github.com/ntoonie/ECHO_Programming_Language.git
cd ECHO_Programming_Language/Syntax-Analyzer

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Build Commands**
```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm run lint     # Check code style
```

---

## 📚 Usage Guide

1. **Enter code** in the editor or **load a sample** from the dropdown
2. Click **Analyze Code** to run lexical and syntax analysis
3. **Review errors** in the right panel with precise line numbers
4. **Click any error** to jump to its location in the code

**Example ECHO Code**
```echo
start
  string message = "Hello, ECHO!"
  number counter = 5
  
  for counter from 1 to 5
    echo "Count: @counter"
  end for
end
```

**Keyboard Shortcuts:** `Ctrl+Z` Undo • `Ctrl+Y` Redo • `Ctrl+K` Format

---

## 📁 Project Structure

```
Syntax-Analyzer/
├── public/
│   └── LOGO.svg              # Logo asset
├── src/
│   ├── components/           # React UI components
│   │   ├── SyntaxDashboard.jsx
│   │   ├── TextArea.jsx
│   │   └── ErrorConsole.jsx
│   ├── core/                 # Language processing
│   │   ├── LexicalScanner.js
│   │   ├── SyntaxAnalyzer.js
│   │   └── TokenTypes.js
│   ├── hooks/                # State management
│   │   ├── useDashboard.js
│   │   └── useTheme.js
│   └── data/                 # Test cases
│       └── codeSamples.js
├── index.html
├── vite.config.js
└── package.json
```

---

## 📦 Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| **React** | 19.2.0 | UI framework with compiler optimizations |
| **Vite** | 7.2.2 | Build tool & dev server |
| **Tailwind CSS** | 4.1.17 | Utility-first styling |
| **Framer Motion** | 12.23.25 | Animation library |
| **Lucide React** | 0.553.0 | Icon components |
| **ESLint** | 9.39.1 | Code linting |

See [`package.json`](package.json) for complete dependency list.

---

<div align="center">

**Built with React, Vite, and Tailwind CSS**

Educational project

</div>
