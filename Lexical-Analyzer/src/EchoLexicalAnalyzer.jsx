import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, Trash2, FileText, Sun, Moon, Upload } from 'lucide-react';
import { motion } from "framer-motion";
import logo from "../src/LOGO.svg";
import TextArea from './TextArea';
// ================================================
// E.C.H.O Programming Language Lexical Analyzer
// ================================================

const LexicalAnalyzerTemplate = () => {
  const [sourceCode, setSourceCode] = useState('');         // User's input source code
  const [tokens, setTokens] = useState([]);                 // Tokenized result from analysis
  const [analyzing, setAnalyzing] = useState(false);        // Loading state during analysis
  const [uploadedSample, setUploadedSample] = useState(''); // Uploaded sample code
  const textareaRef = useRef(null);                         // Reference to textarea for cursor control
  const fileInputRef = useRef(null);                        // Reference to file input for upload

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setSourceCode(content);
        setUploadedSample(content);
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid text file (.txt)');
    }
  };

  // ========================================
  // Token Types for E.C.H.O Language
  // ========================================
  const TOKEN_TYPES = {
    // Keywords
    KEYWORD_PROGRAM: 'KEYWORD_PROGRAM',
    KEYWORD_DATATYPE: 'KEYWORD_DATATYPE',
    KEYWORD_LOOP: 'KEYWORD_LOOP',
    KEYWORD_CONDITIONAL: 'KEYWORD_CONDITIONAL',
    KEYWORD_RESERVED: 'KEYWORD_RESERVED',
    NOISE_WORD: 'NOISE_WORD',
    
    // Identifiers and Literals
    IDENTIFIER: 'IDENTIFIER',
    NUMBER_LITERAL: 'NUMBER_LITERAL',
    DECIMAL_LITERAL: 'DECIMAL_LITERAL',
    STRING_LITERAL: 'STRING_LITERAL',
    BOOLEAN_LITERAL: 'BOOLEAN_LITERAL',
    
    // Operators
    ASSIGNMENT_OP: 'ASSIGNMENT_OP',
    ARITHMETIC_OP: 'ARITHMETIC_OP',
    UNARY_OP: 'UNARY_OP',
    LOGICAL_OP: 'LOGICAL_OP',
    RELATIONAL_OP: 'RELATIONAL_OP',
    
    // Delimiters
    DELIMITER: 'DELIMITER',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    LBRACKET: 'LBRACKET',
    RBRACKET: 'RBRACKET',
    COMMA: 'COMMA',
    COLON: 'COLON',
    
    // Special
    STRING_INSERTION: 'STRING_INSERTION',
    COMMENT_SINGLE: 'COMMENT_SINGLE',
    COMMENT_MULTI: 'COMMENT_MULTI',
    WHITESPACE: 'WHITESPACE',
    NEWLINE: 'NEWLINE',
    UNKNOWN: 'UNKNOWN',

    // Indentation tokens
    INDENT: 'INDENT',
    DEDENT: 'DEDENT',
    EOF: 'EOF'
  };

  // ========================================
  // E.C.H.O Language Keywords
  // ========================================
  const KEYWORDS = {
    // Program keywords
    function: 'KEYWORD_PROGRAM',
    start: 'KEYWORD_PROGRAM',
    end: 'KEYWORD_PROGRAM',
    echo: 'KEYWORD_PROGRAM',
    input: 'KEYWORD_PROGRAM',
    return: 'KEYWORD_RESERVED',
    struct: 'KEYWORD_RESERVED',
    
    // Data types
    number: 'KEYWORD_DATATYPE',
    decimal: 'KEYWORD_DATATYPE',
    string: 'KEYWORD_DATATYPE',
    boolean: 'KEYWORD_DATATYPE',
    list: 'KEYWORD_DATATYPE',
    
    // Loop keywords
    for: 'KEYWORD_LOOP',
    while: 'KEYWORD_LOOP',
    do: 'KEYWORD_LOOP',
    
    // Conditional keywords
    if: 'KEYWORD_CONDITIONAL',
    else: 'KEYWORD_CONDITIONAL',
    switch: 'KEYWORD_CONDITIONAL',
    case: 'KEYWORD_CONDITIONAL',
    default: 'KEYWORD_CONDITIONAL',
    
    // Reserved words
    null: 'KEYWORD_RESERVED',
    true: 'BOOLEAN_LITERAL',
    false: 'BOOLEAN_LITERAL',
    continue: 'KEYWORD_RESERVED',
    break: 'KEYWORD_RESERVED',
    new: 'KEYWORD_RESERVED',
    this: 'KEYWORD_RESERVED',
    
    // Noise words
    with: 'NOISE_WORD',
    to: 'NOISE_WORD',
    by: 'NOISE_WORD'
  };

  // ========================================
  // E.C.H.O Lexical Analysis Logic
  // ========================================
   const lexicalAnalyzer = (rawCode) => {
    let code = rawCode || '';
    const tokenList = [];  // Accumulator for recognized tokens
    let line = 1;          // Current line number (starts at 1)
    let i = 0;             // Current position in source code string
    
    code = code.replace(/\u00A0/g, ' ');
    code = code.replace(/[\u200B-\u200D\uFEFF]/g, '');

    const tabSize = 4; 
    const indentStack = [0]; 
    let atLineStart = true;  

    //DEDENT
    const emitDedentsTo = (targetIndent) => {
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > targetIndent) {
        indentStack.pop();
        tokenList.push({ line, type: 'DEDENT', lexeme:'⇤'});
      }

    };

    while (i < code.length) {
      if (code[i] === '\r') {
        if (code[i + 1] === '\n') {
          i++;
          continue;
        } else {
          i++;
          continue;
        }
      }

      const char = code[i];
      //WHITESPACE
      if (atLineStart) {
        let indentCount = 0;
        let j = i;
        while (j < code.length && (code[j] === ' ' || code[j] === '\t' || code[j] === '\u00A0')) {
          indentCount += code[j] === '\t' ? tabSize : 1;
          j++;
        }
        if (j < code.length && code[j] === '\n') {
          const wsLexeme = code.slice(i, j); 
          tokenList.push({ line, type: 'WHITESPACE', lexeme: '␣' });
          i = j + 1;
          line++;
          atLineStart = true;
          continue;
        }

        if (j >= code.length) {
          const wsLexeme = code.slice(i, j);
          if (wsLexeme.length > 0) {
            tokenList.push({ line, type: 'WHITESPACE', lexeme: '␣' });
          } else {
            tokenList.push({ line, type: 'WHITESPACE', lexeme: '␣' });
          }
          i = j;
          break;
        }

        //INDENT
        const topIndent = indentStack[indentStack.length - 1];
        if (indentCount > topIndent) {
          indentStack.push(indentCount);
          tokenList.push({ line, type: 'INDENT', lexeme: '⇥'.repeat(indentCount) });
        } else if (indentCount < topIndent) {
          emitDedentsTo(indentCount);
        }
        i = j;
        atLineStart = false;
        continue;
      }
      //NEWLINE
      if (char === ' ' || char === '\t' || char === '\u00A0') {
        i++;
        continue;
      }
      if (char === '\n') {
        tokenList.push({ line, type: 'NEWLINE', lexeme: '/n' });
        line++;
        i++;
        atLineStart = true;
        continue;
      }
      // =======================================
      // Single-line comment detection: //
      // =======================================
      // Comments extend until the end of the line
      if (char === '/' && code[i + 1] === '/') {
        let comment = '';
        i += 2;
        while (i < code.length && code[i] !== '\n') {
          comment += code[i];
          i++;
        }
        tokenList.push({ line, type: 'COMMENT_SINGLE', lexeme: '//' + comment });
        continue;
      }

      // =======================================
      // Multi-line comment detection: /* */
      // =======================================
      // Comments can span multiple lines until closing */
      if (char === '/' && code[i + 1] === '*') {
        let comment = '/*';
        i += 2;
        while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
          if (code[i] === '\n') line++;  
          comment += code[i];
          i++;
        }
        if (i < code.length - 1) {
          comment += '*/';
          i += 2;
        }
        tokenList.push({ line, type: 'COMMENT_MULTI', lexeme: comment });
        continue;
      }

      // ========================================
      // String literal detection: "text"
      // ========================================
      // Strings can contain escape sequences and embedded variable references
      if (char === '"') {
        let currentSegment = '';
        let startLine = line;
        i++;
        
        // Process string contents until closing quote is found
        while (i < code.length && code[i] !== '"') {
          // When @ is encountered, split the string into segments
          if (code[i] === '@') {
            // If we have accumulated text before the @, save it as a string literal
            if (currentSegment.length > 0) {
              tokenList.push({ 
                line: startLine, 
                type: 'STRING_LITERAL', 
                lexeme: '"' + currentSegment + '"' 
              });
              currentSegment = '';
              startLine = line;
            }
            
            // Helper functions to identify valid identifier characters
            const isLetter = (c) => /[A-Za-z]/.test(c);
            const isDigit = (c) => /[0-9]/.test(c);
            
            // Build the string insertion token (e.g., @variableName)
            let lexeme = '@';
            let j = i + 1;
            
            // Collect identifier characters following the @ symbol
            if (j < code.length && (isLetter(code[j]) || code[j] === '_')) {
              while (
                j < code.length &&
                (isLetter(code[j]) || isDigit(code[j]) || code[j] === '_')
              ) {
                lexeme += code[j];
                j++;
              }
            }
            
            // Create token for the string insertion
            tokenList.push({
              line: line,
              type: 'STRING_INSERTION',
              lexeme: lexeme
            });
            
            i = j;
            continue;
          }

          if (code[i] === '\\' && i + 1 < code.length) {
            currentSegment += code[i] + code[i + 1];
            i += 2;
            continue;
          }

          if (code[i] === '\n') {
            line++;
          }

          currentSegment += code[i];
          i++;
        }
        
        // Save any remaining string segment after the last @ or if no @ was found
        if (currentSegment.length > 0) {
          tokenList.push({ 
            line: startLine, 
            type: 'STRING_LITERAL', 
            lexeme: '"' + currentSegment + '"' 
          });
        }
        
        // Skip the closing quote
        if (i < code.length) {
          i++;
        }
        continue;
      }

      // ====================================================
      // Number literal detection: integers and decimals
      // ====================================================
      // Supports: 123, -45, +67, 3.14, -2.5

      if (
        /\d/.test(char) ||                                              // Starts with digit
        ((char === '+' || char === '-') && /\d/.test(code[i + 1])) ||   // Signed number
        (char === '.' && /\d/.test(code[i + 1]))                        // Decimal starting with .
      ) {
        let num = '';
        let isDecimal = false;
        let hasExponent = false;

        // Handle optional sign prefix (+ or -)
        if (char === '+' || char === '-') {
          num += char;
          i++;
        }

        // Collect number digits, decimal point, and exponent
        while (i < code.length) {
          const c = code[i];

          // Accumulate digits
          if (/\d/.test(c)) {
            num += c;
            i++;
            continue;
          }

          // Handle decimal point (only one allowed, before exponent)
          if (c === '.' && !isDecimal && !hasExponent) {
            isDecimal = true;
            num += c;
            i++;
            continue;
          }

          // Handle scientific notation (e or E)
          if ((c === 'e' || c === 'E') && !hasExponent) {
            hasExponent = true;
            num += c;
            i++;
            if (code[i] === '+' || code[i] === '-') {
              num += code[i];
              i++;
            }
            if (i >= code.length || !/\d/.test(code[i])) {
              break;
            }
            continue;
          }
          break;
        }

        // Determine token type: decimal if it has . or e/E, otherwise integer
        tokenList.push({
          line,
          type: (isDecimal || hasExponent) ? 'DECIMAL_LITERAL' : 'NUMBER_LITERAL',
          lexeme: num
        });
        continue;
      }

      // ===================================
      // Identifier and keyword detection
      // ===================================
      // Identifiers start with letter or underscore, followed by letters, digits, or underscores

      if (/[a-zA-Z_]/.test(char)) {
        let word = '';
        // Collect all valid identifier characters
        while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
          word += code[i];
          i++;
        }
        // Check if word is a keyword (case-insensitive matching)
        const lowerWord = word.toLowerCase();
        const tokenType = KEYWORDS[lowerWord] || 'IDENTIFIER';
        
        tokenList.push({ line, type: tokenType, lexeme: word });
        continue;
      }

      // ================================================
      // String insertion symbol (@)
      // ================================================
      // Handles cases like: @variable outside of string literals
      if (char === '@') {
        // Helper functions to identify valid identifier characters
        const isLetter = (c) => /[A-Za-z]/.test(c);
        const isDigit = (c) => /[0-9]/.test(c);

        let lexeme = '@';
        let j = i + 1;

        // Collect identifier characters following @
        if (isLetter(code[j]) || code[j] === '_') {
          while (
            j < code.length &&
            (isLetter(code[j]) || isDigit(code[j]) || code[j] === '_')
          ) {
            lexeme += code[j];
            j++;
          }
        }

        tokenList.push({
          line,
          type: 'STRING_INSERTION',
          lexeme
        });

        i = j;
        continue;
      }
      
      // ======================
      // Operator detection
      // ======================
      const nxt = code[i + 1] || "";  // Next character (or empty string if at end)

      // Unary operators: increment and decrement
      if (char === "+" && nxt === "+") {
        tokenList.push({ line, type: 'UNARY_OP', lexeme: "++" });
        i += 2;
        continue;
      }
      if (char === "-" && nxt === "-") {
        tokenList.push({ line, type: 'UNARY_OP', lexeme: "--" });
        i += 2;
        continue;
      }

      // Compound assignment operators: +=, -=, *=, /=, %=
      if ((char === "+" || char === "-" || char === "*" || char === "/" || char === "%") && nxt === "=") {
        tokenList.push({ line, type: 'ASSIGNMENT_OP', lexeme: char + nxt });
        i += 2;
        continue;
      }

      // Equality and inequality operators: ==, !=
      if (char === "=" && nxt === "=") {
        tokenList.push({ line, type: 'RELATIONAL_OP', lexeme: "==" });
        i += 2;
        continue;
      }
      if (char === "!" && nxt === "=") {
        tokenList.push({ line, type: 'RELATIONAL_OP', lexeme: "!=" });
        i += 2;
        continue;
      }

      // Relational operators with equals: >=, <=
      if ((char === ">" || char === "<") && nxt === "=") {
        tokenList.push({ line, type: 'RELATIONAL_OP', lexeme: char + nxt });
        i += 2;
        continue;
      }

      // Logical operators: || (OR), && (AND)
      if (char === "|" && nxt === "|") {
        tokenList.push({ line, type: 'LOGICAL_OP', lexeme: "||" });
        i += 2;
        continue;
      }
      if (char === "&" && nxt === "&") {
        tokenList.push({ line, type: 'LOGICAL_OP', lexeme: "&&" });
        i += 2;
        continue;
      }

      // Simple assignment operator: =
      if (char === "=") {
        tokenList.push({ line, type: 'ASSIGNMENT_OP', lexeme: "=" });
        i++;
        continue;
      }

      // Logical NOT operator: !
      if (char === "!") {
        tokenList.push({ line, type: 'LOGICAL_OP', lexeme: "!" });
        i++;
        continue;
      }

      // Relational comparison operators: <, >
      if (char === "<" || char === ">") {
        tokenList.push({ line, type: 'RELATIONAL_OP', lexeme: char });
        i++;
        continue;
      }

      // Arithmetic operators: +, -, *, /, %, ^
      if ("+-*/%^".includes(char)) {
        tokenList.push({ line, type: 'ARITHMETIC_OP', lexeme: char });
        i++;
        continue;
      }

      // Delimiters
      //COMMA
      if (char === ',') {
        tokenList.push({ line, type: 'COMMA', lexeme: char });
        i++;
        continue;
      }

      //COLON
      if (char === ':') {
        tokenList.push({ line, type: 'COLON', lexeme: ':' });
        i++;
        continue;
      }

      //LEFT PARENTHESIS
      if (char === '(') {
        tokenList.push({ line, type: 'LPAREN', lexeme: char });
        i++;
        continue;
      }

      //RIGHT PARENTHESIS
      if (char === ')') {
        tokenList.push({ line, type: 'RPAREN', lexeme: char });
        i++;
        continue;
      }

      //LEFT BRACKET
      if (char === '[') {
        tokenList.push({ line, type: 'LBRACKET', lexeme: char });
        i++;
        continue;
      }

      //RIGHT BRACKET
      if (char === ']') {
        tokenList.push({ line, type: 'RBRACKET', lexeme: char });
        i++;
        continue;
      }

      // If we reach here, it's an unknown/unrecognized character
      tokenList.push({ line, type: 'UNKNOWN', lexeme: char });
      i++;
    }

    // At EOF: emit DEDENTs to return to baseline (0)
    emitDedentsTo(0);

    // Add end-of-file marker to indicate completion
    tokenList.push({ line, type: 'EOF', lexeme: '' });
        
    return tokenList;
  };

  // ========================================
  // Helper Functions
  // ========================================
  
  // Loads a sample E.C.H.O program into the source code textarea
  const loadSampleCode = () => {
    if (uploadedSample) {
      setSourceCode(uploadedSample);
    } else {
      const sample = `start
number x = 10
decimal y = 20.5
string name = "Alice"
boolean flag = true

if x > 5
 echo "x is greater than 5"
end if

for i = 1 to 10
 echo "Count: @i"
end for

function number add(number a, number b)
 return a + b
end function

echo "Result: @x"
end`;
      setSourceCode(sample);
    }
  };

