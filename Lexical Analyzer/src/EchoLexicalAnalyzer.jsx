import React, { useState, useRef } from 'react';
import { PlayCircle, Trash2, FileText } from 'lucide-react';

const LexicalAnalyzerTemplate = () => {
  const [sourceCode, setSourceCode] = useState('');
  const [tokens, setTokens] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const textareaRef = useRef(null);

  // Token Types for E.C.H.O Language
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
    
    // Special
    STRING_INSERTION: 'STRING_INSERTION',
    COMMENT_SINGLE: 'COMMENT_SINGLE',
    COMMENT_MULTI: 'COMMENT_MULTI',
    WHITESPACE: 'WHITESPACE',
    NEWLINE: 'NEWLINE',
    UNKNOWN: 'UNKNOWN'
  };

  // E.C.H.O Language Keywords (case-insensitive)
  const KEYWORDS = {
    // Program keywords
    function: 'KEYWORD_PROGRAM',
    start: 'KEYWORD_PROGRAM',
    end: 'KEYWORD_PROGRAM',
    echo: 'KEYWORD_PROGRAM',
    input: 'KEYWORD_PROGRAM',
    return: 'KEYWORD_RESERVED',
    
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
  // TODO: Implement lexical analysis logic here
  // This function should tokenize the input code
  // ========================================
  const lexicalAnalyzer = (code) => {
    const tokenList = [];
    let line = 1;
    let i = 0;

    while (i < code.length) {
      const char = code[i];

      // Skip whitespace
      if (char === ' ' || char === '\t') {
        i++;
        continue;
      }

      // Handle newlines
      if (char === '\n') {
        line++;
        i++;
        continue;
      }

      // Single-line comment //
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

      // Multi-line comment /* */
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

      // TODO: Add logic for:
      // - String literals
      // - Numbers (integers and decimals)
      // - Identifiers and keywords (case-insensitive)
      // - String Insertion Symbol (@)
      // - Operators
      // - Delimiters
      // - Unknown tokens

      // Placeholder: treat everything as unknown for now
      tokenList.push({ 
        line, 
        type: 'UNKNOWN', 
        lexeme: char 
      });
      i++;
    }

    return tokenList;
  };

  const loadSampleCode = () => {
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
  };

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
      COMMENT: 'bg-emerald-50 text-emerald-700',
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
    };
    return colors[type] || 'text-gray-700 bg-gray-50';
  };

  // ========================================
  // Event Handlers
  // ========================================
  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const result = lexicalAnalyzer(sourceCode);
      setTokens(result);
      setAnalyzing(false);
    }, 300);
  };

  const handleClear = () => {
    setSourceCode('');
    setTokens([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newText = sourceCode.substring(0, start) + '\t' + sourceCode.substring(end);
      setSourceCode(newText);
      
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
            ECHO Lexical Analyzer
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 px-2">
            Executable Code, Human Output
          </p>
        </div>

        {/* Source Code Input Section */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={20} className="sm:w-6 sm:h-6" />
              <span>Source Code Input</span>
            </h2>
            <button
              onClick={loadSampleCode}
              className="px-3 py-2 sm:px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto"
            >
              Load Sample
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your code here..."
            className="w-full h-48 sm:h-56 md:h-64 p-3 sm:p-4 border border-gray-300 rounded-md font-mono text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            spellCheck={false}
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3 sm:mt-4">
            <button
              onClick={handleAnalyze}
              disabled={!sourceCode || analyzing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors text-sm sm:text-base"
            >
              <PlayCircle size={18} className="sm:w-5 sm:h-5" />
              <span>{analyzing ? 'Analyzing...' : 'Analyze Code'}</span>
            </button>
            
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors text-sm sm:text-base"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Token Analysis Results Section */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            Token Analysis Results
          </h2>

          {tokens.length === 0 ? (
            <div className="min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex items-center justify-center text-gray-400">
              <div className="text-center px-4">
                <FileText size={48} className="sm:w-16 sm:h-16 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 opacity-30" />
                <p className="text-base sm:text-lg text-gray-500 mb-2">No tokens to display</p>
                <p className="text-xs sm:text-sm text-gray-400">Enter code and click "Analyze Code"</p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-md overflow-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px]">
              <table className="w-full text-xs sm:text-sm min-w-[600px]">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                      Line No.
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left font-semibold text-gray-700 border-b border-gray-300 whitespace-nowrap">
                      Token Type
                    </th>
                    <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left font-semibold text-gray-700 border-b border-gray-300">
                      Lexeme
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, index) => (
                    <tr 
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-600 font-mono whitespace-nowrap">
                        {token.line}
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2">
                        <span className={`px-2 py-1 sm:px-3 rounded-md text-xs font-semibold inline-block ${getTokenTypeColor(token.type)}`}>
                          {token.type}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 md:px-4 py-2 font-mono text-gray-900 break-words break-all">
                        {token.lexeme}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Token Type Legend */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Token Type Legend</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
       // Keywords (indigo family)
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
              { type: 'DELIMITER', label: 'Braces { }' },
              { type: 'LPAREN', label: 'Left Paren (' },
              { type: 'RPAREN', label: 'Right Paren )' },
              { type: 'LBRACKET', label: 'Left Bracket [' },
              { type: 'RBRACKET', label: 'Right Bracket ]' },
              { type: 'COMMA', label: 'Comma' },
              { type: 'STRING_INSERTION', label: 'String Insertion (@)' },
              { type: 'NOISE_WORD', label: 'Noise Words' },
              { type: 'WHITESPACE', label: 'Whitespace' },
              { type: 'NEWLINE', label: 'Newline' },
              { type: 'UNKNOWN', label: 'Unknown' },
            ].map((item) => (
              <span
                key={item.type}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-semibold ${getTokenTypeColor(item.type)}`}
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

export default LexicalAnalyzerTemplate;