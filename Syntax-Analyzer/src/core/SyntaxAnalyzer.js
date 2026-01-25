import { TOKEN_TYPES, isDataType, isOperator } from '../../../shared/tokenTypes';
import { buildAST, validateAST } from './ASTBuilder';

/*
Syntax Analyzer – Grammar-Based Validation

Implements syntax validation based on ECHO language formal grammar aligned with FORMAL_GRAMMAR.md production rules.
Uses recursive descent parsing to validate grammar compliance and generate comprehensive error reporting.
Depends on TokenTypes and ASTBuilder modules.
*/

export const ERROR_CATEGORIES = {
  SYNTAX_ERROR: 'SYNTAX_ERROR',
  GRAMMAR_ERROR: 'GRAMMAR_ERROR',
  SEMANTIC_ERROR: 'SEMANTIC_ERROR',
  STRUCTURAL_ERROR: 'STRUCTURAL_ERROR',
  TYPE_ERROR: 'TYPE_ERROR'
};

/*
Create an error object with standardized format

@param {Number} line - Line number where error occurred
@param {Number} column - Column number where error occurred
@param {String} message - Error message description
@param {String} category - Error category type
@param {String} severity - Error severity level
@param {Object} context - Additional context information
@returns {Object} Formatted error object
*/
export const createError = (line, column, message, category = ERROR_CATEGORIES.SYNTAX_ERROR, severity = 'error', context = null) => {
  return {
    id: Math.random().toString(36).substring(2, 11),
    line,
    column,
    message,
    category,
    severity,
    timestamp: new Date().toISOString(),
    context
  };
};

/*
Main syntax analyzer function

Validates tokens against ECHO language grammar rules and returns analysis results.

@param {Array} tokens - Array of tokens to analyze
@returns {Object} Analysis results with errors, warnings, success status, and AST
*/
export const syntaxAnalyzer = (tokens) => {
  const errors = [];
  const warnings = [];

  if (!tokens || tokens.length === 0) {
    errors.push(createError(1, 1, 'No tokens provided for analysis', ERROR_CATEGORIES.GRAMMAR_ERROR));
    return { errors, warnings, success: false };
  }

  const hasUnknownTokens = tokens.some(token => token.type === TOKEN_TYPES.UNKNOWN);
  const astResult = buildAST(tokens);
  
  if (!astResult) {
    errors.push(createError(
      1, 
      1, 
      'Failed to parse program - AST builder returned null',
      ERROR_CATEGORIES.GRAMMAR_ERROR
    ));
    return { errors, warnings, success: false, ast: null, astValid: false };
  }
  
  validateProgramStructure(tokens, errors);
  
  const hasStructureError = errors.some(error => 
    (error.category === ERROR_CATEGORIES.STRUCTURAL_ERROR && 
     error.message.includes('start keyword')) ||
    (error.category === ERROR_CATEGORIES.GRAMMAR_ERROR && 
     error.message.includes('start keyword'))
  );
  
  if (!hasStructureError && !hasUnknownTokens) {
    validateControlStructures(tokens, errors);
    validateDelimiters(tokens, errors);
    validateIdentifiers(tokens, errors);
  }
  
  if (!astResult.success && !hasStructureError && !hasUnknownTokens) {
    validateExpressions(tokens, errors);
    validateFunctionDefinitions(tokens, errors, warnings);
    validateVariableDeclarations(tokens, errors);
    validateSwitchStatements(tokens, errors, warnings);
    validateDataStructures(tokens, errors);
    validateNoiseWords(tokens, errors, warnings);
  }

  if (astResult.errors && Array.isArray(astResult.errors)) {
    astResult.errors.forEach(error => {
      // Check for delimiter mismatch duplicates - both syntax analyzer and AST builder report these
      const isDelimiterError = error.message.includes('Expected "]"') || 
                               error.message.includes('Expected ")"') || 
                               error.message.includes('Expected "}"') ||
                               error.message.includes('to close list') ||
                               error.message.includes('to close');
      
      // Check for block terminator duplicates - these can appear on nearby lines
      const isBlockTerminatorError = error.message.includes('after "end"') || 
                                    error.message.includes('Expected "') && error.message.includes('" after "end"');
      
      const hasExistingDelimiterError = errors.some(existing => 
        existing.message.includes('Mismatched delimiter') ||
        existing.message.includes('Expected "]"') ||
        existing.message.includes('Expected ")"') ||
        existing.message.includes('Expected "}"') ||
        existing.message.includes('to close list') ||
        existing.message.includes('to close')
      );
      
      // Check for similar block terminator errors on nearby lines
      const hasSimilarBlockError = errors.some(existing => 
        existing.message.includes('after "end"') && 
        Math.abs(existing.line - error.line) <= 2 // Within 2 lines
      );
      
      const isDuplicate = errors.some(existing => 
        existing.line === error.line && 
        existing.column === error.column && 
        (existing.message.includes(error.message.substring(0, 20)) ||
         (isDelimiterError && hasExistingDelimiterError))
      ) || (isBlockTerminatorError && hasSimilarBlockError);
      
      if (!isDuplicate) {
        errors.push(createError(error.line, error.column, error.message, ERROR_CATEGORIES.GRAMMAR_ERROR));
      }
    });
  }

  const success = errors.length === 0;
  
  return {
    errors,
    warnings,
    success,
    ast: astResult.ast,
    astValid: validateAST(astResult.ast)
  };
};

