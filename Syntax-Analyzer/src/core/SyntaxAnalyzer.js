import { TOKEN_TYPES } from './TokenTypes';

/**
 * =========================================
 * Syntax Analyzer – Structural Validation
 * =========================================
 * 
 * Currently AI Generated - To be reviewed and refined.
 */

export const syntaxAnalyzer = (tokens) => {
  const errors = [];

  if (tokens.length === 0) {
    return errors;
  }

  // ==========================================
  // DELIMITER BALANCING VALIDATION
  // ==========================================
  const delimiterStack = [];
  const delimiterMap = {
    '(': { closing: ')', type: 'parenthesis' },
    '[': { closing: ']', type: 'bracket' },
    '{': { closing: '}', type: 'brace' }
  };
  const closingToOpening = {
    ')': '(',
    ']': '[',
    '}': '{'
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Track opening delimiters
    if (token.lexeme === '(' || token.lexeme === '[' || token.lexeme === '{') {
      delimiterStack.push({ char: token.lexeme, line: token.line, column: token.column || 1 });
    }
    
    // Check closing delimiters
    if (token.lexeme === ')' || token.lexeme === ']' || token.lexeme === '}') {
      const expected = closingToOpening[token.lexeme];
      const last = delimiterStack.pop();
      
      if (!last) {
        errors.push({
          line: token.line,
          column: token.column || 1,
          message: `Unmatched closing delimiter '${token.lexeme}' - no corresponding opening delimiter found`
        });
      } else if (last.char !== expected) {
        errors.push({
          line: token.line,
          column: token.column || 1,
          message: `Mismatched delimiter: found '${token.lexeme}' but expected '${delimiterMap[last.char].closing}' to match '${last.char}' at line ${last.line}`
        });
      }
    }
  }

  // Report unclosed delimiters
  while (delimiterStack.length > 0) {
    const unmatched = delimiterStack.pop();
    const expected = delimiterMap[unmatched.char].closing;
    errors.push({
      line: unmatched.line,
      column: unmatched.column || 1,
      message: `Unclosed delimiter '${unmatched.char}' at line ${unmatched.line} - expected closing '${expected}'`
    });
  }

  // ==========================================
  // SEMICOLON PROHIBITION VALIDATION
  // ==========================================
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.lexeme === ';') {
      errors.push({
        line: token.line,
        column: token.column || 1,
        message: 'Semicolon (;) is not allowed in E.C.H.O. language'
      });
    }
  }

  // ==========================================
  // IDENTIFIER LENGTH VALIDATION
  // ==========================================
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === TOKEN_TYPES.IDENTIFIER && token.lexeme.length > 64) {
      errors.push({
        line: token.line,
        column: token.column || 1,
        message: `Identifier '${token.lexeme}' exceeds maximum length of 64 characters (found ${token.lexeme.length} characters)`
      });
    }
  }

  // ==========================================
  // PROGRAM STRUCTURE VALIDATION
  // ==========================================

  // Verify program starts with required 'start' keyword.
  const firstToken = tokens[0];
  if (firstToken.type !== TOKEN_TYPES.KEYWORD_START) {
    errors.push({
      line: 1,
      column: 1,
      message: "Program must begin with 'start' keyword"
    });
  }

  // Verify program ends with required 'end' keyword.
  const lastToken = tokens[tokens.length - 1];
  if (lastToken.type !== TOKEN_TYPES.KEYWORD_END) {
    errors.push({
      line: lastToken.line,
      column: lastToken.column || 1,
      message: "Program must end with 'end' keyword"
    });
  }

  // Track nested block structures to ensure proper pairing.
  const blockStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];

    // Ensure 'if' statements are followed by required 'then' keyword.
    if (token.type === TOKEN_TYPES.KEYWORD_CONDITIONAL && token.lexeme.toLowerCase() === 'if') {
      blockStack.push({ type: 'if', line: token.line, column: token.column || 1 });
      
      // Scan ahead to verify 'then' appears before the next statement.
      let foundThen = false;
      for (let j = i + 1; j < tokens.length; j++) {
        const checkToken = tokens[j];
        if (checkToken.type === TOKEN_TYPES.KEYWORD_CONDITIONAL && checkToken.lexeme.toLowerCase() === 'then') {
          foundThen = true;
          break;
        }
        // Stop checking if we hit another statement starter
        if (checkToken.type === TOKEN_TYPES.KEYWORD_PROGRAM || 
            checkToken.type === TOKEN_TYPES.KEYWORD_LOOP ||
            (checkToken.type === TOKEN_TYPES.KEYWORD_CONDITIONAL && checkToken.lexeme.toLowerCase() !== 'then')) {
          break;
        }
      }
      
      if (!foundThen) {
        errors.push({
          line: token.line,
          column: token.column || 1,
          message: "'if' statement must be followed by 'then' keyword"
        });
      }
    }

    if (token.type === TOKEN_TYPES.KEYWORD_LOOP && token.lexeme.toLowerCase() === 'for') {
      blockStack.push({ type: 'for', line: token.line, column: token.column || 1 });
    }

    if (token.type === TOKEN_TYPES.KEYWORD_LOOP && token.lexeme.toLowerCase() === 'while') {
      blockStack.push({ type: 'while', line: token.line, column: token.column || 1 });
    }

    // Track function declarations for proper 'end function' matching.
    if (token.type === TOKEN_TYPES.KEYWORD_PROGRAM && token.lexeme.toLowerCase() === 'function') {
      blockStack.push({ type: 'function', line: token.line, column: token.column || 1 });
    }

    // Validate 'end' keywords match their corresponding opening blocks.
    if (token.type === TOKEN_TYPES.KEYWORD_END && nextToken) {
      const blockType = nextToken.lexeme.toLowerCase();
      
      if (blockType === 'if' || blockType === 'for' || blockType === 'while' || blockType === 'function') {
        const lastBlock = blockStack[blockStack.length - 1];
        
        if (!lastBlock) {
          errors.push({
            line: token.line,
            column: token.column || 1,
            message: `Unexpected 'end ${blockType}' - no matching '${blockType}' block found`
          });
        } else if (lastBlock.type !== blockType) {
          errors.push({
            line: token.line,
            column: token.column || 1,
            message: `Block mismatch: 'end ${blockType}' found but expected 'end ${lastBlock.type}' (opened at line ${lastBlock.line})`
          });
        } else {
          blockStack.pop();
        }
      }
    }

    // Ensure all variable declarations include initialization.
    if (token.type === TOKEN_TYPES.KEYWORD_DATATYPE) {
      if (nextToken && nextToken.type === TOKEN_TYPES.IDENTIFIER) {
        const afterIdent = tokens[i + 2];
        if (!afterIdent || afterIdent.type !== TOKEN_TYPES.ASSIGNMENT_OP) {
          errors.push({
            line: token.line,
            column: token.column || 1,
            message: `Variable '${nextToken.lexeme}' declared but not initialized. Expected '=' assignment operator`
          });
        }
      }
    }

    // Ensure echo and input statements have required arguments.
    if (token.type === TOKEN_TYPES.KEYWORD_PROGRAM && 
        (token.lexeme.toLowerCase() === 'echo' || token.lexeme.toLowerCase() === 'input')) {
      if (!nextToken || (nextToken.type !== TOKEN_TYPES.STRING_LITERAL && 
                        nextToken.type !== TOKEN_TYPES.IDENTIFIER &&
                        nextToken.type !== TOKEN_TYPES.STRING_INSERTION)) {
        errors.push({
          line: token.line,
          column: token.column || 1,
          message: `'${token.lexeme}' statement requires an argument (string or variable)`
        });
      }
    }
  }

  // Report any blocks that were opened but never closed.
  while (blockStack.length > 0) {
    const unclosed = blockStack.pop();
    errors.push({
      line: unclosed.line,
      column: unclosed.column || 1,
      message: `Unclosed '${unclosed.type}' block started at line ${unclosed.line}. Expected 'end ${unclosed.type}'`
    });
  }

  return errors;
};