const loadComplexSample = () => {
    if (uploadedSample) {
      setSourceCode(uploadedSample);
    } else {
      const complexSample = 
`START

struct CustomerRecord :
 Name: string (capitalizeName),
 Age: integer (validateAge),
 ZipCode: string (validateZipCode)

// Bound Functions

function validateAge(value)
 if value >= 18 then
  return true
 else
  error("Age must be 18 or older.") 
   return false 
 end if
end function

function capitalizeName(value)
 return capitalizeEachWord(value) 
end function

function validateZipCode(value)
 if length(value) == 5 then
  return true
 else
  error("ZipCode must be 5 digits.") 
   return false
 end if
end function

// Scenario 1: Successful creation and transformation

// Input Name is lowercase ("jane doe")
myCustomer = CustomerRecord new:
 Name: "jane doe",
 Age: 25,
 ZipCode: "90210"

echo "Transformed Name in Object: @myCustomer.Name" // Output: Jane Doe
echo "Age: @myCustomer.Age"
echo "ZipCode: @myCustomer.ZipCode"

// Scenario 2: Failed validation (Age < 18)

// This operation would typically trigger a runtime error in ECHO

youngCustomer = CustomerRecord new:
 Name: "Billy",
 Age: 16,  // Fails validateAge
 ZipCode: "12345"

echo "Object creation status: FAILED"

END`;
      setSourceCode(complexSample);
    }
  };

  // Token type to color mapping for UI display
  const getTokenTypeColor = (type) => {
    const colors = {
      KEYWORD_PROGRAM: 'bg-indigo-100 text-indigo-800',
      KEYWORD_DATATYPE: 'bg-blue-100 text-blue-800',
      KEYWORD_LOOP: 'bg-indigo-200 text-indigo-800',
      KEYWORD_CONDITIONAL: 'bg-indigo-300 text-indigo-900',
      KEYWORD_RESERVED: 'bg-indigo-50 text-indigo-700',
      NOISE_WORD: 'bg-lime-50 text-lime-700',
      IDENTIFIER: 'bg-green-100 text-green-800',
      NUMBER_LITERAL: 'bg-amber-100 text-amber-800',
      DECIMAL_LITERAL: 'bg-amber-200 text-amber-900',
      STRING_LITERAL: 'bg-amber-300 text-amber-900',
      BOOLEAN_LITERAL: 'bg-amber-50 text-amber-700',
      ASSIGNMENT_OP: 'bg-teal-600 text-teal-50',
      ARITHMETIC_OP: 'bg-teal-100 text-teal-800',
      UNARY_OP: 'bg-teal-200 text-teal-800',
      LOGICAL_OP: 'bg-teal-300 text-teal-900',
      RELATIONAL_OP: 'bg-teal-400 text-teal-900',
      COMMENT_SINGLE: 'bg-emerald-50 text-emerald-700',
      COMMENT_MULTI: 'bg-emerald-50 text-emerald-700',
      STRING_INSERTION: 'text-yellow-700 bg-yellow-50',
      LPAREN: 'bg-slate-100 text-slate-700',
      RPAREN: 'bg-slate-100 text-slate-700',
      LBRACKET: 'bg-slate-100 text-slate-700',
      RBRACKET: 'bg-slate-100 text-slate-700',
      COMMA: 'bg-slate-100 text-slate-700',
      DELIMITER: 'bg-slate-100 text-slate-700',
      WHITESPACE: 'bg-teal-50 text-teal-700',
      NEWLINE: 'bg-violet-50 text-violet-700',
      UNKNOWN: 'bg-red-100 text-red-800',
      INDENT: 'bg-cyan-100 text-cyan-800',
      DEDENT: 'bg-rose-50 text-rose-800',
      EOF: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'text-gray-700 bg-gray-50';
  };

  // ========================================
  // Event Handlers
  // ========================================

  // Initiates lexical analysis on the current source code
  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const result = lexicalAnalyzer(sourceCode);
      setTokens(result);
      setAnalyzing(false);
    }, 300);
  };

  // Clears the source code input and token results
  const handleClear = () => {
    setSourceCode('');
    setTokens([]);
    setUploadedSample(null);
  };


  // Handles Tab key press in textarea to insert tab character
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();  // Prevent default tab behavior (focus change)
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab character at cursor position
      const newText = sourceCode.substring(0, start) + '\t' + sourceCode.substring(end);
      setSourceCode(newText);
      
      // Restore cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + 1;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
        }
      }, 0);
    }
  };

  // ========================================
  // UI Components
  // ========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 p-6 flex justify-center items-start">
      <div className="w-full max-w-7xl">
         <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src={logo}
            alt="E.C.H.O logo"
            role="img"
            className="w-20 h-20 sm:w-20 sm:h-20 object-contain"
          />
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
         className="text-5xl font-black text-cyan-400 dark:text-cyan-300 leading-tight"
        >
          ECHO Lexical Analyzer
        </motion.h1>
        </div>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10 text-lg">
          Executable Code, Human Output
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                Source Code Input
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                  <Sun className="w-5 h-5 dark:hidden" />
                  <Moon className="w-5 h-5 hidden dark:block" />
                </button>
                <button
                  onClick={loadSampleCode}
                  className="px-3 py-2 sm:px-4 bg-cyan-200 hover:bg-yellow-300 text-gray-700 rounded-md transition-colors text-xs sm:text-sm font-medium"
                >
                  Load Sample
                </button>
                <button
                  onClick={loadComplexSample}
                  className="px-3 py-2 sm:px-4 bg-cyan-200 hover:bg-green-300 text-gray-700 rounded-md transition-colors text-xs sm:text-sm font-medium"
                >
                  ECHO Code
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-2 sm:px-4 bg-purple-200 hover:bg-purple-300 text-gray-700 rounded-md transition-colors text-xs sm:text-sm font-medium flex items-center gap-1"
                >
                  <Upload size={14} />
                  Upload File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

              <div className="mb-4 h-[510px] min-w-0">
            <TextArea
              value={sourceCode}
              onChange={setSourceCode}
              textareaRef={textareaRef}
              className={"w-full h-full bg-transparent text-white font-mono text-sm leading-6 " +
                            "py-3 px-3 box-border rounded-md border border-blue-300 " +
                              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
             }
           />
        </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={handleAnalyze}
                disabled={!sourceCode || analyzing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors text-sm sm:text-base"
              >
                <PlayCircle size={18} className="sm:w-5 sm:h-5" />
                <span>{analyzing ? "Analyzing..." : "Analyze Code"}</span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors text-sm sm:text-base"
              >
                <Trash2 size={18} className="sm:w-5 sm:h-5" />
                <span>Clear</span>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700 flex flex-col"
          >
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Token Analysis Results
            </h2>

             <div className="h-[500px] sm:h-[520px] overflow-auto rounded-xl bg-transparent text-slate-50 p-4 font-mono text-sm border border-slate-700 shadow-inner">
              {tokens.length === 0 ? (
                <div className="min-h-[200px] flex items-center justify-center text-gray-400">
                  <div className="text-center px-4">
                    <FileText size={48} className="sm:w-16 sm:h-16 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 opacity-30" />
                    <p className="text-base sm:text-lg text-gray-500 mb-2">No tokens to display</p>
                    <p className="text-xs sm:text-sm text-gray-400">Enter code and click "Analyze Code"</p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-md bg-transparent h-full overflow-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[600px]">
                    <thead className="bg-slate-900/70 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left font-semibold text-gray-200 border-b border-gray-700 whitespace-nowrap">Line No.</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left font-semibold text-gray-200 border-b border-gray-700 whitespace-nowrap">Token Type</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left font-semibold text-gray-200 border-b border-gray-700">Lexeme</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((token, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-slate-800 transition-colors">
                          <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-300 font-mono whitespace-nowrap">{token.line}</td>
                          <td className="px-2 sm:px-3 md:px-4 py-2">
                            <span className={`px-2 py-1 sm:px-3 rounded-md text-xs font-semibold inline-block ${getTokenTypeColor(token.type)}`}>
                              {token.type}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-2 font-mono text-gray-200 break-words break-all">{token.lexeme}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

          <div className="col-span-2 flex justify-center">
            <div className="mt-6 w-full max-w-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-4 rounded-lg shadow-md border border-white/30 dark:border-slate-700">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-200 mb-3 sm:mb-4 text-center">Token Type Legend</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                {[
                  { type: 'KEYWORD_PROGRAM', label: 'Program Keywords' },
                  { type: 'KEYWORD_LOOP', label: 'Loop Keywords' },
                  { type: 'KEYWORD_CONDITIONAL', label: 'Conditionals' },
                  { type: 'KEYWORD_RESERVED', label: 'Reserved Words' },
                  { type: 'KEYWORD_DATATYPE', label: 'Data Types' },
                  { type: 'STRING_LITERAL', label: 'Strings' },
                  { type: 'NUMBER_LITERAL', label: 'Numbers' },
                  { type: 'DECIMAL_LITERAL', label: 'Decimals' },
                  { type: 'BOOLEAN_LITERAL', label: 'Booleans' },
                  { type: 'ARITHMETIC_OP', label: 'Arithmetic' },
                  { type: 'ASSIGNMENT_OP', label: 'Assignment' },
                  { type: 'LOGICAL_OP', label: 'Logical' },
                  { type: 'RELATIONAL_OP', label: 'Relational' },
                  { type: 'UNARY_OP', label: 'Unary' },
                  { type: 'IDENTIFIER', label: 'Identifiers' },
                  { type: 'COMMENT_SINGLE', label: 'Single-line Comments //' },
                  { type: 'COMMENT_MULTI', label: 'Multi-line Comments /* */' },
                  { type: 'LPAREN', label: 'Left Paren (' },
                  { type: 'RPAREN', label: 'Right Paren )' },
                  { type: 'LBRACKET', label: 'Left Bracket [' },
                  { type: 'RBRACKET', label: 'Right Bracket ]' },
                  { type: 'COMMA', label: 'Comma' },
                  { type: 'STRING_INSERTION', label: 'String Insertion (@)' },
                  { type: 'NOISE_WORD', label: 'Noise Words' },
                  { type: 'WHITESPACE', label: 'Whitespace' },
                  { type: 'NEWLINE', label: 'Newline' },
                  { type: 'INDENT', label: 'INDENT' },
                  { type: 'DEDENT', label: 'DEDENT' },
                  { type: 'UNKNOWN', label: 'Unknown' },
                ].map((item) => (
                  <span
                    key={item.type}
                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold ${getTokenTypeColor(item.type)}`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LexicalAnalyzerTemplate;