/*
Validates overall program structure according to grammar rules

Grammar: <ECHO_program> => "start" <statement_list> "end"

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
*/
const validateProgramStructure = (tokens, errors) => {
  const firstToken = tokens[0];
  
  if (!firstToken || firstToken.type !== TOKEN_TYPES.KEYWORD_START) {
    errors.push(createError(
      1, 
      1, 
      `Program must begin with "start" keyword. Found "${firstToken?.lexeme || 'nothing'}" instead.`,
      ERROR_CATEGORIES.STRUCTURAL_ERROR,
      'error',
      { expected: 'start', found: firstToken?.lexeme, grammar: '<ECHO_program> => "start" <statement_list> "end"' }
    ));
    return;
  }

  let lastEndToken = null;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token?.type === TOKEN_TYPES.KEYWORD_END) {
      lastEndToken = token;
      break;
    }
  }
  
  if (!lastEndToken) {
    errors.push(createError(
      tokens.length,
      1,
      `Program must end with "end" keyword.`,
      ERROR_CATEGORIES.STRUCTURAL_ERROR,
      'error',
      { expected: 'end', grammar: '<ECHO_program> => "start" <statement_list> "end"' }
    ));
  }
};

/*
Validates delimiter balancing and proper usage

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
*/
const validateDelimiters = (tokens, errors) => {
  const delimiterStack = [];
  const delimiterPairs = {
    [TOKEN_TYPES.DEL_LPAREN]: { closing: TOKEN_TYPES.DEL_RPAREN, name: 'parenthesis' },
    [TOKEN_TYPES.DEL_LBRACK]: { closing: TOKEN_TYPES.DEL_RBRACK, name: 'bracket' },
  };

  tokens.forEach((token, index) => {
    // Check opening delimiters
    if (token && token.type && delimiterPairs[token.type]) {
      delimiterStack.push({
        type: token.type,
        line: token.line,
        column: token.column || 1,
        index
      });
    }

    // Check closing delimiters
    const matchingOpening = token && token.type ? Object.entries(delimiterPairs).find(
      ([_, pair]) => pair.closing === token.type
    ) : null;

    if (matchingOpening) {
      const [openingType, pair] = matchingOpening;
      const lastOpening = delimiterStack.pop();
      const line = token.line;
      const col = token.column || 1;
      const alreadyReported = errors.some((e) => e.line === line && (e.column || 1) === col);

      if (!lastOpening) {
        if (!alreadyReported) {
          errors.push(createError(
            line,
            col,
            `Unmatched closing ${pair.name} '${token.lexeme}' - no corresponding opening ${pair.name} found. Expected opening ${pair.name} before this point.`,
            ERROR_CATEGORIES.SYNTAX_ERROR
          ));
        }
      } else if (lastOpening.type !== openingType) {
        if (!alreadyReported) {
          const expectedPair = delimiterPairs[lastOpening.type];
          const closingChar = expectedPair.closing === TOKEN_TYPES.DEL_RBRACK ? ']' : expectedPair.closing === TOKEN_TYPES.DEL_RPAREN ? ')' : `'${expectedPair.closing}'`;
          errors.push(createError(
            line,
            col,
            `Mismatched delimiter: found closing ${pair.name} '${token.lexeme}' but expected closing ${expectedPair.name} '${closingChar}' to match opening ${expectedPair.name} at line ${lastOpening.line}.`,
            ERROR_CATEGORIES.SYNTAX_ERROR
          ));
        }
      }
    }

    // Check for prohibited semicolons (ECHO doesn't use semicolons)
    if (token && token.lexeme === ';') {
      errors.push(createError(
        token.line,
        token.column || 1,
        'Semicolon (;) is not allowed in ECHO language. Statements are terminated by newlines or block delimiters.',
        ERROR_CATEGORIES.SYNTAX_ERROR
      ));
    }
  });

  // Report unclosed delimiters
  while (delimiterStack.length > 0) {
    const unclosed = delimiterStack.pop();
    const pair = delimiterPairs[unclosed.type];
    errors.push(createError(
      unclosed.line,
      unclosed.column,
      `Unclosed ${pair.name} at line ${unclosed.line} - expected closing '${pair.closing}' before end of file.`,
      ERROR_CATEGORIES.SYNTAX_ERROR
    ));
  }
};

