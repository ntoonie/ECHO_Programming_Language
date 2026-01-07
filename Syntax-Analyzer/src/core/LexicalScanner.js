import { TOKEN_TYPES, KEYWORDS } from './TokenTypes';

/**
 * =========================================
 * Lexical Scanner – Token Analysis
 * =========================================
 */

const isLetter = (c) => /[A-Za-z]/.test(c);
const isDigit = (c) => /[0-9]/.test(c);

export const lexicalAnalyzer = (rawCode) => {
  let code = rawCode || '';
  const tokenList = [];
  let line = 1;
  let column = 1;
  let i = 0;
  
  // Normalize whitespace to prevent invisible character issues.
  code = code.replace(/\u00A0/g, ' ');
  code = code.replace(/[\u200B-\u200D\uFEFF]/g, '');

  while (i < code.length) {
    if (code[i] === '\r') {
      i++;
      continue;
    }

    const char = code[i];

    if (char === ' ' || char === '\u00A0') {
      column++;
      i++;
      continue;
    }
    if (char === '\t') {
      column += 4; // Standard tab width
      i++;
      continue;
    }
    if (char === '\n') {
      line++;
      column = 1; // Reset column on new line
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
      
      // Only treat '//' as comment if it starts a line to prevent conflict with division.
      const isComment = prevNonWhitespace === null || 
                       prevNonWhitespace === '\n' || 
                       prevNonWhitespace === '\r';
      
      if (isComment) {
        const startColumn = column;
        let comment = '';
        column += 2;
        i += 2;
        while (i < code.length && code[i] !== '\n') {
          comment += code[i];
          column++;
          i++;
        }
        tokenList.push({ line, column: startColumn, type: TOKEN_TYPES.COMMENT_SINGLE, lexeme: '//' + comment });
        continue;
      }
    }

    if (char === '/' && code[i + 1] === '*') {
      let comment = '/*';
      const startLine = line;
      const startColumn = column;
      column += 2;
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
        comment += code[i];
        i++;
      }
      if (i < code.length - 1) {
        comment += '*/';
        column += 2;
        i += 2;
      }
      tokenList.push({ line: startLine, column: startColumn, type: TOKEN_TYPES.COMMENT_MULTI, lexeme: comment });
      continue;
    }

    if (char === '"') {
      let currentSegment = '';
      let startLine = line;
      let startColumn = column;
      column++;
      i++;
      
      while (i < code.length && code[i] !== '"') {
        // Handle string interpolation (@variable) by splitting into separate tokens.
        if (code[i] === '@') {
          if (currentSegment.length > 0) {
            tokenList.push({ 
              line: startLine,
              column: startColumn,
              type: TOKEN_TYPES.STRING_LITERAL, 
              lexeme: '"' + currentSegment + '"' 
            });
            currentSegment = '';
            startLine = line;
            startColumn = column;
          }
          
          const interpolationColumn = column;
          let lexeme = '@';
          column++;
          let j = i + 1;
          
          if (j < code.length && (isLetter(code[j]) || code[j] === '_')) {
            while (
              j < code.length &&
              (isLetter(code[j]) || isDigit(code[j]) || code[j] === '_')
            ) {
              lexeme += code[j];
              column++;
              j++;
            }
          }
          
          tokenList.push({
            line: line,
            column: interpolationColumn,
            type: TOKEN_TYPES.STRING_INSERTION,
            lexeme: lexeme
          });
          
          i = j;
          continue;
        }

        if (code[i] === '\\' && i + 1 < code.length) {
          currentSegment += code[i] + code[i + 1];
          column += 2;
          i += 2;
          continue;
        }

        if (code[i] === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }

        currentSegment += code[i];
        i++;
      }

      if (currentSegment.length > 0) {
        tokenList.push({ 
          line: startLine,
          column: startColumn,
          type: TOKEN_TYPES.STRING_LITERAL, 
          lexeme: '"' + currentSegment + '"' 
        });
      }
      
      if (i < code.length && code[i] === '"') {
        column++;
        i++;
      }
      continue;
    }

    if (
      /\d/.test(char) ||
      ((char === '+' || char === '-') && /\d/.test(code[i + 1])) ||
      (char === '.' && /\d/.test(code[i + 1]))
    ) {
      const startColumn = column;
      let num = '';
      let isDecimal = false;
      let hasExponent = false;

      if (char === '+' || char === '-') {
        num += char;
        column++;
        i++;
      }

      while (i < code.length) {
        const c = code[i];

        if (/\d/.test(c)) {
          num += c;
          column++;
          i++;
          continue;
        }

        if (c === '.' && !isDecimal && !hasExponent) {
          isDecimal = true;
          num += c;
          column++;
          i++;
          continue;
        }

        if ((c === 'e' || c === 'E') && !hasExponent) {
          hasExponent = true;
          num += c;
          column++;
          i++;
          if (code[i] === '+' || code[i] === '-') {
            num += code[i];
            column++;
            i++;
          }
          continue;
        }
        break;
      }

      tokenList.push({
        line,
        column: startColumn,
        type: (isDecimal || hasExponent) ? TOKEN_TYPES.DECIMAL_LITERAL : TOKEN_TYPES.NUMBER_LITERAL,
        lexeme: num
      });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      const startColumn = column;
      let word = '';
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
        word += code[i];
        column++;
        i++;
      }
      
      const lowerWord = word.toLowerCase();
      const tokenType = KEYWORDS[lowerWord] || TOKEN_TYPES.IDENTIFIER;
      
      tokenList.push({ line, column: startColumn, type: tokenType, lexeme: word });
      continue;
    }

    if (char === '@') {
      const startColumn = column;
      let lexeme = '@';
      column++;
      let j = i + 1;

      if (isLetter(code[j]) || code[j] === '_') {
        while (
          j < code.length &&
          (isLetter(code[j]) || isDigit(code[j]) || code[j] === '_')
        ) {
          lexeme += code[j];
          column++;
          j++;
        }
      }

      tokenList.push({
        line,
        column: startColumn,
        type: TOKEN_TYPES.STRING_INSERTION,
        lexeme
      });

      i = j;
      continue;
    }
    
    // Group consecutive operator characters then classify as single or double operators.
    const operatorChars = "<>!=&|+-*/%^?";
    if (operatorChars.includes(char)) {
      const startColumn = column;
      let j = i;
      while (j < code.length && operatorChars.includes(code[j])) {
        column++;
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
        tokenList.push({ line, column: startColumn, type, lexeme: run });
      } else if (run.length === 2 && doubleOps.has(run)) {
        const type =
          ["<=", ">=", "==", "!="].includes(run) ? TOKEN_TYPES.RELATIONAL_OP :
          ["++", "--"].includes(run) ? TOKEN_TYPES.UNARY_OP :
          ["&&", "||"].includes(run) ? TOKEN_TYPES.LOGICAL_OP :
          run === "//" ? TOKEN_TYPES.ARITHMETIC_OP :
          TOKEN_TYPES.ASSIGNMENT_OP;
        tokenList.push({ line, column: startColumn, type, lexeme: run });
      } else {
        tokenList.push({ 
          line,
          column: startColumn,
          type: TOKEN_TYPES.UNKNOWN, 
          lexeme: run
        });
      }

      i = j;
      continue;
    }

    const delimiters = {
      '(': TOKEN_TYPES.DELIMITER_LEFT_PAREN,
      ')': TOKEN_TYPES.DELIMITER_RIGHT_PAREN,
      '[': TOKEN_TYPES.DELIMITER_LEFT_BRACKET,
      ']': TOKEN_TYPES.DELIMITER_RIGHT_BRACKET,
      '{': TOKEN_TYPES.DELIMITER_LEFT_BRACE,
      '}': TOKEN_TYPES.DELIMITER_RIGHT_BRACE,
      ',': TOKEN_TYPES.DELIMITER_COMMA,
      ':': TOKEN_TYPES.DELIMITER_COLON,
    };

    if (delimiters[char]) {
      tokenList.push({ line, column, type: delimiters[char], lexeme: char });
      column++;
      i++;
      continue;
    }

    if (char === ';') {
      tokenList.push({ 
        line,
        column,
        type: TOKEN_TYPES.UNKNOWN, 
        lexeme: char
      });
      column++;
      i++;
      continue;
    }

    if (char === '\\') {
      tokenList.push({ 
        line,
        column,
        type: TOKEN_TYPES.UNKNOWN, 
        lexeme: char
      });
      column++;
      i++;
      continue;
    }

    tokenList.push({ 
      line,
      column,
      type: TOKEN_TYPES.UNKNOWN, 
      lexeme: char
    });
    column++;
    i++;
  }

  return tokenList;
};
