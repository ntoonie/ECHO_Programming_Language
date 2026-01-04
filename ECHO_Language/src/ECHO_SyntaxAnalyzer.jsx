// ============================================================================
// E.C.H.O Programming Language Lexical & Syntax Analyzer
// ============================================================================

import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { PlayCircle, Trash2, FileText, Sun, Moon, Upload, ChevronRight, ChevronDown } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import logo from "../src/LOGO.svg";
import TextArea from './TextArea';

const ECHOSyntaxAnalyzer = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [sourceCode, setSourceCode] = useState('');
  const [tokens, setTokens] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedSample, setUploadedSample] = useState('');
  const [history, setHistory] = useState([{ code: '', timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('tokens');
  const [derivationType, setDerivationType] = useState('leftmost');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // ========================================================================
  // THEME MANAGEMENT
  // ========================================================================
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme === 'dark';
    const root = window.document.documentElement;
    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return shouldBeDark;
  });

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    void html.offsetHeight;
  }, [isDarkMode]);

  const handleThemeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newMode = !isDarkMode;
    const html = document.documentElement;
    if (newMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    void html.offsetHeight;
    setIsDarkMode(newMode);
  };

  // ========================================================================
  // CUSTOM SCROLLBAR STYLES
  // ========================================================================
  useEffect(() => {
    const styleId = 'custom-vertical-scrollbar-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .custom-vertical-scrollbar,
      .custom-vertical-scrollbar textarea {
        overflow-y: auto !important;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar {
        width: 12px;
        -webkit-appearance: none;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar-track,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar-track {
        background: rgba(148, 163, 184, 0.2);
        border-radius: 6px;
        margin: 4px;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar-thumb,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.5);
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover,
      textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.7);
        background-clip: padding-box;
      }
      .dark .custom-vertical-scrollbar::-webkit-scrollbar-track,
      .dark textarea.custom-vertical-scrollbar::-webkit-scrollbar-track {
        background: rgba(71, 85, 105, 0.5);
        margin: 4px;
      }
      .dark .custom-vertical-scrollbar::-webkit-scrollbar-thumb,
      .dark textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.6);
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .dark .custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover,
      .dark textarea.custom-vertical-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.8);
        background-clip: padding-box;
      }
      .custom-vertical-scrollbar,
      textarea.custom-vertical-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(148, 163, 184, 0.5) rgba(148, 163, 184, 0.2);
      }
      .dark .custom-vertical-scrollbar,
      .dark textarea.custom-vertical-scrollbar {
        scrollbar-color: rgba(100, 116, 139, 0.6) rgba(71, 85, 105, 0.5);
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  // ========================================================================
  // UNDO/REDO SYSTEM
  // ========================================================================
  const addToHistory = useCallback((code) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ code, timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSourceCode(history[newIndex].code);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSourceCode(history[newIndex].code);
    }
  }, [history, historyIndex]);

  const handleSourceCodeChange = useCallback((newCode) => {
    setSourceCode(newCode);
    addToHistory(newCode);
  }, [addToHistory]);

  // ========================================================================
  // TOKEN TYPE DEFINITIONS & KEYWORD MAPPINGS
  // ========================================================================
  const TOKEN_TYPES = {
    KEYWORD_PROGRAM: 'KW_P',
    KEYWORD_DATATYPE: 'KW_T',
    KEYWORD_LOOP: 'KW_L',
    KEYWORD_CONDITIONAL: 'KW_C',
    KEYWORD_RESERVED: 'KW_R',
    KEYWORD_START: 'KW_START',
    KEYWORD_END: 'KW_END',
    NOISE_WORD: 'NW',
    IDENTIFIER: 'ID',
    NUMBER_LITERAL: 'NUM',
    DECIMAL_LITERAL: 'DEC',
    STRING_LITERAL: 'STR',
    BOOLEAN_LITERAL: 'BOOL',
    ASSIGNMENT_OP: 'OP_ASG',
    ARITHMETIC_OP: 'OP_AR',
    UNARY_OP: 'OP_UN',
    LOGICAL_OP: 'OP_LOG',
    RELATIONAL_OP: 'OP_REL',
    DELIMITER_LEFT_PAREN: 'DEL_LPAR',
    DELIMITER_RIGHT_PAREN: 'DEL_RPAR',
    DELIMITER_LEFT_BRACKET: 'DEL_LBRACK',
    DELIMITER_RIGHT_BRACKET: 'DEL_RBRACK',
    DELIMITER_LEFT_BRACE: 'DEL_LBRACE',
    DELIMITER_RIGHT_BRACE: 'DEL_RBRACE',
    DELIMITER_COLON: 'DEL_COL',
    DELIMITER_COMMA: 'DEL_COMMA',
    DELIMITER_SEMICOLON: 'DEL_SEMI',
    DELIMITER: 'DEL',
    STRING_INSERTION: 'SIS',
    COMMENT_SINGLE: 'CMT',
    COMMENT_MULTI: 'CMT',
    UNKNOWN: 'UNK',
    ERROR: 'ERR',
  };

  const KEYWORDS = {
    function: TOKEN_TYPES.KEYWORD_PROGRAM,
    start: TOKEN_TYPES.KEYWORD_START,
    end: TOKEN_TYPES.KEYWORD_END,
    echo: TOKEN_TYPES.KEYWORD_PROGRAM,
    input: TOKEN_TYPES.KEYWORD_PROGRAM,
    return: TOKEN_TYPES.KEYWORD_RESERVED,
    struct: TOKEN_TYPES.KEYWORD_RESERVED,
    data: TOKEN_TYPES.KEYWORD_RESERVED,
    number: TOKEN_TYPES.KEYWORD_DATATYPE,
    decimal: TOKEN_TYPES.KEYWORD_DATATYPE,
    string: TOKEN_TYPES.KEYWORD_DATATYPE,
    boolean: TOKEN_TYPES.KEYWORD_DATATYPE,
    list: TOKEN_TYPES.KEYWORD_DATATYPE,
    for: TOKEN_TYPES.KEYWORD_LOOP,
    while: TOKEN_TYPES.KEYWORD_LOOP,
    do: TOKEN_TYPES.KEYWORD_LOOP,
    if: TOKEN_TYPES.KEYWORD_CONDITIONAL,
    else: TOKEN_TYPES.KEYWORD_CONDITIONAL,
    then: TOKEN_TYPES.KEYWORD_CONDITIONAL,
    switch: TOKEN_TYPES.KEYWORD_CONDITIONAL,
    case: TOKEN_TYPES.KEYWORD_CONDITIONAL,
    default: TOKEN_TYPES.KEYWORD_CONDITIONAL,
    null: TOKEN_TYPES.KEYWORD_RESERVED,
    true: TOKEN_TYPES.BOOLEAN_LITERAL,
    false: TOKEN_TYPES.BOOLEAN_LITERAL,
    continue: TOKEN_TYPES.KEYWORD_RESERVED,
    break: TOKEN_TYPES.KEYWORD_RESERVED,
    new: TOKEN_TYPES.KEYWORD_RESERVED,
    this: TOKEN_TYPES.KEYWORD_RESERVED,
    with: TOKEN_TYPES.NOISE_WORD,
    to: TOKEN_TYPES.NOISE_WORD,
    by: TOKEN_TYPES.NOISE_WORD
  };

  // ========================================================================
  // LEXICAL ANALYZER
  // ========================================================================
  const isLetter = (c) => /[A-Za-z]/.test(c);
  const isDigit = (c) => /[0-9]/.test(c);

  const lexicalAnalyzer = (rawCode) => {
    let code = rawCode || '';
    const tokenList = [];
    const delimiterStack = [];
    let line = 1;
    let i = 0;
    
    code = code.replace(/\u00A0/g, ' ');
    code = code.replace(/[\u200B-\u200D\uFEFF]/g, '');

    while (i < code.length) {
      if (code[i] === '\r') {
        i++;
        continue;
      }

      const char = code[i];

      if (char === ' ' || char === '\t' || char === '\u00A0') {
        i++;
        continue;
      }
      if (char === '\n') {
        line++;
        i++;
        continue;
      }

      if (char === '/' && code[i + 1] === '/') {
        let prevNonWhitespace = null;
        let j = i - 1;
        while (j >= 0 && (code[j] === ' ' || code[j] === '\t')) {
          j--;
        }
        if (j >= 0 && code[j] !== '\n' && code[j] !== '\r') {
          prevNonWhitespace = code[j];
        }
        
        const isComment = prevNonWhitespace === null || 
                         prevNonWhitespace === '\n' || 
                         prevNonWhitespace === '\r';
        
        if (isComment) {
          let comment = '';
          i += 2;
          while (i < code.length && code[i] !== '\n') {
            comment += code[i];
            i++;
          }
          tokenList.push({ line, type: TOKEN_TYPES.COMMENT_SINGLE, lexeme: '//' + comment });
          continue;
        }
      }

      if (char === '/' && code[i + 1] === '*') {
        let comment = '/*';
        const startLine = line;
        i += 2;
        while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
          if (code[i] === '\n') line++;  
          comment += code[i];
          i++;
        }
        if (i < code.length - 1) {
          comment += '*/';
          i += 2;
          tokenList.push({ line: startLine, type: TOKEN_TYPES.COMMENT_MULTI, lexeme: comment });
        } else {
          tokenList.push({
            line: startLine,
            type: TOKEN_TYPES.ERROR,
            lexeme: comment,
            message: `Unterminated block comment: missing closing '*/'`
          });
          i = code.length;
        }
        continue;
      }

      if (char === '"') {
        let currentSegment = '';
        let startLine = line;
        i++;
        let sawClosingQuote = false;
        let stringErrored = false;
        
        while (i < code.length && code[i] !== '"') {
          if (code[i] === '@') {
            if (currentSegment.length > 0) {
              tokenList.push({ 
                line: startLine, 
                type: TOKEN_TYPES.STRING_LITERAL, 
                lexeme: '"' + currentSegment + '"' 
              });
              currentSegment = '';
              startLine = line;
            }
            
            let lexeme = '@';
            let j = i + 1;
            
            if (j < code.length && (isLetter(code[j]) || code[j] === '_')) {
              while (
                j < code.length &&
                (isLetter(code[j]) || isDigit(code[j]) || code[j] === '_')
              ) {
                lexeme += code[j];
                j++;
              }
            }
            
            tokenList.push({
              line: line,
              type: TOKEN_TYPES.STRING_INSERTION,
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
            tokenList.push({
              line: startLine,
              type: TOKEN_TYPES.ERROR,
              lexeme: currentSegment,
              message: `Unterminated string literal: newline found before closing quote`
            });
            stringErrored = true;
            i++;
            break;
          }

          currentSegment += code[i];
          i++;
        }
        
        if (stringErrored) continue;

        if (i < code.length && code[i] === '"') {
          sawClosingQuote = true;
        }

        if (currentSegment.length > 0) {
          tokenList.push({ 
            line: startLine, 
            type: TOKEN_TYPES.STRING_LITERAL, 
            lexeme: '"' + currentSegment + '"' 
          });
        }
        
        if (sawClosingQuote) {
          i++;
        } else {
          tokenList.push({
            line: startLine,
            type: TOKEN_TYPES.ERROR,
            lexeme: currentSegment,
            message: `Unterminated string literal: missing closing quote (")`
          });
        }
        continue;
      }

      if (
        /\d/.test(char) ||
        ((char === '+' || char === '-') && /\d/.test(code[i + 1])) ||
        (char === '.' && /\d/.test(code[i + 1]))
      ) {
        let num = '';
        let isDecimal = false;
        let hasExponent = false;
        let invalidNumber = false;
        let digitsAfterDot = 0;
        let exponentDigits = 0;
        let afterDot = false;
        let inExponent = false;

        if (char === '+' || char === '-') {
          num += char;
          i++;
        }

        while (i < code.length) {
          const c = code[i];

          if (/\d/.test(c)) {
            num += c;
            if (inExponent) {
              exponentDigits++;
            } else if (afterDot) {
              digitsAfterDot++;
            }
            i++;
            continue;
          }

          if (c === '.' && !isDecimal && !hasExponent) {
            isDecimal = true;
            num += c;
            i++;
            afterDot = true;
            continue;
          }

          if ((c === 'e' || c === 'E') && !hasExponent) {
            hasExponent = true;
            num += c;
            i++;
            inExponent = true;
            afterDot = false;
            if (code[i] === '+' || code[i] === '-') {
              num += code[i];
              i++;
            }
            if (i >= code.length || !/\d/.test(code[i])) {
              invalidNumber = true;
              break;
            }
            continue;
          }
          break;
        }

        if (
          invalidNumber ||
          (isDecimal && digitsAfterDot === 0) ||
          (hasExponent && exponentDigits === 0)
        ) {
          let errorMsg = 'Invalid number format';
          if (invalidNumber) {
            errorMsg = 'Invalid number: exponent must be followed by digits';
          } else if (isDecimal && digitsAfterDot === 0) {
            errorMsg = 'Invalid decimal: must have digits after decimal point';
          } else if (hasExponent && exponentDigits === 0) {
            errorMsg = 'Invalid number: exponent must have digits';
          }
          tokenList.push({
            line,
            type: TOKEN_TYPES.ERROR,
            lexeme: num,
            message: errorMsg
          });
        } else {
          tokenList.push({
            line,
            type: (isDecimal || hasExponent) ? TOKEN_TYPES.DECIMAL_LITERAL : TOKEN_TYPES.NUMBER_LITERAL,
            lexeme: num
          });
        }
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let word = '';
        while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
          word += code[i];
          i++;
        }
        
        if (word.length > 64) {
          tokenList.push({
            line,
            type: TOKEN_TYPES.ERROR,
            lexeme: word,
            message: 'Identifier exceeds maximum length of 64 characters'
          });
          continue;
        }
        
        const lowerWord = word.toLowerCase();
        const tokenType = KEYWORDS[lowerWord] || TOKEN_TYPES.IDENTIFIER;
        
        tokenList.push({ line, type: tokenType, lexeme: word });
        continue;
      }

      if (char === '@') {
        let lexeme = '@';
        let j = i + 1;

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
          type: TOKEN_TYPES.STRING_INSERTION,
          lexeme
        });

        i = j;
        continue;
      }
      
      const operatorChars = "<>!=&|+-*/%^?";
      if (operatorChars.includes(char)) {
        let j = i;
        while (j < code.length && operatorChars.includes(code[j])) {
          j++;
        }
        const run = code.slice(i, j);

        const singleOps = new Set(["<", ">", "=", "+", "-", "*", "/", "%", "^", "!", "?"]);
        const doubleOps = new Set([
          "<=", ">=", "==", "!=",
          "++", "--",
          "+=", "-=", "*=", "/=", "%=", "^=",
          "&&", "||",
          "//"
        ]);

        if (run.length === 1 && singleOps.has(run)) {
          const type =
            run === "=" ? TOKEN_TYPES.ASSIGNMENT_OP :
            (run === "<" || run === ">") ? TOKEN_TYPES.RELATIONAL_OP :
            run === "!" ? TOKEN_TYPES.LOGICAL_OP :
            run === "?" ? TOKEN_TYPES.UNKNOWN :
            TOKEN_TYPES.ARITHMETIC_OP;
          tokenList.push({ line, type, lexeme: run });
        } else if (run.length === 2 && doubleOps.has(run)) {
          const type =
            ["<=", ">=", "==", "!="].includes(run) ? TOKEN_TYPES.RELATIONAL_OP :
            ["++", "--"].includes(run) ? TOKEN_TYPES.UNARY_OP :
            ["&&", "||"].includes(run) ? TOKEN_TYPES.LOGICAL_OP :
            run === "//" ? TOKEN_TYPES.ARITHMETIC_OP :
            TOKEN_TYPES.ASSIGNMENT_OP;
          tokenList.push({ line, type, lexeme: run });
        } else {
          tokenList.push({ 
            line, 
            type: TOKEN_TYPES.ERROR, 
            lexeme: run,
            message: `Invalid operator sequence: '${run}'`
          });
        }

        i = j;
        continue;
      }

      const openerDelimiters = {
        '(': TOKEN_TYPES.DELIMITER_LEFT_PAREN,
        '[': TOKEN_TYPES.DELIMITER_LEFT_BRACKET,
        '{': TOKEN_TYPES.DELIMITER_LEFT_BRACE,
      };
      const closerDelimiters = {
        ')': { token: TOKEN_TYPES.DELIMITER_RIGHT_PAREN, match: '(' },
        ']': { token: TOKEN_TYPES.DELIMITER_RIGHT_BRACKET, match: '[' },
        '}': { token: TOKEN_TYPES.DELIMITER_RIGHT_BRACE, match: '{' },
      };
      const simpleDelimiters = {
        ',': TOKEN_TYPES.DELIMITER_COMMA,
        ':': TOKEN_TYPES.DELIMITER_COLON,
      };

      if (openerDelimiters[char]) {
        tokenList.push({ line, type: openerDelimiters[char], lexeme: char });
        delimiterStack.push({ char, line });
        i++;
        continue;
      }

      if (closerDelimiters[char]) {
        tokenList.push({ line, type: closerDelimiters[char].token, lexeme: char });
        const expected = closerDelimiters[char].match;
        const last = delimiterStack.pop();
        if (!last || last.char !== expected) {
          const expectedChar = expected;
          const foundChar = last ? last.char : 'none';
          tokenList.push({
            line,
            type: TOKEN_TYPES.ERROR,
            lexeme: char,
            message: `Unmatched closing delimiter '${char}'. Expected '${expectedChar}' but found '${foundChar}'`
          });
        }
        i++;
        continue;
      }

      if (simpleDelimiters[char]) {
        tokenList.push({ line, type: simpleDelimiters[char], lexeme: char });
        i++;
        continue;
      }

      if (char === ';') {
        tokenList.push({ 
          line, 
          type: TOKEN_TYPES.ERROR, 
          lexeme: char,
          message: 'Unexpected delimiter: semicolon (;) is not allowed in E.C.H.O'
        });
        i++;
        continue;
      }

      if (char === '\\') {
        tokenList.push({ 
          line, 
          type: TOKEN_TYPES.UNKNOWN, 
          lexeme: char,
          message: 'Backslash found outside string literal'
        });
        i++;
        continue;
      }

      tokenList.push({ 
        line, 
        type: TOKEN_TYPES.UNKNOWN, 
        lexeme: char,
        message: `Unknown character: '${char}' (not recognized as valid token)`
      });
      i++;
    }
    
    while (delimiterStack.length > 0) {
      const unmatched = delimiterStack.pop();
      const expectedCloser = unmatched.char === '(' ? ')' : 
                             unmatched.char === '[' ? ']' : 
                             unmatched.char === '{' ? '}' : '';
      tokenList.push({
        line: unmatched.line,
        type: TOKEN_TYPES.ERROR,
        lexeme: unmatched.char,
        message: `Unmatched opening delimiter '${unmatched.char}' at line ${unmatched.line}. Expected closing '${expectedCloser}'`
      });
    }

    return tokenList;
  };

  // ========================================================================
  // SYNTAX ANALYZER (Placeholder - Currently unused)
  // ========================================================================
  const syntaxAnalyzer = (tokenList) => {
    const syntaxErrors = [];
    
    const isDataType = (type) => type === TOKEN_TYPES.KEYWORD_DATATYPE;
    const isIdentifier = (type) => type === TOKEN_TYPES.IDENTIFIER;
    const isAssignment = (type) => type === TOKEN_TYPES.ASSIGNMENT_OP;
    
    for (let i = 0; i < tokenList.length; i++) {
      const token = tokenList[i];
      
      if (token.type === TOKEN_TYPES.COMMENT_SINGLE || 
          token.type === TOKEN_TYPES.COMMENT_MULTI ||
          token.type === TOKEN_TYPES.NOISE_WORD) {
        continue;
      }
      
      if (isDataType(token.type)) {
        const nextToken = tokenList[i + 1];
        if (!nextToken) {
          syntaxErrors.push({
            line: token.line,
            type: 'syntax',
            message: `Expected identifier after type '${token.lexeme}'`
          });
          continue;
        }
        
        if (isAssignment(nextToken.type)) {
          syntaxErrors.push({
            line: token.line,
            type: 'syntax',
            message: `Expected identifier. Found '${nextToken.lexeme}'`
          });
          continue;
        }
        
        if (!isIdentifier(nextToken.type) && 
            nextToken.type !== TOKEN_TYPES.KEYWORD_START && 
            nextToken.type !== TOKEN_TYPES.KEYWORD_END && 
            nextToken.type !== TOKEN_TYPES.KEYWORD_PROGRAM &&
            nextToken.type !== TOKEN_TYPES.KEYWORD_LOOP &&
            nextToken.type !== TOKEN_TYPES.KEYWORD_CONDITIONAL) {
          syntaxErrors.push({
            line: token.line,
            type: 'syntax',
            message: `Expected identifier after type '${token.lexeme}'. Found '${nextToken.lexeme}'`
          });
        }
      }
    }
    
    return syntaxErrors;
  };

  // ========================================================================
  // SAMPLE CODE LOADERS
  // ========================================================================
  const loadSampleCode = () => {
    if (uploadedSample) {
      handleSourceCodeChange(uploadedSample);
    } else {
      const sample = `start
number x = 10
decimal y = 20.5
string name = "Alice"
boolean flag = true

if x > 5
\techo "x is greater than 5"
end if

for i = 1 to 10
\techo "Count: @i"
end for

function number add(number a, number b)
\treturn a + b
end function

echo "Result: @x"
end`;
      handleSourceCodeChange(sample);
    }
  };

  const loadComplexSample = () => {
    if (uploadedSample) {
      handleSourceCodeChange(uploadedSample);
    } else {
      const complexSample = 
`START

struct CustomerRecord :
 Name: string (capitalizeName),
 Age: integer (validateAge),
 ZipCode: string (validateZipCode)

// Bound Functions

function validateAge(value)
\tif value >= 18 then
\t\treturn true
\telse
\t\terror("Age must be 18 or older.") 
\t\treturn false 
\tend if
end function

function capitalizeName(value)
\treturn capitalizeEachWord(value) 
end function

function validateZipCode(value)
\tif length(value) == 5 then
\t\treturn true
\telse
\t\terror("ZipCode must be 5 digits.") 
\t\treturn false
\tend if
end function

// Scenario 1: Successful creation and transformation

// Input Name is lowercase ("jane doe")
myCustomer = CustomerRecord new:
\tName: "jane doe",
\tAge: 25,
\tZipCode: "90210"

echo "Transformed Name in Object: @myCustomer.Name" // Output: Jane Doe
echo "Age: @myCustomer.Age"
echo "ZipCode: @myCustomer.ZipCode"

// Scenario 2: Failed validation (Age < 18)

// This operation would typically trigger a runtime error in ECHO

youngCustomer = CustomerRecord new:
\tName: "Billy",
\tAge: 16,  // Fails validateAge
\tZipCode: "12345"

echo "Object creation status: FAILED"

END`;
      handleSourceCodeChange(complexSample);
    }
  };

  // ========================================================================
  // TOKEN TYPE STYLING
  // ========================================================================
  const getTokenTypeColor = (type) => {
    const colors = {
      KW_P: 'bg-indigo-100 text-indigo-800',
      KW_T: 'bg-blue-100 text-blue-800',
      KW_L: 'bg-indigo-200 text-indigo-800',
      KW_C: 'bg-indigo-300 text-indigo-900',
      KW_R: 'bg-indigo-50 text-indigo-700',
      KW_START: 'bg-indigo-500 text-indigo-50',
      KW_END: 'bg-indigo-500 text-indigo-50',
      NW: 'bg-lime-50 text-lime-700',
      ID: 'bg-green-100 text-green-800',
      NUM: 'bg-amber-100 text-amber-800',
      DEC: 'bg-amber-200 text-amber-900',
      STR: 'bg-amber-300 text-amber-900',
      BOOL: 'bg-amber-50 text-amber-700',
      OP_ASG: 'bg-teal-600 text-teal-50',
      OP_AR: 'bg-teal-100 text-teal-800',
      OP_UN: 'bg-teal-200 text-teal-800',
      OP_LOG: 'bg-teal-300 text-teal-900',
      OP_REL: 'bg-teal-400 text-teal-900',
      CMT: 'bg-emerald-50 text-emerald-700',
      SIS: 'text-yellow-700 bg-yellow-50',
      DEL: 'bg-slate-100 text-slate-700',
      DEL_LPAR: 'bg-slate-100 text-slate-700',
      DEL_RPAR: 'bg-slate-100 text-slate-700',
      DEL_LBRACK: 'bg-slate-100 text-slate-700',
      DEL_RBRACK: 'bg-slate-100 text-slate-700',
      DEL_LBRACE: 'bg-slate-100 text-slate-700',
      DEL_RBRACE: 'bg-slate-100 text-slate-700',
      DEL_COL: 'bg-slate-100 text-slate-700',
      DEL_COMMA: 'bg-slate-100 text-slate-700',
      DEL_SEMI: 'bg-slate-100 text-slate-700',
      UNK: 'bg-red-100 text-red-800',
      ERR: 'bg-red-600 text-red-50',
    };
    return colors[type] || 'text-gray-700 bg-gray-50';
  };

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const result = lexicalAnalyzer(sourceCode);
      setTokens(result);
      setAnalyzing(false);
    }, 300);
  };

  const handleClear = () => {
    handleSourceCodeChange('');
    setTokens([]);
    setUploadedSample(null);
    setHistory([{ code: '', timestamp: Date.now() }]);
    setHistoryIndex(0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          handleSourceCodeChange(content);
          setUploadedSample(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newText = sourceCode.substring(0, start) + '\t' + sourceCode.substring(end);
      handleSourceCodeChange(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + 1;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
        }
      }, 0);
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
        return;
      }
    }
  };

  // ========================================================================
  // TAB COMPONENTS
  // ========================================================================
  const TokensTab = () => {
    return (
      <div className="w-full p-4 flex justify-center items-start min-w-full">
        {tokens.length === 0 ? (
          <div className="w-full flex items-center justify-center text-gray-400 min-h-[400px]">
            <div className="text-center px-4">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-base text-gray-500 mb-2">No tokens to display</p>
              <p className="text-sm text-gray-400">Enter code and click "Analyze Code"</p>
            </div>
          </div>
        ) : (
          <div className="w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-slate-900/50 shadow-sm">
            <table className="w-full text-sm min-w-[600px] border-collapse">
              <thead className="bg-white/80 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur border-b-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-200 text-center border-r border-gray-200 dark:border-gray-700">Line No.</th>
                  <th className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-200 text-center border-r border-gray-200 dark:border-gray-700">Token Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-200 text-center">Lexeme</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-center text-slate-800 dark:text-gray-300 font-medium border-r border-gray-200 dark:border-gray-700">
                      {token.line}
                    </td>
                    <td className="px-6 py-3 text-center border-r border-gray-200 dark:border-gray-700">
                      <span className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block ${getTokenTypeColor(token.type)}`}>
                        {token.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center font-mono text-slate-900 dark:text-gray-200 break-words break-all">
                      {token.lexeme}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const ParseTreeTab = () => {
    // ========================================
    // TODO: Add Parse Tree Logic Here
    // ========================================
    // This section should:
    // 1. Call the parser function with the tokenized tokens
    // 2. Build the parse tree data structure from the parser output
    // 3. Format the tree data for the TreeNode component
    // ========================================
    
    // Placeholder tree data structure
    const parseTreeData = null; // Will be populated by parser logic
    
    const TreeNode = ({ node, level = 0 }) => {
      if (!node) {
        return (
          <div className="w-full flex items-center justify-center min-h-[400px]">
            <div className="text-center px-4 py-8 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-slate-900/50 shadow-sm max-w-md">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-gray-400 italic text-base mb-2">Parse tree will be displayed here</p>
              <p className="text-sm text-gray-500">once parsing logic is implemented.</p>
            </div>
          </div>
        );
      }
      
      const nodeId = `${level}-${node.type || node.value}`;
      const isExpanded = expandedNodes.has(nodeId);
      const isNonTerminal = node.children && node.children.length > 0;
      
      return (
        <div className="select-none">
          <div
            className={`flex items-center gap-2 py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer ${
              isNonTerminal 
                ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                : 'text-green-600 dark:text-green-400 font-mono'
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => {
              if (isNonTerminal) {
                const newExpanded = new Set(expandedNodes);
                if (isExpanded) {
                  newExpanded.delete(nodeId);
                } else {
                  newExpanded.add(nodeId);
                }
                setExpandedNodes(newExpanded);
              }
            }}
          >
            {isNonTerminal && (
              <span className="text-xs">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
            <span className={isNonTerminal ? 'font-semibold' : 'font-mono text-sm'}>
              {node.type || node.value}
            </span>
            {node.value && isNonTerminal && (
              <span className="text-xs text-gray-500 font-normal">({node.value})</span>
            )}
          </div>
          {isNonTerminal && isExpanded && node.children && (
            <div>
              {node.children.map((child, idx) => (
                <TreeNode key={idx} node={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div className="w-full p-4 flex justify-center items-start">
        <div className="w-full max-w-full">
          <TreeNode node={parseTreeData} />
        </div>
      </div>
    );
  };

  const DerivationTab = () => {
    // ========================================
    // TODO: Add Derivation Logic Here
    // ========================================
    // This section should:
    // 1. Call the parser function with the tokenized tokens
    // 2. Generate derivation steps based on the derivationType state
    //    - 'leftmost': leftmost derivation steps
    //    - 'rightmost': rightmost derivation steps
    // 3. Format each step as a string for display
    // ========================================
    
    // Placeholder derivation data
    const derivationSteps = []; // Will be populated by parser logic
    
    return (
      <div className="w-full p-4 flex flex-col justify-start items-center">
        <div className="w-full mb-6 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Derivation Type:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDerivationType('leftmost')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                derivationType === 'leftmost'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Leftmost
            </button>
            <button
              onClick={() => setDerivationType('rightmost')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                derivationType === 'rightmost'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Rightmost
            </button>
          </div>
        </div>
        
        <div className="w-full max-w-full">
          {derivationSteps.length === 0 ? (
            <div className="w-full flex items-center justify-center min-w-[300px]">
              <div className="text-center px-4 py-8 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-slate-900/50 shadow-sm">
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-gray-400 italic text-base mb-2">Derivation steps will be displayed here</p>
                <p className="text-sm text-gray-500 mb-2">once parsing logic is implemented.</p>
                <p className="text-sm text-gray-400 mt-4">Current mode: <strong className="text-blue-600 dark:text-blue-400">{derivationType}</strong> derivation</p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3 min-w-[600px]">
              {derivationSteps.map((step, idx) => (
                <div key={idx} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Step {idx + 1}:</span> {step}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ParsingTraceTab = () => {
    // ========================================
    // TODO: Add Parsing Trace Logic Here
    // ========================================
    // This section should:
    // 1. Call the parser function with the tokenized tokens
    // 2. Capture trace entries during parsing (recursive calls, rule applications, etc.)
    // 3. Format trace entries with timestamps and function details
    // ========================================
    
    // Placeholder trace data
    const traceEntries = []; // Will be populated by parser logic
    
    return (
      <div className="h-full w-full overflow-auto overflow-x-hidden custom-vertical-scrollbar p-4 flex justify-center items-start">
        {traceEntries.length === 0 ? (
          <div className="h-full flex items-center justify-center min-w-[300px]">
            <div className="text-center px-4 py-8 border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-slate-900/50 shadow-sm">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-gray-400 italic text-base mb-2">Parsing trace will be displayed here</p>
              <p className="text-sm text-gray-500 mb-2">once parsing logic is implemented.</p>
              <p className="text-sm text-gray-400">This will show chronological log of parser's recursive calls.</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-full space-y-3 min-w-[600px]">
            {traceEntries.map((entry, idx) => (
              <div key={idx} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-xs border-l-4 border-blue-500 shadow-sm">
                <div className="text-blue-600 dark:text-blue-400 font-semibold mb-2">
                  [{entry.timestamp}] {entry.function}
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  {entry.details}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SymbolTableTab = () => {
    // ========================================
    // TODO: Add Symbol Table Logic Here
    // ========================================
    // This section should:
    // 1. Call the parser function with the tokenized tokens
    // 2. Build the symbol table during parsing (identifiers, variables, functions, etc.)
    // 3. Track scope information for each symbol
    // 4. Format symbol data for table display
    // ========================================
    
    // Placeholder symbol table data
    const symbolTable = []; // Will be populated by parser logic
    
    return (
      <div className="w-full p-4 flex justify-center items-start">
        {symbolTable.length === 0 ? (
          <div className="w-full flex items-center justify-center text-gray-400 min-h-[400px]">
            <div className="text-center px-4">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-base text-gray-500 mb-2">No symbols in table</p>
              <p className="text-sm text-gray-400">Symbol table will be populated once parsing logic is implemented.</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-slate-900/50 shadow-sm">
            <table className="w-full text-sm min-w-[600px] border-collapse">
              <thead className="bg-white/80 dark:bg-slate-900/80 sticky top-0 z-10 backdrop-blur border-b-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-200 text-center border-r border-gray-200 dark:border-gray-700">Identifier</th>
                  <th className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-200 text-center border-r border-gray-200 dark:border-gray-700">Type</th>
                  <th className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-200 text-center border-r border-gray-200 dark:border-gray-700">Scope</th>
                  <th className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-200 text-center">Value</th>
                </tr>
              </thead>
              <tbody>
                {symbolTable.map((symbol, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-3 text-center font-mono text-slate-900 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">{symbol.identifier}</td>
                    <td className="px-6 py-3 text-center text-slate-800 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">{symbol.type}</td>
                    <td className="px-6 py-3 text-center text-slate-800 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">{symbol.scope}</td>
                    <td className="px-6 py-3 text-center font-mono text-slate-800 dark:text-gray-300">{symbol.value || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ========================================================================
  // MAIN UI LAYOUT
  // ========================================================================
  const tabs = [
    { id: 'tokens', label: 'Tokens' },
    { id: 'parseTree', label: 'Parse Tree' },
    { id: 'derivation', label: 'Derivation' },
    { id: 'parsingTrace', label: 'Parsing Trace' },
    { id: 'symbolTable', label: 'Symbol Table' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 p-6">
      <div className="w-full max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src={logo}
            alt="E.C.H.O logo"
            role="img"
            className="w-20 h-20 object-contain"
          />
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-cyan-400 dark:text-cyan-300 leading-tight"
          >
            ECHO Lexical & Syntax Analyzer
          </motion.h1>
        </div>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10 text-lg">
          Executable Code, Human Output
        </p>

        {/* Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Panel: Source Code Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700 flex flex-col h-[850px]"
          >
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                Source Code Editor
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleThemeToggle}
                  aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-700" />
                  )}
                </button>
                <button
                  onClick={loadSampleCode}
                  className="px-3 py-2 bg-cyan-200 hover:bg-yellow-300 text-gray-700 rounded-md transition-colors text-xs sm:text-sm font-medium"
                >
                  Load Sample
                </button>
                <button
                  onClick={loadComplexSample}
                  className="px-3 py-2 bg-cyan-200 hover:bg-green-300 text-gray-700 rounded-md transition-colors text-xs sm:text-sm font-medium"
                >
                  ECHO Code
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-3 py-2 bg-purple-200 hover:bg-purple-300 text-gray-700 rounded-md transition-colors text-xs sm:text-sm font-medium flex items-center gap-1"
                >
                  <Upload size={14} />
                  Upload
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

            <div className="flex-1 min-h-0 flex flex-col min-w-0">
              <TextArea
                value={sourceCode}
                onChange={handleSourceCodeChange}
                textareaRef={textareaRef}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent text-slate-900 dark:text-white font-mono text-sm leading-6 py-3 px-3 box-border rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none custom-vertical-scrollbar"
              />
            </div>

            <div className="flex justify-between items-center mt-4 flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 text-xs font-medium rounded transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 text-xs font-medium rounded transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  Redo
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={!sourceCode || analyzing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors text-sm"
                >
                  <PlayCircle size={18} />
                  <span>{analyzing ? "Analyzing..." : "Analyze Code"}</span>
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors text-sm"
                >
                  <Trash2 size={18} />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Panel: Tabbed Visualizers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/30 dark:border-slate-700 flex flex-col h-[850px]"
          >
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex-shrink-0">
              Analysis Visualizers
            </h2>

            {/* Tabs */}
            <div className="flex border-b border-slate-300 dark:border-slate-700 mb-4 overflow-x-auto flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-vertical-scrollbar">
                <div className="w-full">
                  {activeTab === 'tokens' && <TokensTab />}
                  {activeTab === 'parseTree' && <ParseTreeTab />}
                  {activeTab === 'derivation' && <DerivationTab />}
                  {activeTab === 'parsingTrace' && <ParsingTraceTab />}
                  {activeTab === 'symbolTable' && <SymbolTableTab />}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Token Type Legend */}
        <div className="mt-6 w-full bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl p-4 rounded-lg shadow-md border border-white/30 dark:border-slate-700">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-200 mb-3 sm:mb-4 text-center">Token Type Legend</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {[
              { type: 'KW_START', label: 'Start Keyword (KW_START)' },
              { type: 'KW_END', label: 'End Keyword (KW_END)' },
              { type: 'KW_P', label: 'Program Keywords (KW_P)' },
              { type: 'KW_L', label: 'Loop Keywords (KW_L)' },
              { type: 'KW_C', label: 'Conditionals (KW_C)' },
              { type: 'KW_R', label: 'Reserved Words (KW_R)' },
              { type: 'KW_T', label: 'Data Types (KW_T)' },
              { type: 'ID', label: 'Identifiers (ID)' },
              { type: 'NUM', label: 'Numbers (NUM)' },
              { type: 'DEC', label: 'Decimals (DEC)' },
              { type: 'STR', label: 'Strings (STR)' },
              { type: 'BOOL', label: 'Booleans (BOOL)' },
              { type: 'OP_AR', label: 'Arithmetic Operators (OP_AR)' },
              { type: 'OP_ASG', label: 'Assignment Operators (OP_ASG)' },
              { type: 'OP_LOG', label: 'Logical Operators (OP_LOG)' },
              { type: 'OP_REL', label: 'Relational Operators (OP_REL)' },
              { type: 'OP_UN', label: 'Unary Operators (OP_UN)' },
              { type: 'DEL_COMMA', label: 'Delimiter Comma , (DEL_COMMA)' },
              { type: 'DEL_COL', label: 'Delimiter Colon : (DEL_COL)' },
              { type: 'DEL_LPAR', label: 'Delimiter Left Parenthesis (DEL_LPAR)' },
              { type: 'DEL_RPAR', label: 'Delimiter Right Parenthesis (DEL_RPAR)' },
              { type: 'DEL_LBRACK', label: 'Delimiter Left Bracket [ (DEL_LBRACK)' },
              { type: 'DEL_RBRACK', label: 'Delimiter Right Bracket ] (DEL_RBRACK)' },
              { type: 'DEL_LBRACE', label: 'Delimiter Left Brace { (DEL_LBRACE)' },
              { type: 'DEL_RBRACE', label: 'Delimiter Right Brace } (DEL_RBRACE)' },
              { type: 'DEL_SEMI', label: 'Delimiter Semicolon ; (DEL_SEMI)' },
              { type: 'DEL', label: 'Other Delimiters (DEL)' },
              { type: 'CMT', label: 'Comments //, /* */ (CMT)' },
              { type: 'SIS', label: 'String Insertion (@) (SIS)' },
              { type: 'NW', label: 'Noise Words (NW)' },
              { type: 'UNK', label: 'Unknown (UNK)' },
              { type: 'ERR', label: 'Error Tokens (ERR)' }
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
  );
};

export default ECHOSyntaxAnalyzer;