/*
Validates identifier constraints according to grammar rules

Grammar: <identifier> => "_" { "_" } | <letter> { <letter> | <digit> | "_" }
Constraint: Length 1-64 characters

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
*/
const validateIdentifiers = (tokens, errors) => {
  tokens.forEach(token => {
    if (token && token.type === TOKEN_TYPES.IDENTIFIER) {
      // Check identifier length
      if (token.lexeme && token.lexeme.length > 64) {
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `Identifier '${token.lexeme}' exceeds maximum length of 64 characters (found ${token.lexeme.length} characters).`,
          ERROR_CATEGORIES.SEMANTIC_ERROR,
          'error',
          { identifier: token.lexeme, length: token.lexeme.length, maxLength: 64, suggestion: 'Use a shorter identifier name' }
        ));
      }

      // Check identifier format (starts with letter or underscore)
      const firstChar = token.lexeme ? token.lexeme[0] : '';
      if (firstChar && !/^[a-zA-Z_]$/.test(firstChar)) {
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `Identifier '${token.lexeme}' must start with a letter or underscore. Found '${firstChar}' instead.`,
          ERROR_CATEGORIES.SYNTAX_ERROR,
          'error',
          { identifier: token.lexeme, invalidChar: firstChar, grammar: '<identifier> => "_" | <letter> { <letter> | <digit> | "_" }' }
        ));
      }

      // Check for invalid characters in identifier
      if (token.lexeme && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token.lexeme)) {
        const invalidChars = token.lexeme.match(/[^a-zA-Z0-9_]/g);
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `Identifier '${token.lexeme}' contains invalid characters: ${invalidChars?.join(', ') || 'unknown'}. Only letters, digits, and underscores are allowed.`,
          ERROR_CATEGORIES.SYNTAX_ERROR,
          'error',
          { identifier: token.lexeme, invalidChars, suggestion: 'Remove invalid characters from identifier' }
        ));
      }

      // Check for reserved words used as identifiers
      const reservedWords = ['start', 'end', 'function', 'echo', 'input', 'return', 
                            'if', 'else', 'switch', 'case', 'default',
                            'for', 'while', 'do', 'break', 'continue',
                            'number', 'decimal', 'string', 'boolean', 'list',
                            'true', 'false', 'null', 'new', 'this'];
      
      if (token.lexeme && reservedWords.includes(token.lexeme.toLowerCase())) {
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `'${token.lexeme}' is a reserved word and cannot be used as an identifier.`,
          ERROR_CATEGORIES.SYNTAX_ERROR,
          'error',
          { reservedWord: token.lexeme, suggestion: `Choose a different name, e.g., '${token.lexeme}_var'` }
        ));
      }
    }
  });
};

/*
Validates expression syntax and operator usage

Follows operator precedence from grammar rules

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
*/
const validateExpressions = (tokens, errors) => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = tokens[i - 1];
    const nextToken = tokens[i + 1];

    // Check for invalid operator sequences
    if (token && token.type && isOperator(token.type)) {
      // Check for consecutive binary operators without operands
      if (isBinaryOperator(token) && isBinaryOperator(nextToken)) {
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `Invalid operator sequence '${token.lexeme}${nextToken?.lexeme}'. Binary operators require operands on both sides.`,
          ERROR_CATEGORIES.SYNTAX_ERROR
        ));
      }

      // Check for unary operators in invalid positions
      if (isUnaryOperator(token) && !isValidUnaryContext(token, prevToken)) {
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `Invalid use of unary operator '${token.lexeme}'. Check operator precedence and placement.`,
          ERROR_CATEGORIES.SYNTAX_ERROR
        ));
      }
    }

    // Validate assignment operators
    if (token && isAssignmentOperator(token)) {
      if (!prevToken || prevToken.type !== TOKEN_TYPES.IDENTIFIER) {
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `Assignment operator '${token.lexeme}' must be preceded by an identifier`,
          ERROR_CATEGORIES.SYNTAX_ERROR
        ));
      }

      if (!nextToken) {
        errors.push(createError(
          token.line || 1,
          token.column || 1,
          `Assignment operator '${token.lexeme}' must be followed by an expression`,
          ERROR_CATEGORIES.SYNTAX_ERROR
        ));
      }
    }
  }
};

/*
Helper function to get grammar rule for a block type

@param {String} blockType - Type of block (if, for, while, etc.)
@returns {String} Grammar rule for the block type
*/
const getGrammarRuleForBlock = (blockType) => {
  switch (blockType) {
    case 'if':
      return '<if_stmt> => "if" <expression> <statement_list> "end" "if" | <if_elseif_else_stmt> => "if" <expression> <statement_list> { "else" "if" <expression> <statement_list> } [ "else" <statement_list> ] "end" "if"';
    case 'for':
      return '<for_loop> => "for" <identifier> "=" <expression> "to" <expression> [ <step_clause> ] <statement_list> "end" "for"';
    case 'while':
      return '<while_loop> => "while" <expression> <statement_list> "end" "while"';
    case 'do':
      return '<do_while_loop> => "do" <statement_list> "while" <expression> "end" "do"';
    case 'switch':
      return '<switch_stmt> => "switch" <expression> { <case_block> } [ <default_block> ] "end" "switch"';
    case 'function':
      return '<function_def> => "function" <return_type> <identifier> "(" [ <param_list> ] ")" <statement_list> <return_stmt> "end" "function"';
    default:
      return '';
  }
};

/*
Validates control flow structures (if, switch, loops)

Ensures proper block structure and termination according to grammar rules

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
*/
const validateControlStructures = (tokens, errors) => {
  const blockStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];

    if (token?.type === TOKEN_TYPES.KEYWORD_IF) {
      const prevToken = tokens[i - 1];
      if (!prevToken || prevToken.type !== TOKEN_TYPES.KEYWORD_ELSE) {
        blockStack.push({ type: 'if', line: token.line, column: token.column || 1 });
      }
    } else if (token?.type === TOKEN_TYPES.KEYWORD_FOR) {
      blockStack.push({ type: 'for', line: token.line, column: token.column || 1 });
    } else if (token?.type === TOKEN_TYPES.KEYWORD_WHILE) {
      let isDoWhileTermination = false;
      for (let j = i + 1; j < Math.min(i + 20, tokens.length); j++) {
        const lookAheadToken = tokens[j];
        if (lookAheadToken?.type === TOKEN_TYPES.KEYWORD_END && 
            tokens[j + 1]?.type === TOKEN_TYPES.KEYWORD_DO) {
          isDoWhileTermination = true;
          break;
        }
        if (lookAheadToken && [
          TOKEN_TYPES.KEYWORD_IF, TOKEN_TYPES.KEYWORD_FOR, TOKEN_TYPES.KEYWORD_WHILE, 
          TOKEN_TYPES.KEYWORD_DO, TOKEN_TYPES.KEYWORD_SWITCH, TOKEN_TYPES.KEYWORD_FUNCTION
        ].includes(lookAheadToken.type)) {
          break;
        }
      }
      if (!isDoWhileTermination) {
        blockStack.push({ type: 'while', line: token.line, column: token.column || 1 });
      }
    } else if (token?.type === TOKEN_TYPES.KEYWORD_DO) {
      blockStack.push({ type: 'do', line: token.line, column: token.column || 1 });
    } else if (token?.type === TOKEN_TYPES.KEYWORD_SWITCH) {
      blockStack.push({ type: 'switch', line: token.line, column: token.column || 1 });
    } else if (token?.type === TOKEN_TYPES.KEYWORD_FUNCTION) {
      blockStack.push({ type: 'function', line: token.line, column: token.column || 1 });
    }

    if (token?.type === TOKEN_TYPES.KEYWORD_END) {
      let blockType = null;
      let isCompoundTerminator = false;
      
      if (nextToken && [
        TOKEN_TYPES.KEYWORD_IF, TOKEN_TYPES.KEYWORD_FOR, TOKEN_TYPES.KEYWORD_WHILE,
        TOKEN_TYPES.KEYWORD_DO, TOKEN_TYPES.KEYWORD_SWITCH, TOKEN_TYPES.KEYWORD_FUNCTION
      ].includes(nextToken.type)) {
        isCompoundTerminator = true;
        blockType = nextToken.lexeme;
      } else {
        const lastBlock = blockStack[blockStack.length - 1];
        if (lastBlock) {
          errors.push(createError(
            token.line,
            token.column || 1,
            `Expected "${lastBlock.type}" after "end" to close the ${lastBlock.type} block started at line ${lastBlock.line}`,
            ERROR_CATEGORIES.GRAMMAR_ERROR,
            'error',
            {
              expected: `end ${lastBlock.type}`,
              found: 'end',
              grammar: getGrammarRuleForBlock(lastBlock.type),
              suggestion: `Change "end" to "end ${lastBlock.type}" to properly close the block`
            }
          ));
          blockStack.pop();
          continue;
        }
      }
      
      if (isCompoundTerminator && blockType) {
        const lastBlock = blockStack[blockStack.length - 1];
        
        if (!lastBlock) {
          errors.push(createError(
            token.line,
            token.column || 1,
            `Unexpected 'end ${blockType}' - no matching '${blockType}' block found in current scope`,
            ERROR_CATEGORIES.GRAMMAR_ERROR,
            'error',
            { 
              expected: `${blockType} block`,
              found: `end ${blockType}`,
              grammar: getGrammarRuleForBlock(blockType),
              suggestion: `Remove 'end ${blockType}' or add matching '${blockType}' block`
            }
          ));
        } else if (lastBlock.type !== blockType) {
          errors.push(createError(
            token.line,
            token.column || 1,
            `Block mismatch: found 'end ${blockType}' but expected 'end ${lastBlock.type}' (block opened at line ${lastBlock.line})`,
            ERROR_CATEGORIES.GRAMMAR_ERROR,
            'error',
            {
              expected: `end ${lastBlock.type}`,
              found: `end ${blockType}`,
              grammar: getGrammarRuleForBlock(lastBlock.type),
              suggestion: `Change 'end ${blockType}' to 'end ${lastBlock.type}' to match the opening block`
            }
          ));
        } else {
          blockStack.pop();
        }
        
        i++;
      }
    }
  }

  while (blockStack.length > 0) {
    const unclosed = blockStack.pop();
    errors.push(createError(
      unclosed.line,
      unclosed.column,
      `Unclosed '${unclosed.type}' block started at line ${unclosed.line}. Expected 'end ${unclosed.type}' terminator`,
      ERROR_CATEGORIES.GRAMMAR_ERROR,
      'error',
      {
        expected: `end ${unclosed.type}`,
        found: 'EOF',
        grammar: getGrammarRuleForBlock(unclosed.type),
        suggestion: `Add 'end ${unclosed.type}' before the end of the program to close this block`
      }
    ));
  }
};

/*
Validates function definitions according to grammar rules

Grammar: <function_def> => "function" <return_type> <identifier> "(" [ <param_list> ] ")" <statement_list> <return_stmt> "end" "function"

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
@param {Array} warnings - Array to collect validation warnings
*/
const validateFunctionDefinitions = (tokens, errors, warnings) => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token && token.type === TOKEN_TYPES.KEYWORD_FUNCTION) {
      // Check function structure
      let hasIdentifier = false;
      let hasLParen = false;
      let hasRParen = false;
      let hasEnd = false;
      let hasReturn = false;

      // Scan forward to validate function structure
      for (let j = i + 1; j < Math.min(i + 50, tokens.length); j++) {
        const checkToken = tokens[j];
        
        if (checkToken && checkToken.type === TOKEN_TYPES.IDENTIFIER) hasIdentifier = true;
        if (checkToken && checkToken.type === TOKEN_TYPES.DEL_LPAREN) hasLParen = true;
        if (checkToken && checkToken.type === TOKEN_TYPES.DEL_RPAREN) hasRParen = true;
        if (checkToken && checkToken.type === TOKEN_TYPES.RESERVED_RETURN) hasReturn = true;
        
        if (checkToken && checkToken.type === TOKEN_TYPES.KEYWORD_END && 
            tokens[j + 1]?.type === TOKEN_TYPES.KEYWORD_FUNCTION) {
          hasEnd = true;
          break;
        }
      }

      if (!hasIdentifier) {
        errors.push(createError(
          token.line,
          token.column || 1,
          'Function definition requires a function name',
          ERROR_CATEGORIES.GRAMMAR_ERROR
        ));
      }

      if (!hasLParen || !hasRParen) {
        errors.push(createError(
          token.line,
          token.column || 1,
          'Function definition requires parentheses for parameter list',
          ERROR_CATEGORIES.GRAMMAR_ERROR
        ));
      }

      if (!hasEnd) {
        warnings.push(createError(
          token.line,
          token.column || 1,
          'Function definition should end with "end function"',
          ERROR_CATEGORIES.STRUCTURAL_ERROR,
          'warning'
        ));
      }

      if (!hasReturn) {
        warnings.push(createError(
          token.line,
          token.column || 1,
          'Function definition does not contain a return statement',
          ERROR_CATEGORIES.SEMANTIC_ERROR,
          'warning',
          { suggestion: 'Add a return statement or ensure function is intended to be void' }
        ));
      }
    }
  }
};

/*
Validates variable declarations according to grammar rules

Grammar: <declaration_stmt> => <data_type> <decl_list>
Grammar: <decl_list> => <decl_item> { "," <decl_item> }
Grammar: <decl_item> => <identifier> | <identifier> "=" <expression> | <identifier> "[" <number_lit> "]" | <identifier> "=" <list_lit>

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
*/
const validateVariableDeclarations = (tokens, errors) => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];

    // Check data type declarations according to grammar
    if (token && token.type && isDataType(token.type)) {
      if (!nextToken || !nextToken.type || nextToken.type !== TOKEN_TYPES.IDENTIFIER) {
        errors.push(createError(
          token.line,
          token.column || 1,
          `Data type '${token.lexeme}' must be followed by an identifier according to declaration grammar`,
          ERROR_CATEGORIES.GRAMMAR_ERROR,
          'error',
          {
            expected: 'identifier',
            found: nextToken?.lexeme || 'nothing',
            grammar: '<declaration_stmt> => <data_type> <decl_list>',
            suggestion: `Add an identifier after '${token.lexeme}', e.g., '${token.lexeme} variable_name'`
          }
        ));
        continue;
      }

      // Check for proper declaration syntax according to <decl_item> grammar rules
      const afterIdent = tokens[i + 2];
      if (afterIdent && afterIdent.type) {
        // Valid contexts after identifier according to <decl_item> grammar
        const validDeclContexts = [
          TOKEN_TYPES.OP_ASSIGN,        // identifier = expression
          TOKEN_TYPES.DEL_LBRACK,       // identifier[expression]
          TOKEN_TYPES.DEL_COMMA,        // identifier, identifier2
          TOKEN_TYPES.OP_ADD_ASSIGN,    // identifier += expression
          TOKEN_TYPES.OP_SUB_ASSIGN,    // identifier -= expression
          TOKEN_TYPES.OP_MUL_ASSIGN,    // identifier *= expression
          TOKEN_TYPES.OP_DIV_ASSIGN,    // identifier /= expression
          TOKEN_TYPES.OP_MOD_ASSIGN     // identifier %= expression
        ];
        
        // Valid statement terminators or next statement starters
        const validStatementContexts = [
          TOKEN_TYPES.KEYWORD_END,      // end of block
          TOKEN_TYPES.KEYWORD_IF,       // if statement
          TOKEN_TYPES.KEYWORD_FOR,      // for loop
          TOKEN_TYPES.KEYWORD_WHILE,    // while loop
          TOKEN_TYPES.KEYWORD_DO,       // do loop
          TOKEN_TYPES.KEYWORD_SWITCH,   // switch statement
          TOKEN_TYPES.KEYWORD_ECHO,     // echo statement
          TOKEN_TYPES.RESERVED_RETURN,  // return statement
          TOKEN_TYPES.KEYWORD_FUNCTION, // function definition
          TOKEN_TYPES.DEL_RPAREN,       // function parameter list end
          TOKEN_TYPES.KEYWORD_ELSE      // else clause
        ];
        
        // Valid expression starters (for complex initialization)
        const validExpressionContexts = [
          TOKEN_TYPES.OP_ADD, TOKEN_TYPES.OP_SUB, TOKEN_TYPES.OP_MUL, TOKEN_TYPES.OP_DIV,
          TOKEN_TYPES.OP_MOD, TOKEN_TYPES.OP_EXP, TOKEN_TYPES.OP_EQ, TOKEN_TYPES.OP_NEQ,
          TOKEN_TYPES.OP_LT, TOKEN_TYPES.OP_GT, TOKEN_TYPES.OP_LTE, TOKEN_TYPES.OP_GTE,
          TOKEN_TYPES.OP_AND, TOKEN_TYPES.OP_OR, TOKEN_TYPES.OP_NOT
        ];
        
        // Also valid: literals for initialization
        const validLiteralContexts = [
          TOKEN_TYPES.NUMBER_LITERAL,
          TOKEN_TYPES.DECIMAL_LITERAL,
          TOKEN_TYPES.STRING_LITERAL,
          TOKEN_TYPES.RESERVED_TRUE,
          TOKEN_TYPES.RESERVED_FALSE,
          TOKEN_TYPES.RESERVED_NULL,
          TOKEN_TYPES.DEL_LPAREN,       // start of expression
          TOKEN_TYPES.DEL_LBRACK        // list literal
        ];
        
        const allValidContexts = [...validDeclContexts, ...validStatementContexts, ...validExpressionContexts, ...validLiteralContexts];
        
        if (!allValidContexts.includes(afterIdent.type)) {
          // Check if this might be a valid expression context or just uninitialized variable
          const isExpressionContext = isValidExpressionStart(afterIdent.type);
          
          if (!isExpressionContext) {
            // This is likely a genuine syntax error in declaration
            errors.push(createError(
              token.line,
              token.column || 1,
              `Invalid declaration syntax for variable '${nextToken.lexeme}'. Expected assignment operator, array brackets, comma, or statement terminator after identifier`,
              ERROR_CATEGORIES.GRAMMAR_ERROR,
              'error',
              {
                expected: "=, [], comma, operator, or statement terminator",
                found: afterIdent.lexeme,
                grammar: '<decl_item> => <identifier> | <identifier> "=" <expression> | <identifier> "[" <number_lit> "]" | <identifier> "=" <list_lit>',
                suggestion: `Use '${nextToken.lexeme} = value', '${nextToken.lexeme}[size]', '${nextToken.lexeme}, next_var', or end the statement`
              }
            ));
          }
          // If it's a valid expression context, the declaration is likely correct (e.g., complex initialization)
        }
      }
    }
  }
};

/*
Validates switch statements according to grammar rules

Grammar: <switch_stmt> => "switch" <expression> { <case_block> } [ <default_block> ] "end" "switch"
Grammar: <case_block> => "case" <literal> <statement_list>
Grammar: <default_block> => "default" <statement_list>

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
@param {Array} warnings - Array to collect validation warnings
*/
const validateSwitchStatements = (tokens, errors, warnings) => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token && token.type === TOKEN_TYPES.KEYWORD_SWITCH) {
      // Check if switch has an expression
      const nextToken = tokens[i + 1];
      if (!nextToken || !isValidExpressionStart(nextToken.type)) {
        errors.push(createError(
          token.line,
          token.column || 1,
          `Switch statement requires an expression after 'switch' keyword`,
          ERROR_CATEGORIES.GRAMMAR_ERROR,
          'error',
          {
            expected: 'expression',
            found: nextToken?.lexeme || 'nothing',
            grammar: '<switch_stmt> => "switch" <expression> { <case_block> } [ <default_block> ] "end" "switch"',
            suggestion: `Add an expression after 'switch', e.g., 'switch variable'`
          }
        ));
      }
      
      // Look for at least one case block
      let hasCaseBlock = false;
      
      for (let j = i + 1; j < tokens.length; j++) {
        const checkToken = tokens[j];
        
        if (checkToken && checkToken.type === TOKEN_TYPES.KEYWORD_CASE) {
          hasCaseBlock = true;
          // Check if case has a literal
          const literalToken = tokens[j + 1];
          if (!literalToken || !isLiteral(literalToken.type)) {
            errors.push(createError(
              checkToken.line,
              checkToken.column || 1,
              `Case statement requires a literal value after 'case' keyword`,
              ERROR_CATEGORIES.GRAMMAR_ERROR,
              'error',
              {
                expected: 'literal',
                found: literalToken?.lexeme || 'nothing',
                grammar: '<case_block> => "case" <literal> <statement_list>',
                suggestion: `Add a literal value after 'case', e.g., 'case 1' or 'case "value"'`
              }
            ));
          }
        }
        
        if (checkToken && checkToken.type === TOKEN_TYPES.KEYWORD_DEFAULT) {
          // Default block found - no action needed
        }
        
        // Stop when we reach the end of this switch
        if (checkToken && checkToken.type === TOKEN_TYPES.KEYWORD_END && 
            tokens[j + 1]?.type === TOKEN_TYPES.KEYWORD_SWITCH) {
          break;
        }
      }
      
      if (!hasCaseBlock) {
        warnings.push(createError(
          token.line,
          token.column || 1,
          `Switch statement should have at least one case block`,
          ERROR_CATEGORIES.SEMANTIC_ERROR,
          'warning',
          {
            grammar: '<switch_stmt> => "switch" <expression> { <case_block> } [ <default_block> ] "end" "switch"',
            suggestion: `Add at least one case block, e.g., 'case value: ... end switch'`
          }
        ));
      }
    }
  }
};

/*
Validates data structures according to grammar rules

Grammar: <data_struct> => "data" "struct" <identifier> "{" <field_list> "}"
Grammar: <field_decl> => <data_type> <identifier> | <data_type> <identifier> "=" <expression>

@param {Array} tokens - Array of tokens to validate
@param {Array} errors - Array to collect validation errors
*/
const validateDataStructures = (tokens, errors) => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token && token.type === TOKEN_TYPES.RESERVED_DATA) {
      // Check if followed by "struct"
      const nextToken = tokens[i + 1];
      if (!nextToken || nextToken.type !== TOKEN_TYPES.RESERVED_STRUCT) {
        errors.push(createError(
          token.line,
          token.column || 1,
          `Data declaration must be followed by 'struct' keyword`,
          ERROR_CATEGORIES.GRAMMAR_ERROR,
          'error',
          {
            expected: 'struct',
            found: nextToken?.lexeme || 'nothing',
            grammar: '<data_struct> => "data" "struct" <identifier> "{" <field_list> "}"',
            suggestion: `Add 'struct' after 'data', e.g., 'data struct Person'`
          }
        ));
        continue;
      }
      
      // Check if struct has an identifier
      const identToken = tokens[i + 2];
      if (!identToken || identToken.type !== TOKEN_TYPES.IDENTIFIER) {
        errors.push(createError(
          token.line,
          token.column || 1,
          `Struct declaration requires a name after 'struct' keyword`,
          ERROR_CATEGORIES.GRAMMAR_ERROR,
          'error',
          {
            expected: 'identifier',
            found: identToken?.lexeme || 'nothing',
            grammar: '<data_struct> => "data" "struct" <identifier> "{" <field_list> "}"',
            suggestion: `Add a struct name, e.g., 'data struct Person'`
          }
        ));
        continue;
      }
      
      // Check if struct has opening brace
      const braceToken = tokens[i + 3];
      if (!braceToken || braceToken.type !== TOKEN_TYPES.DEL_LBRACE) {
        errors.push(createError(
          token.line,
          token.column || 1,
          `Struct declaration requires opening brace '{' after struct name`,
          ERROR_CATEGORIES.GRAMMAR_ERROR,
          'error',
          {
            expected: '{',
            found: braceToken?.lexeme || 'nothing',
            grammar: '<data_struct> => "data" "struct" <identifier> "{" <field_list> "}"',
            suggestion: `Add opening brace '{' after struct name, e.g., 'data struct Person {'`
          }
        ));
      }
    }
  }
};

/**
 * Validates noise words usage according to grammar rules
 * Grammar: <noise_word> => with | to | by
 * Grammar: <step_clause> => "by" <expression>
 */
const validateNoiseWords = (tokens, errors, warnings) => {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = tokens[i - 1];
    const nextToken = tokens[i + 1];
    
    if (token && (token.type === TOKEN_TYPES.NOISE_WITH || 
                  token.type === TOKEN_TYPES.NOISE_TO || 
                  token.type === TOKEN_TYPES.NOISE_BY)) {
      
      // Validate "to" in for loops
      if (token.type === TOKEN_TYPES.NOISE_TO) {
        if (!prevToken || prevToken.type !== TOKEN_TYPES.NUMBER_LITERAL) {
          errors.push(createError(
            token.line,
            token.column || 1,
            `Noise word 'to' must follow a numeric expression in for loop`,
            ERROR_CATEGORIES.GRAMMAR_ERROR,
            'error',
            {
              expected: 'number expression',
              found: prevToken?.lexeme || 'nothing',
              grammar: '<for_loop> => "for" <identifier> "=" <expression> "to" <expression> [ <step_clause> ] <statement_list> "end" "for"',
              suggestion: `Ensure 'to' follows the start value in for loop, e.g., 'for i = 1 to 10'`
            }
          ));
        }
        
        if (!nextToken || !isValidExpressionStart(nextToken.type)) {
          errors.push(createError(
            token.line,
            token.column || 1,
            `Noise word 'to' must be followed by an expression in for loop`,
            ERROR_CATEGORIES.GRAMMAR_ERROR,
            'error',
            {
              expected: 'expression',
              found: nextToken?.lexeme || 'nothing',
              grammar: '<for_loop> => "for" <identifier> "=" <expression> "to" <expression> [ <step_clause> ] <statement_list> "end" "for"',
              suggestion: `Add end value after 'to', e.g., 'for i = 1 to 10'`
            }
          ));
        }
      }
      
      // Validate "by" in step clauses
      if (token.type === TOKEN_TYPES.NOISE_BY) {
        // Check if this is in a valid step clause context (should be after for loop range)
        let isInForLoop = false;
        
        // Look backwards to see if we're in a for loop
        for (let j = i - 1; j >= 0 && j >= i - 10; j--) {
          const checkToken = tokens[j];
          if (checkToken && checkToken.type === TOKEN_TYPES.KEYWORD_FOR) {
            isInForLoop = true;
            break;
          }
          if (checkToken && (checkToken.type === TOKEN_TYPES.KEYWORD_END || 
                            checkToken.type === TOKEN_TYPES.KEYWORD_IF ||
                            checkToken.type === TOKEN_TYPES.KEYWORD_WHILE ||
                            checkToken.type === TOKEN_TYPES.KEYWORD_DO ||
                            checkToken.type === TOKEN_TYPES.KEYWORD_SWITCH ||
                            checkToken.type === TOKEN_TYPES.KEYWORD_FUNCTION)) {
            break; // Hit a different block boundary
          }
        }
        
        if (!isInForLoop) {
          errors.push(createError(
            token.line,
            token.column || 1,
            `Noise word 'by' can only be used in for loop step clauses`,
            ERROR_CATEGORIES.GRAMMAR_ERROR,
            'error',
            {
              expected: 'for loop context',
              found: 'other context',
              grammar: '<step_clause> => "by" <expression>',
              suggestion: `Move 'by' clause to a for loop, e.g., 'for i = 1 to 10 by 2'`
            }
          ));
        }
        
        if (!nextToken || !isValidExpressionStart(nextToken.type)) {
          errors.push(createError(
            token.line,
            token.column || 1,
            `Step clause 'by' must be followed by an expression`,
            ERROR_CATEGORIES.GRAMMAR_ERROR,
            'error',
            {
              expected: 'expression',
              found: nextToken?.lexeme || 'nothing',
              grammar: '<step_clause> => "by" <expression>',
              suggestion: `Add step value after 'by', e.g., 'by 2' or 'by i + 1'`
            }
          ));
        }
      }
      
      // Validate "with" usage (should be in specific contexts)
      if (token.type === TOKEN_TYPES.NOISE_WITH) {
        // "with" is reserved for future language features
        warnings.push(createError(
          token.line,
          token.column || 1,
          `Noise word 'with' is reserved for future language features`,
          ERROR_CATEGORIES.SEMANTIC_ERROR,
          'warning',
          {
            grammar: '<noise_word> => with | to | by',
            suggestion: `Remove 'with' or replace with appropriate construct`
          }
        ));
      }
    }
  }
};


/**
 * Helper function to check if a token type represents a literal
 */
const isLiteral = (tokenType) => {
  return [
    TOKEN_TYPES.NUMBER_LITERAL,
    TOKEN_TYPES.DECIMAL_LITERAL,
    TOKEN_TYPES.STRING_LITERAL,
    TOKEN_TYPES.RESERVED_TRUE,
    TOKEN_TYPES.RESERVED_FALSE,
    TOKEN_TYPES.RESERVED_NULL
  ].includes(tokenType);
};
const isValidExpressionStart = (tokenType) => {
  const expressionStarters = [
    TOKEN_TYPES.IDENTIFIER,
    TOKEN_TYPES.NUMBER_LITERAL,
    TOKEN_TYPES.DECIMAL_LITERAL,
    TOKEN_TYPES.STRING_LITERAL,
    TOKEN_TYPES.RESERVED_TRUE,
    TOKEN_TYPES.RESERVED_FALSE,
    TOKEN_TYPES.RESERVED_NULL,
    TOKEN_TYPES.DEL_LPAREN,
    TOKEN_TYPES.DEL_LBRACK,
    TOKEN_TYPES.OP_ADD,
    TOKEN_TYPES.OP_SUB,
    TOKEN_TYPES.OP_NOT,
    TOKEN_TYPES.OP_INC,
    TOKEN_TYPES.OP_DEC
  ];
  
  return expressionStarters.includes(tokenType);
};

// Helper functions
const isBinaryOperator = (token) => {
  if (!token) return false;
  return ['+', '-', '*', '/', '//', '%', '^', '==', '!=', '<', '>', '<=', '>=', '&&', '||'].includes(token.lexeme);
};

const isUnaryOperator = (token) => {
  if (!token) return false;
  return ['!', '++', '--'].includes(token.lexeme);
};

const isAssignmentOperator = (token) => {
  if (!token) return false;
  return ['=', '+=', '-=', '*=', '/=', '%='].includes(token.lexeme);
};

const isValidUnaryContext = (token, prevToken) => {
  if (!prevToken) return true;
  
  const validPrevTypes = [
    TOKEN_TYPES.OP_ASSIGN, TOKEN_TYPES.OP_ADD_ASSIGN, TOKEN_TYPES.OP_SUB_ASSIGN,
    TOKEN_TYPES.OP_MUL_ASSIGN, TOKEN_TYPES.OP_DIV_ASSIGN, TOKEN_TYPES.OP_MOD_ASSIGN,
    TOKEN_TYPES.DEL_LPAREN, TOKEN_TYPES.DEL_COMMA,
    TOKEN_TYPES.OP_ADD, TOKEN_TYPES.OP_SUB, TOKEN_TYPES.OP_MUL, TOKEN_TYPES.OP_DIV,
    TOKEN_TYPES.OP_MOD, TOKEN_TYPES.OP_EXP, TOKEN_TYPES.OP_EQ, TOKEN_TYPES.OP_NEQ,
    TOKEN_TYPES.OP_LT, TOKEN_TYPES.OP_GT, TOKEN_TYPES.OP_LTE, TOKEN_TYPES.OP_GTE,
    TOKEN_TYPES.OP_AND, TOKEN_TYPES.OP_OR, TOKEN_TYPES.OP_NOT
  ];

  return validPrevTypes.includes(prevToken.type) || isOperator(prevToken.type);
};

export default syntaxAnalyzer;
