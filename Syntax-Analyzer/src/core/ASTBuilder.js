/*
Abstract Syntax Tree Builder

Implements AST construction based on ECHO language formal grammar aligned with FORMAL_GRAMMAR.md production rules.
Depends on TokenTypes module.
*/

import { TOKEN_TYPES, isDataType } from '../../../shared/tokenTypes';

/*
AST Node Types - Correspond to non-terminal symbols in the grammar
*/
export const AST_NODE_TYPES = {
  // Program Structure
  ECHO_PROGRAM: 'ECHO_PROGRAM',
  STMT_LIST: 'STMT_LIST',
  STMT: 'STMT',
  
  // Declarations
  DECLARATION_STMT: 'DECLARATION_STMT',
  DECL_LIST: 'DECL_LIST',
  DECL_ITEM: 'DECL_ITEM',
  DATA_TYPE: 'DATA_TYPE',
  
  // Input/Output & Operations
  INPUT_STMT: 'INPUT_STMT',
  OUTPUT_STMT: 'OUTPUT_STMT',
  ASSIGNMENT_STMT: 'ASSIGNMENT_STMT',
  ASSIGNMENT_OP: 'ASSIGNMENT_OP',
  INPUT_EXPRESSION: 'INPUT_EXPRESSION',
  
  // Control Flow
  CONDITIONAL_STMT: 'CONDITIONAL_STMT',
  IF_STMT: 'IF_STMT',
  IF_ELSE_STMT: 'IF_ELSE_STMT',
  IF_ELSEIF_ELSE_STMT: 'IF_ELSEIF_ELSE_STMT',
  NESTED_IF_STMT: 'NESTED_IF_STMT',
  ELSE_IF_BLOCK: 'ELSE_IF_BLOCK',
  ELSE_BLOCK: 'ELSE_BLOCK',
  SWITCH_STMT: 'SWITCH_STMT',
  CASE_BLOCK: 'CASE_BLOCK',
  DEFAULT_BLOCK: 'DEFAULT_BLOCK',
  JUMP_STMT: 'JUMP_STMT',
  
  // Loops
  LOOP_STMT: 'LOOP_STMT',
  FOR_LOOP: 'FOR_LOOP',
  WHILE_LOOP: 'WHILE_LOOP',
  DO_WHILE_LOOP: 'DO_WHILE_LOOP',
  STEP_CLAUSE: 'STEP_CLAUSE',
  
  // Functions
  FUNCTION_DEF: 'FUNCTION_DEF',
  PARAM_LIST: 'PARAM_LIST',
  PARAM: 'PARAM',
  RETURN_STMT: 'RETURN_STMT',
  FUNCTION_CALL: 'FUNCTION_CALL',
  ARG_LIST: 'ARG_LIST',
  RETURN_TYPE: 'RETURN_TYPE',
  
  // Expressions (following operator precedence)
  EXPRESSION: 'EXPRESSION',
  LOGIC_OR: 'LOGIC_OR',
  LOGIC_AND: 'LOGIC_AND',
  EQUALITY: 'EQUALITY',
  RELATIONAL: 'RELATIONAL',
  ADDITIVE: 'ADDITIVE',
  MULTIPLICATIVE: 'MULTIPLICATIVE',
  EXPONENTIAL: 'EXPONENTIAL',
  UNARY: 'UNARY',
  POSTFIX_EXPR: 'POSTFIX_EXPR',
  PRIMARY: 'PRIMARY',
  
  // Lexical Elements
  IDENTIFIER: 'IDENTIFIER',
  LITERAL: 'LITERAL',
  NUMBER_LIT: 'NUMBER_LIT',
  DECIMAL_LIT: 'DECIMAL_LIT',
  STRING_LIT: 'STRING_LIT',
  BOOL_LIT: 'BOOL_LIT',
  NULL_LITERAL: 'NULL_LITERAL',
  LIST_LIT: 'LIST_LIT',
  ARRAY_ELEMENTS: 'ARRAY_ELEMENTS',
  LIST_ACCESS: 'LIST_ACCESS',
  STRING_CONTENT: 'STRING_CONTENT',
  STRING_INSERTION: 'STRING_INSERTION',
  OPERATOR: 'OPERATOR',
  NOISE_WORD: 'NOISE_WORD',
  LETTER: 'LETTER',
  DIGIT: 'DIGIT',
  SPECIAL_CHAR: 'SPECIAL_CHAR',
  OPERATOR_CHAR: 'OPERATOR_CHAR',
  
  // Data Structures
  DATA_STRUCT: 'DATA_STRUCT',
  FIELD_LIST: 'FIELD_LIST',
  FIELD_DECL: 'FIELD_DECL',
  FIELD_ACCESS: 'FIELD_ACCESS',
  MEMBER_ACCESS: 'MEMBER_ACCESS',
  
  // Enhanced Expression Nodes
};

/*
Creates an AST node with the given type and properties

@param {String} type - AST node type
@param {Object} properties - Additional node properties
@returns {Object} AST node object
*/
export const createASTNode = (type, properties = {}) => {
  return {
    type,
    ...properties,
    children: properties.children || [],
  };
};

/*
Builds an Abstract Syntax Tree from tokens using recursive descent parsing

Follows the production rules from FORMAL_GRAMMAR.md

@param {Array} tokens - Array of tokens to parse
@returns {Object} AST result with tree and any parsing errors
*/
export const buildAST = (tokens) => {
  if (!tokens || tokens.length === 0) {
    return null;
  }

  let currentTokenIndex = 0;
  const errors = [];

  const getCurrentToken = () => tokens[currentTokenIndex] || null;
  const peekToken = (offset = 1) => tokens[currentTokenIndex + offset] || null;
  const advanceToken = () => tokens[currentTokenIndex++];
  const matchToken = (expectedType, expectedLexeme = null) => {
    const token = getCurrentToken();
    if (!token) return false;
    
    if (token.type === expectedType) {
      if (expectedLexeme && token.lexeme.toLowerCase() !== expectedLexeme.toLowerCase()) {
        return false;
      }
      return true;
    }
    return false;
  };

  const consumeToken = (expectedType, expectedLexeme = null, errorMessage = null) => {
    if (!matchToken(expectedType, expectedLexeme)) {
      const token = getCurrentToken();
      const error = errorMessage || `Expected ${expectedLexeme || expectedType}, got ${token ? token.type : 'EOF'}`;
      errors.push({
        line: token?.line || 1,
        column: token?.column || 1,
        message: error
      });
      return null;
    }
    return advanceToken();
  };

  // Grammar: <ECHO_program> => "start" <statement_list> "end"
  /*
Parse the complete program structure

@returns {Object|null} AST node for the program or null if parsing fails
*/
  const parseProgram = () => {
    console.log('🔍 Starting AST parsing...');
    const startToken = consumeToken(TOKEN_TYPES.KEYWORD_START, 'start', 'Program must begin with "start" keyword');
    if (!startToken) return null;
    console.log('✅ Consumed start token');

    const statements = parseStatementList();
    console.log('📝 Parsed statements:', statements ? statements.statements?.length || 0 : 0, 'statements');
    
    const endToken = consumeToken(TOKEN_TYPES.KEYWORD_END, 'end', 'Program must end with "end" keyword');
    if (!endToken) return null;
    console.log('✅ Consumed end token');

    console.log('🎯 AST parsing completed successfully');
    return createASTNode(AST_NODE_TYPES.ECHO_PROGRAM, {
      startToken,
      statements,
      endToken,
      errors: errors.length > 0 ? errors : undefined
    });
  };

  // Grammar: <statement_list> => { <statement> }
  // options.stopBefore: break (without consuming) when currentToken.type is in this array.
  // Used so case/else/while aren't consumed as failed statements inside case bodies, if then-bodies, or do-while bodies.
  /*
Parse a list of statements

@param {Object} options - Parsing options including stopBefore array
@returns {Object} AST node for statement list
*/
  const parseStatementList = (options = {}) => {
    const stopBefore = options.stopBefore || [];
    const statements = [];

    while (currentTokenIndex < tokens.length) {
      const currentToken = getCurrentToken();

      // Stop when we see "end" — parent will consume "end" and optional block keyword (if/for/while/do/switch/function)
      if (currentToken && currentToken.type === TOKEN_TYPES.KEYWORD_END) {
        break;
      }

      // Stop before case/default/else/while so the parent can handle them (do not consume)
      if (stopBefore.length && currentToken && stopBefore.includes(currentToken.type)) {
        break;
      }

      const stmt = parseStatement();
      if (stmt) {
        statements.push(stmt);
      } else {
        advanceToken();
      }
    }

    return createASTNode(AST_NODE_TYPES.STMT_LIST, { statements });
  };

  // Grammar: <statement> => <declaration_stmt> | <assignment_stmt> | <input_stmt> 
  //                     | <output_stmt> | <conditional_stmt> | <loop_stmt> 
  //                     | <function_def> | <function_call> | <jump_stmt>
  /*
Parse a single statement based on the current token

@returns {Object|null} AST node for the statement or null if parsing fails
*/
  const parseStatement = () => {
    const token = getCurrentToken();
    if (!token) return null;

    console.log(`🎯 Parsing statement for token: ${token.type} (${token.lexeme})`);

    // Skip noise words
    if (token.type === TOKEN_TYPES.NOISE_WITH || token.type === TOKEN_TYPES.NOISE_TO || token.type === TOKEN_TYPES.NOISE_BY) {
      console.log('⏭️ Skipping noise word');
      advanceToken();
      return parseStatement();
    }

    // Declaration statements
    if (token.type === TOKEN_TYPES.KEYWORD_NUMBER || token.type === TOKEN_TYPES.KEYWORD_DECIMAL ||
        token.type === TOKEN_TYPES.KEYWORD_STRING || token.type === TOKEN_TYPES.KEYWORD_BOOLEAN ||
        token.type === TOKEN_TYPES.KEYWORD_LIST) {
      console.log('📝 Parsing declaration statement');
      return parseDeclaration();
    }

    // Input/Output statements
    if (token.type === TOKEN_TYPES.KEYWORD_ECHO) {
      console.log('📢 Parsing output statement');
      return parseOutputStatement();
    }
    
    // Check for input statement pattern: identifier = input(...)
    if (token.type === TOKEN_TYPES.IDENTIFIER && peekToken()?.type === TOKEN_TYPES.OP_ASSIGN && 
        peekToken(2)?.type === TOKEN_TYPES.KEYWORD_INPUT) {
      console.log('📥 Parsing input statement');
      return parseInputStatement();
    }

    // Control flow statements
    if (token.type === TOKEN_TYPES.KEYWORD_IF) {
      console.log('🔀 Parsing if statement');
      return parseIfStatement();
    }
    
    if (token.type === TOKEN_TYPES.KEYWORD_SWITCH) {
      console.log('🔀 Parsing switch statement');
      return parseSwitchStatement();
    }

    // Loop statements
    if (token.type === TOKEN_TYPES.KEYWORD_FOR) {
      console.log('🔄 Parsing for loop');
      return parseForLoop();
    }
    
    if (token.type === TOKEN_TYPES.KEYWORD_WHILE) {
      console.log('🔄 Parsing while loop');
      return parseWhileLoop();
    }
    
    if (token.type === TOKEN_TYPES.KEYWORD_DO) {
      console.log('🔄 Parsing do-while loop');
      return parseDoWhileLoop();
    }

    // Function definitions
    if (token.type === TOKEN_TYPES.KEYWORD_FUNCTION) {
      console.log('⚙️ Parsing function definition');
      return parseFunctionDef();
    }

    // Jump statements
    if (token.type === TOKEN_TYPES.RESERVED_CONTINUE || token.type === TOKEN_TYPES.RESERVED_BREAK) {
      console.log('⏭️ Parsing jump statement');
      return parseJumpStatement();
    }
    
    if (token.type === TOKEN_TYPES.RESERVED_RETURN) {
      console.log('↩️ Parsing return statement');
      return parseReturnStatement();
    }

    // Data structure definitions
    if (token.type === TOKEN_TYPES.RESERVED_DATA) {
      console.log('🏗️ Parsing data structure');
      return parseDataStruct();
    }

    // Assignment statements or function calls
    if (token.type === TOKEN_TYPES.IDENTIFIER) {
      console.log('📝 Parsing assignment or function call');
      return parseAssignmentOrFunctionCall();
    }

    console.log('❓ Unknown statement type, returning null');
    return null;
  };

  // Grammar: <declaration_stmt> => <data_type> <decl_list>
  const parseDeclaration = () => {
    const dataTypeToken = advanceToken();
    const dataType = createASTNode(AST_NODE_TYPES.DATA_TYPE, { 
      token: dataTypeToken,
      name: dataTypeToken.lexeme 
    });

    const declList = parseDeclarationList();
    
    return createASTNode(AST_NODE_TYPES.DECLARATION_STMT, {
      dataType,
      declList
    });
  };

  // Grammar: <decl_list> => <decl_item> { "," <decl_item> }
  const parseDeclarationList = () => {
    const items = [];
    
    items.push(parseDeclarationItem());
    
    while (matchToken(TOKEN_TYPES.DEL_COMMA)) {
      advanceToken(); // consume comma
      items.push(parseDeclarationItem());
    }
    
    return createASTNode(AST_NODE_TYPES.DECL_LIST, { items });
  };

  // Grammar: <decl_item> => <identifier> | <identifier> "=" <expression> 
  //                   | <identifier> "[" <number_lit> "]" | <identifier> "=" <list_lit>
  const parseDeclarationItem = () => {
    const identifierToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
    if (!identifierToken) return null;

    const identifier = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
      token: identifierToken,
      name: identifierToken.lexeme
    });

    // Check for array declaration: identifier[number_lit]
    if (matchToken(TOKEN_TYPES.DEL_LBRACK)) {
      advanceToken(); // consume [
      const sizeToken = consumeToken(TOKEN_TYPES.NUMBER_LITERAL);
      consumeToken(TOKEN_TYPES.DEL_RBRACK, ']', 'Expected "]" after array size');
      
      return createASTNode(AST_NODE_TYPES.DECL_ITEM, {
        identifier,
        isArray: true,
        size: sizeToken ? createASTNode(AST_NODE_TYPES.NUMBER_LIT, { token: sizeToken }) : null
      });
    }

    // Check for assignment: identifier = expression
    if (matchToken(TOKEN_TYPES.OP_ASSIGN)) {
      advanceToken(); // consume =
      const expression = parseExpression();
      
      return createASTNode(AST_NODE_TYPES.DECL_ITEM, {
        identifier,
        value: expression
      });
    }

    // Simple declaration
    return createASTNode(AST_NODE_TYPES.DECL_ITEM, { identifier });
  };

  // Grammar: <assignment_stmt> => <identifier> <assignment_op> <expression>
  //                           | <list_access> <assignment_op> <expression>
  const parseAssignmentOrFunctionCall = () => {
    const identifierToken = advanceToken();
    const identifier = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
      token: identifierToken,
      name: identifierToken.lexeme
    });

    // Check for function call: identifier(...)
    if (matchToken(TOKEN_TYPES.DEL_LPAREN)) {
      return parseFunctionCall(identifier);
    }

    // Check for list access: identifier[expression]
    let target = identifier;
    if (matchToken(TOKEN_TYPES.DEL_LBRACK)) {
      advanceToken(); // consume [
      const index = parseExpression();
      consumeToken(TOKEN_TYPES.DEL_RBRACK, ']', 'Expected "]" after array index');
      
      target = createASTNode(AST_NODE_TYPES.LIST_ACCESS, {
        array: identifier,
        index
      });
    }

    // Assignment operator
    const opToken = getCurrentToken();
    if (opToken && (opToken.type === TOKEN_TYPES.OP_ASSIGN || 
                    opToken.type === TOKEN_TYPES.OP_ADD_ASSIGN ||
                    opToken.type === TOKEN_TYPES.OP_SUB_ASSIGN ||
                    opToken.type === TOKEN_TYPES.OP_MUL_ASSIGN ||
                    opToken.type === TOKEN_TYPES.OP_DIV_ASSIGN ||
                    opToken.type === TOKEN_TYPES.OP_MOD_ASSIGN)) {
      advanceToken(); // consume assignment operator
      
      const assignmentOp = createASTNode(AST_NODE_TYPES.ASSIGNMENT_OP, {
        token: opToken,
        operator: opToken.lexeme
      });

      const value = parseExpression();
      
      return createASTNode(AST_NODE_TYPES.ASSIGNMENT_STMT, {
        target,
        assignmentOp,
        value
      });
    }

    // Just an identifier (expression statement)
    return createASTNode(AST_NODE_TYPES.EXPRESSION, { value: identifier });
  };

  // Grammar: <function_call> => <identifier> "(" [ <arg_list> ] ")"
  const parseFunctionCall = (identifier) => {
    advanceToken(); // consume (
    
    const args = [];
    if (!matchToken(TOKEN_TYPES.DEL_RPAREN)) {
      args.push(parseExpression());
      while (matchToken(TOKEN_TYPES.DEL_COMMA)) {
        advanceToken(); // consume comma
        args.push(parseExpression());
      }
    }
    
    consumeToken(TOKEN_TYPES.DEL_RPAREN, ')', 'Expected ")" after function arguments');
    
    const argList = createASTNode(AST_NODE_TYPES.ARG_LIST, { args });
    
    return createASTNode(AST_NODE_TYPES.FUNCTION_CALL, {
      function: identifier,
      arguments: argList
    });
  };

  // Grammar: <output_stmt> => "echo" <expression> | "echo" <string_lit>
  // Note: When echoing identifiers, they must be prefixed with @ (String Insertion System)
  // Validation for this rule is handled in SyntaxAnalyzer.js to avoid duplicate errors
  const parseOutputStatement = () => {
    const echoToken = advanceToken(); // consume echo
    
    let expression = null;
    if (matchToken(TOKEN_TYPES.STRING_LITERAL)) {
      // The lexical scanner may have split a string with @identifier into multiple tokens:
      // STRING_LITERAL (text before @), SIS_MARKER (@identifier), STRING_LITERAL (text after @)
      // We need to reconstruct the full string and parse it
      expression = parseCompositeStringLiteral();
    } else {
      expression = parseExpression();
    }
    
    return createASTNode(AST_NODE_TYPES.OUTPUT_STMT, {
      keyword: echoToken,
      args: expression ? [expression] : []
    });
  };

  // Parse a string literal that may have been split into multiple tokens by the lexical scanner
  // Handles: STRING_LITERAL + SIS_MARKER + STRING_LITERAL pattern
  const parseCompositeStringLiteral = () => {
    const parts = [];
    let fullContent = '';
    let firstToken = null;
    
    // Collect all consecutive STRING_LITERAL and SIS_MARKER tokens
    while (currentTokenIndex < tokens.length) {
      const token = getCurrentToken();
      
      if (token.type === TOKEN_TYPES.STRING_LITERAL) {
        if (!firstToken) firstToken = token;
        const content = token.lexeme.slice(1, -1); // Remove quotes
        fullContent += content;
        parts.push({ type: 'STRING', content });
        advanceToken();
      } else if (token.type === TOKEN_TYPES.SIS_MARKER) {
        // Extract identifier from @identifier
        const identifierName = token.lexeme.startsWith('@') 
          ? token.lexeme.substring(1) 
          : token.lexeme;
        fullContent += token.lexeme; // Include @identifier in full content
        parts.push({ type: 'SIS', identifier: identifierName, token });
        advanceToken();
      } else {
        // Not part of the string literal anymore
        break;
      }
    }
    
    // If we only had one STRING_LITERAL token, use the existing parser
    if (parts.length === 1 && parts[0].type === 'STRING' && firstToken) {
      return parseStringLiteral(firstToken);
    }
    
    // Otherwise, build the string literal AST from the parts
    const contentParts = [];
    for (const part of parts) {
      if (part.type === 'STRING' && part.content) {
        contentParts.push(createASTNode(AST_NODE_TYPES.STRING_CONTENT, {
          value: part.content
        }));
      } else if (part.type === 'SIS') {
        contentParts.push(createASTNode(AST_NODE_TYPES.STRING_INSERTION, {
          token: part.token,
          identifier: createASTNode(AST_NODE_TYPES.IDENTIFIER, {
            name: part.identifier
          })
        }));
      }
    }
    
    // Create a synthetic string token for the full content
    const syntheticToken = firstToken || {
      line: 1,
      column: 1,
      lexeme: `"${fullContent}"`
    };
    
    return createASTNode(AST_NODE_TYPES.STRING_LIT, {
      token: syntheticToken,
      content: contentParts.length > 0 ? contentParts : [createASTNode(AST_NODE_TYPES.STRING_CONTENT, { value: fullContent })]
    });
  };

  // Grammar: <string_lit> => '"' { <string_content> } '"'
  // Grammar: <string_content> => <letter> | <digit> | <operator> | <special_char> | " " | "@" <identifier>
  const parseStringLiteral = (stringToken) => {
    const content = stringToken.lexeme.slice(1, -1); // Remove quotes
    const parts = [];
    let currentText = '';
    let i = 0;
    
    while (i < content.length) {
      if (content[i] === '@' && i + 1 < content.length) {
        // Found string insertion
        if (currentText) {
          parts.push(createASTNode(AST_NODE_TYPES.STRING_CONTENT, {
            value: currentText
          }));
          currentText = '';
        }
        
        // Parse identifier after @
        let ident = '';
        i++; // Skip @
        while (i < content.length && /[a-zA-Z0-9_]/.test(content[i])) {
          ident += content[i];
          i++;
        }
        
        if (ident) {
          parts.push(createASTNode(AST_NODE_TYPES.STRING_INSERTION, {
            identifier: createASTNode(AST_NODE_TYPES.IDENTIFIER, { name: ident })
          }));
        }
      } else {
        currentText += content[i];
        i++;
      }
    }
    
    // Add remaining text
    if (currentText) {
      parts.push(createASTNode(AST_NODE_TYPES.STRING_CONTENT, {
        value: currentText
      }));
    }
    
    return createASTNode(AST_NODE_TYPES.STRING_LIT, {
      token: stringToken,
      content: parts.length > 0 ? parts : [createASTNode(AST_NODE_TYPES.STRING_CONTENT, { value: content })]
    });
  };

  // Grammar: <input_stmt> => <identifier> <assignment_op> <input_expression>
  const parseInputStatement = () => {
    // Parse: identifier = input(data_type)
    const identifierToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
    if (!identifierToken) return null;
    
    const identifier = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
      token: identifierToken,
      name: identifierToken.lexeme
    });

    const assignmentOpToken = consumeToken(TOKEN_TYPES.OP_ASSIGN, '=', 'Expected "=" after identifier in input statement');
    if (!assignmentOpToken) return null;
    
    const assignmentOp = createASTNode(AST_NODE_TYPES.ASSIGNMENT_OP, {
      token: assignmentOpToken,
      operator: assignmentOpToken.lexeme
    });

    const inputToken = consumeToken(TOKEN_TYPES.KEYWORD_INPUT, 'input', 'Expected "input" keyword');
    if (!inputToken) return null;
    
    if (matchToken(TOKEN_TYPES.DEL_LPAREN)) {
      advanceToken(); // consume (
      
      const dataTypeToken = getCurrentToken();
      if (dataTypeToken && (dataTypeToken.type === TOKEN_TYPES.KEYWORD_NUMBER ||
                           dataTypeToken.type === TOKEN_TYPES.KEYWORD_DECIMAL ||
                           dataTypeToken.type === TOKEN_TYPES.KEYWORD_STRING ||
                           dataTypeToken.type === TOKEN_TYPES.KEYWORD_BOOLEAN ||
                           dataTypeToken.type === TOKEN_TYPES.KEYWORD_LIST)) {
        advanceToken(); // consume data type
        
        let promptExpr = null;
        if (matchToken(TOKEN_TYPES.DEL_COMMA)) {
          advanceToken(); // consume comma
          promptExpr = parseExpression();
        }
        
        consumeToken(TOKEN_TYPES.DEL_RPAREN, ')', 'Expected ")" after input parameters');
        
        const inputExpression = createASTNode(AST_NODE_TYPES.INPUT_EXPRESSION, {
          dataType: createASTNode(AST_NODE_TYPES.DATA_TYPE, { 
            token: dataTypeToken,
            name: dataTypeToken.lexeme 
          }),
          prompt: promptExpr
        });
        
        return createASTNode(AST_NODE_TYPES.INPUT_STMT, {
          target: identifier,
          assignmentOp,
          expression: inputExpression
        });
      }
    }
    
    return null;
  };

  // Grammar: <conditional_stmt> => <if_stmt> | <switch_stmt>
  const parseIfStatement = () => {
    const ifToken = advanceToken(); // consume if

    const condition = parseExpression();

    // Handle optional "then" keyword (user-friendly extension)
    if (matchToken(TOKEN_TYPES.IDENTIFIER, 'then')) {
      advanceToken(); // consume then
    }

    const thenBody = parseStatementList({ stopBefore: [TOKEN_TYPES.KEYWORD_ELSE] });

    const elseIfs = [];
    while (matchToken(TOKEN_TYPES.KEYWORD_ELSE) && peekToken()?.lexeme === 'if') {
      advanceToken(); // consume else
      advanceToken(); // consume if

      const elifCondition = parseExpression();

      // Handle optional "then" keyword in else if
      if (matchToken(TOKEN_TYPES.IDENTIFIER, 'then')) {
        advanceToken(); // consume then
      }

      const elifBody = parseStatementList({ stopBefore: [TOKEN_TYPES.KEYWORD_ELSE] });

      elseIfs.push(createASTNode(AST_NODE_TYPES.ELSE_IF_BLOCK, {
        condition: elifCondition,
        body: elifBody
      }));
    }

    let elseBody = null;
    if (matchToken(TOKEN_TYPES.KEYWORD_ELSE)) {
      advanceToken(); // consume else
      elseBody = parseStatementList();
    }
    
    consumeToken(TOKEN_TYPES.KEYWORD_END, 'end', 'Expected "end" to close if statement');
    consumeToken(TOKEN_TYPES.KEYWORD_IF, 'if', 'Expected "if" after "end"');
    
    return createASTNode(AST_NODE_TYPES.IF_STMT, {
      keyword: ifToken,
      condition,
      thenBody,
      elseIfs,
      elseBody
    });
  };

  const parseSwitchStatement = () => {
    const switchToken = advanceToken(); // consume switch

    const expression = parseExpression();

    const cases = [];
    let defaultBlock = null;

    while (currentTokenIndex < tokens.length &&
           !(matchToken(TOKEN_TYPES.KEYWORD_END, 'end') && peekToken()?.type === TOKEN_TYPES.KEYWORD_SWITCH)) {
      if (matchToken(TOKEN_TYPES.KEYWORD_CASE)) {
        advanceToken(); // consume case
        const value = parsePrimary(); // Parse literal
        const body = parseStatementList({ stopBefore: [TOKEN_TYPES.KEYWORD_CASE, TOKEN_TYPES.KEYWORD_DEFAULT] });

        cases.push(createASTNode(AST_NODE_TYPES.CASE_BLOCK, {
          value,
          body
        }));
      } else if (matchToken(TOKEN_TYPES.KEYWORD_DEFAULT)) {
        advanceToken(); // consume default
        defaultBlock = parseStatementList();
      } else {
        break;
      }
    }
    
    consumeToken(TOKEN_TYPES.KEYWORD_END, 'end', 'Expected "end" to close switch statement');
    consumeToken(TOKEN_TYPES.KEYWORD_SWITCH, 'switch', 'Expected "switch" after "end"');
    
    return createASTNode(AST_NODE_TYPES.SWITCH_STMT, {
      keyword: switchToken,
      expression,
      cases,
      defaultBlock
    });
  };

  const parseForLoop = () => {
    console.log('🔄 Starting for loop parsing...');
    const forToken = advanceToken(); // consume for
    console.log(`✅ Consumed FOR token: ${forToken.lexeme}`);
    
    const iteratorToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
    if (!iteratorToken) {
      console.log(`❌ Expected IDENTIFIER after FOR, got: ${getCurrentToken()?.type} (${getCurrentToken()?.lexeme})`);
      return null;
    }
    console.log(`✅ Consumed iterator identifier: ${iteratorToken.lexeme}`);
    
    const iterator = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
      token: iteratorToken,
      name: iteratorToken?.lexeme
    });
    
    const assignToken = consumeToken(TOKEN_TYPES.OP_ASSIGN, '=', 'Expected "=" after for loop iterator');
    if (!assignToken) {
      console.log(`❌ Expected '=' after iterator, got: ${getCurrentToken()?.type} (${getCurrentToken()?.lexeme})`);
      return null;
    }
    console.log(`✅ Consumed assignment operator: ${assignToken.lexeme}`);
    
    const start = parseExpression();
    if (!start) {
      console.log('❌ Failed to parse start expression');
      return null;
    }
    console.log(`✅ Parsed start expression`);
    
    const toToken = consumeToken(TOKEN_TYPES.NOISE_TO, 'to', 'Expected "to" in for loop');
    if (!toToken) {
      console.log(`❌ Expected 'to' after start expression, got: ${getCurrentToken()?.type} (${getCurrentToken()?.lexeme})`);
      return null;
    }
    console.log(`✅ Consumed TO token: ${toToken.lexeme}`);
    
    const end = parseExpression();
    if (!end) {
      console.log('❌ Failed to parse end expression');
      return null;
    }
    console.log(`✅ Parsed end expression`);
    
    let step = null;
    if (matchToken(TOKEN_TYPES.NOISE_BY)) {
      console.log('📏 Found BY token, parsing step clause');
      advanceToken(); // consume by
      step = parseExpression();
      console.log(`✅ Parsed step expression`);
    }
    
    console.log('📝 Parsing for loop body...');
    const body = parseStatementList();
    if (!body) {
      console.log('❌ Failed to parse for loop body');
      return null;
    }
    console.log(`✅ Parsed for loop body with ${body.statements?.length || 0} statements`);
    
    const endToken = consumeToken(TOKEN_TYPES.KEYWORD_END, 'end', 'Expected "end" to close for loop');
    if (!endToken) {
      console.log(`❌ Expected 'end' after for loop body, got: ${getCurrentToken()?.type} (${getCurrentToken()?.lexeme})`);
      return null;
    }
    console.log(`✅ Consumed END token: ${endToken.lexeme}`);
    
    const forTokenEnd = consumeToken(TOKEN_TYPES.KEYWORD_FOR, 'for', 'Expected "for" after "end"');
    if (!forTokenEnd) {
      console.log(`❌ Expected 'for' after 'end', got: ${getCurrentToken()?.type} (${getCurrentToken()?.lexeme})`);
      return null;
    }
    console.log(`✅ Consumed FOR token: ${forTokenEnd.lexeme}`);
    
    console.log('🎯 For loop parsing completed successfully');
    return createASTNode(AST_NODE_TYPES.FOR_LOOP, {
      keyword: forToken,
      iterator,
      start,
      end,
      step: step ? createASTNode(AST_NODE_TYPES.STEP_CLAUSE, { value: step }) : null,
      body
    });
  };

  const parseWhileLoop = () => {
    const whileToken = advanceToken(); // consume while
    
    const condition = parseExpression();
    const body = parseStatementList();
    
    consumeToken(TOKEN_TYPES.KEYWORD_END, 'end', 'Expected "end" to close while loop');
    consumeToken(TOKEN_TYPES.KEYWORD_WHILE, 'while', 'Expected "while" after "end"');
    
    return createASTNode(AST_NODE_TYPES.WHILE_LOOP, {
      keyword: whileToken,
      condition,
      body
    });
  };

  const parseDoWhileLoop = () => {
    const doToken = advanceToken(); // consume do

    const body = parseStatementList({ stopBefore: [TOKEN_TYPES.KEYWORD_WHILE] });

    consumeToken(TOKEN_TYPES.KEYWORD_WHILE, 'while', 'Expected "while" to close do-while loop');
    const condition = parseExpression();
    
    consumeToken(TOKEN_TYPES.KEYWORD_END, 'end', 'Expected "end" to close do-while loop');
    consumeToken(TOKEN_TYPES.KEYWORD_DO, 'do', 'Expected "do" after "end"');
    
    return createASTNode(AST_NODE_TYPES.DO_WHILE_LOOP, {
      keyword: doToken,
      body,
      condition
    });
  };

  const parseFunctionDef = () => {
    const functionToken = advanceToken(); // consume function
    
    let returnType = null;
    if (isDataType(getCurrentToken()?.type)) {
      const returnTypeToken = advanceToken();
      returnType = createASTNode(AST_NODE_TYPES.RETURN_TYPE, {
        token: returnTypeToken,
        name: returnTypeToken.lexeme
      });
    }
    
    const nameToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
    const name = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
      token: nameToken,
      name: nameToken?.lexeme
    });
    
    consumeToken(TOKEN_TYPES.DEL_LPAREN, '(', 'Expected "(" after function name');
    
    const params = [];
    if (!matchToken(TOKEN_TYPES.DEL_RPAREN)) {
      // Try to parse first parameter
      const firstParam = parseParameter();
      if (firstParam) {
        params.push(firstParam);
        
        // Parse remaining parameters
        while (matchToken(TOKEN_TYPES.DEL_COMMA)) {
          advanceToken(); // consume comma
          const param = parseParameter();
          if (param) {
            params.push(param);
          } else {
            // If we can't parse a parameter after comma, there's a syntax error
            const currentToken = getCurrentToken();
            if (currentToken) {
              errors.push({
                line: currentToken.line,
                column: currentToken.column,
                message: `Expected parameter after comma, but found '${currentToken.lexeme}'. Function parameters should follow the format: 'data_type parameter_name'`
              });
            }
            break;
          }
        }
      } else {
        // If we can't parse the first parameter, check if user omitted data types
        const currentToken = getCurrentToken();
        if (currentToken && currentToken.type === TOKEN_TYPES.IDENTIFIER) {
          // User probably wrote: function name(param1, param2) instead of function name(type1 param1, type2 param2)
          const paramNames = [];
          paramNames.push(currentToken.lexeme);
          
          // Collect all parameter names until closing parenthesis
          while (matchToken(TOKEN_TYPES.DEL_COMMA)) {
            advanceToken(); // consume comma
            const nextToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
            if (nextToken) {
              paramNames.push(nextToken.lexeme);
            } else {
              break;
            }
          }
          
          consumeToken(TOKEN_TYPES.DEL_RPAREN, ')', 'Expected ")" after parameter list');
          
          errors.push({
            line: functionToken.line,
            column: functionToken.column,
            message: `Function parameters must include data types. Found parameters: ${paramNames.join(', ')}. Expected format: 'data_type parameter_name'. Example: 'string ${paramNames.join(', string ')}'`
          });
          
          // Continue with empty parameter list for now
        }
      }
    }
    
    consumeToken(TOKEN_TYPES.DEL_RPAREN, ')', 'Expected ")" after function parameters');

    const paramList = createASTNode(AST_NODE_TYPES.PARAM_LIST, { params });

    // Body stops before "return" so <return_stmt> is parsed separately per grammar:
    // <function_def> => "function" ... <statement_list> <return_stmt> "end" "function"
    const body = parseStatementList({ stopBefore: [TOKEN_TYPES.RESERVED_RETURN] });

    let returnStmt = null;
    let hasReturn = false;

    // Check for return statement and validate return type
    if (matchToken(TOKEN_TYPES.RESERVED_RETURN)) {
      returnStmt = parseReturnStatement();
      hasReturn = true;
      
      // Validate return type consistency
      if (returnType && returnStmt.value) {
        const returnValueType = inferExpressionType(returnStmt.value);
        if (!isTypeCompatible(returnType.name, returnValueType)) {
          errors.push({
            line: returnStmt.token?.line || 1,
            column: returnStmt.token?.column || 1,
            message: `Return type mismatch: function declares '${returnType.name}' but returns '${returnValueType}'`
          });
        }
      }
    } else if (returnType && !hasReturn) {
      // Function has return type but no return statement
      errors.push({
        line: functionToken.line,
        column: functionToken.column,
        message: `Function '${nameToken?.lexeme}' declares return type '${returnType.name}' but has no return statement`
      });
    }
    
    consumeToken(TOKEN_TYPES.KEYWORD_END, 'end', 'Expected "end" to close function');
    consumeToken(TOKEN_TYPES.KEYWORD_FUNCTION, 'function', 'Expected "function" after "end"');
    
    return createASTNode(AST_NODE_TYPES.FUNCTION_DEF, {
      keyword: functionToken,
      returnType,
      name,
      parameters: paramList,
      body,
      returnStatement: returnStmt
    });
  };

  const parseParameter = () => {
    const dataTypeToken = getCurrentToken();
    if (!dataTypeToken || (dataTypeToken.type !== TOKEN_TYPES.KEYWORD_NUMBER &&
                         dataTypeToken.type !== TOKEN_TYPES.KEYWORD_DECIMAL &&
                         dataTypeToken.type !== TOKEN_TYPES.KEYWORD_STRING &&
                         dataTypeToken.type !== TOKEN_TYPES.KEYWORD_BOOLEAN &&
                         dataTypeToken.type !== TOKEN_TYPES.KEYWORD_LIST)) {
      // If we don't have a data type, this might be the case where user omitted data types
      // Provide a helpful error message
      if (dataTypeToken && dataTypeToken.type === TOKEN_TYPES.IDENTIFIER) {
        errors.push({
          line: dataTypeToken.line,
          column: dataTypeToken.column,
          message: `Function parameters must include data types. Expected format: 'data_type parameter_name', but found '${dataTypeToken.lexeme}'. Try: 'string ${dataTypeToken.lexeme}'`
        });
      }
      return null;
    }
    
    advanceToken(); // consume data type
    
    const nameToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
    if (!nameToken) {
      const currentToken = getCurrentToken();
      if (currentToken) {
        errors.push({
          line: currentToken.line,
          column: currentToken.column,
          message: `Expected parameter name (identifier) after data type '${dataTypeToken.lexeme}', but found '${currentToken.lexeme}' of type ${currentToken.type}`
        });
      }
      return null;
    }
    
    return createASTNode(AST_NODE_TYPES.PARAM, {
      dataType: createASTNode(AST_NODE_TYPES.DATA_TYPE, { 
        token: dataTypeToken,
        name: dataTypeToken.lexeme 
      }),
      name: createASTNode(AST_NODE_TYPES.IDENTIFIER, {
        token: nameToken,
        name: nameToken?.lexeme
      })
    });
  };

  const parseReturnStatement = () => {
    const returnToken = advanceToken(); // consume return
    
    let value = null;
    if (!matchToken(TOKEN_TYPES.KEYWORD_END) && !matchToken(TOKEN_TYPES.KEYWORD_FUNCTION)) {
      value = parseExpression();
    }
    
    return createASTNode(AST_NODE_TYPES.RETURN_STMT, {
      keyword: returnToken,
      value
    });
  };

  const parseJumpStatement = () => {
    const token = advanceToken();
    return createASTNode(AST_NODE_TYPES.JUMP_STMT, {
      keyword: token,
      type: token.lexeme.toLowerCase()
    });
  };

  // Grammar: <data_struct> => "data" "struct" <identifier> "{" <field_list> "}"
  const parseDataStruct = () => {
    const dataToken = advanceToken(); // consume data
    
    const structToken = consumeToken(TOKEN_TYPES.RESERVED_STRUCT, 'struct', 'Expected "struct" after "data"');
    
    const nameToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
    const name = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
      token: nameToken,
      name: nameToken?.lexeme
    });
    
    consumeToken(TOKEN_TYPES.DEL_LBRACE, '{', 'Expected "{" after struct name');
    
    const fields = [];
    while (!matchToken(TOKEN_TYPES.DEL_RBRACE) && currentTokenIndex < tokens.length) {
      fields.push(parseFieldDeclaration());
      
      // Optional comma between field declarations
      if (matchToken(TOKEN_TYPES.DEL_COMMA)) {
        advanceToken();
      }
    }
    
    consumeToken(TOKEN_TYPES.DEL_RBRACE, '}', 'Expected "}" to close struct definition');
    
    const fieldList = createASTNode(AST_NODE_TYPES.FIELD_LIST, { fields });
    
    return createASTNode(AST_NODE_TYPES.DATA_STRUCT, {
      keyword: dataToken,
      structToken,
      name,
      fields: fieldList
    });
  };

  // Grammar: <field_decl> => <data_type> <identifier> | <data_type> <identifier> "=" <expression>
  const parseFieldDeclaration = () => {
    const dataTypeToken = getCurrentToken();
    if (!isDataType(dataTypeToken?.type)) {
      errors.push({
        line: dataTypeToken?.line || 1,
        column: dataTypeToken?.column || 1,
        message: `Expected data type in field declaration, found ${dataTypeToken?.lexeme || 'EOF'}`
      });
      return null;
    }
    
    advanceToken(); // consume data type
    
    const nameToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
    const identifier = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
      token: nameToken,
      name: nameToken?.lexeme
    });
    
    let defaultValue = null;
    if (matchToken(TOKEN_TYPES.OP_ASSIGN)) {
      advanceToken(); // consume =
      defaultValue = parseExpression();
    }
    
    return createASTNode(AST_NODE_TYPES.FIELD_DECL, {
      dataType: createASTNode(AST_NODE_TYPES.DATA_TYPE, {
        token: dataTypeToken,
        name: dataTypeToken.lexeme
      }),
      identifier,
      defaultValue
    });
  };

  // Expression parsing following operator precedence from grammar
  const parseExpression = () => parseLogicalOr();

  const parseLogicalOr = () => {
    let left = parseLogicalAnd();
    
    while (matchToken(TOKEN_TYPES.OP_OR)) {
      const opToken = advanceToken();
      const right = parseLogicalAnd();
      left = createASTNode(AST_NODE_TYPES.LOGIC_OR, {
        left,
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        right
      });
    }
    
    return left;
  };

  const parseLogicalAnd = () => {
    let left = parseEquality();
    
    while (matchToken(TOKEN_TYPES.OP_AND)) {
      const opToken = advanceToken();
      const right = parseEquality();
      left = createASTNode(AST_NODE_TYPES.LOGIC_AND, {
        left,
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        right
      });
    }
    
    return left;
  };

  const parseEquality = () => {
    let left = parseRelational();
    
    while (matchToken(TOKEN_TYPES.OP_EQ) || matchToken(TOKEN_TYPES.OP_NEQ)) {
      const opToken = advanceToken();
      const right = parseRelational();
      left = createASTNode(AST_NODE_TYPES.EQUALITY, {
        left,
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        right
      });
    }
    
    return left;
  };

  const parseRelational = () => {
    let left = parseAdditive();
    
    while (matchToken(TOKEN_TYPES.OP_LT) || matchToken(TOKEN_TYPES.OP_GT) ||
           matchToken(TOKEN_TYPES.OP_LTE) || matchToken(TOKEN_TYPES.OP_GTE)) {
      const opToken = advanceToken();
      const right = parseAdditive();
      left = createASTNode(AST_NODE_TYPES.RELATIONAL, {
        left,
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        right
      });
    }
    
    return left;
  };

  const parseAdditive = () => {
    let left = parseMultiplicative();
    
    while (matchToken(TOKEN_TYPES.OP_ADD) || matchToken(TOKEN_TYPES.OP_SUB)) {
      const opToken = advanceToken();
      const right = parseMultiplicative();
      left = createASTNode(AST_NODE_TYPES.ADDITIVE, {
        left,
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        right
      });
    }
    
    return left;
  };

  const parseMultiplicative = () => {
    let left = parseExponential();
    
    while (matchToken(TOKEN_TYPES.OP_MUL) || matchToken(TOKEN_TYPES.OP_DIV) ||
           matchToken(TOKEN_TYPES.OP_INT_DIV) || matchToken(TOKEN_TYPES.OP_MOD)) {
      const opToken = advanceToken();
      const right = parseExponential();
      left = createASTNode(AST_NODE_TYPES.MULTIPLICATIVE, {
        left,
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        right
      });
    }
    
    return left;
  };

  const parseExponential = () => {
    let left = parseUnary();
    
    while (matchToken(TOKEN_TYPES.OP_EXP)) {
      const opToken = advanceToken();
      const right = parseUnary();
      left = createASTNode(AST_NODE_TYPES.EXPONENTIAL, {
        left,
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        right
      });
    }
    
    return left;
  };

  // Enhanced postfix parsing for member access and field access
  const parsePostfix = () => {
    let expr = parsePrimary();
    
    while (true) {
      if (matchToken(TOKEN_TYPES.DEL_LBRACK)) {
        advanceToken(); // consume [
        const index = parseExpression();
        consumeToken(TOKEN_TYPES.DEL_RBRACK, ']', 'Expected "]" after array index');
        expr = createASTNode(AST_NODE_TYPES.LIST_ACCESS, {
          array: expr,
          index
        });
      } else if (matchToken(TOKEN_TYPES.DEL_PERIOD)) {
        advanceToken(); // consume .
        const fieldToken = consumeToken(TOKEN_TYPES.IDENTIFIER);
        if (fieldToken) {
          const field = createASTNode(AST_NODE_TYPES.IDENTIFIER, {
            token: fieldToken,
            name: fieldToken.lexeme
          });
          expr = createASTNode(AST_NODE_TYPES.FIELD_ACCESS, {
            object: expr,
            field
          });
        }
      } else if (matchToken(TOKEN_TYPES.DEL_LPAREN)) {
        advanceToken(); // consume (
        const args = [];
        if (!matchToken(TOKEN_TYPES.DEL_RPAREN)) {
          args.push(parseExpression());
          while (matchToken(TOKEN_TYPES.DEL_COMMA)) {
            advanceToken(); // consume comma
            args.push(parseExpression());
          }
        }
        consumeToken(TOKEN_TYPES.DEL_RPAREN, ')', 'Expected ")" after function arguments');
        
        const argList = createASTNode(AST_NODE_TYPES.ARG_LIST, { args });
        expr = createASTNode(AST_NODE_TYPES.FUNCTION_CALL, {
          function: expr,
          arguments: argList
        });
      } else {
        break;
      }
    }
    
    return expr;
  };

  const parseUnary = () => {
    if (matchToken(TOKEN_TYPES.OP_NOT) || matchToken(TOKEN_TYPES.OP_ADD) || 
        matchToken(TOKEN_TYPES.OP_SUB) || matchToken(TOKEN_TYPES.OP_INC) || 
        matchToken(TOKEN_TYPES.OP_DEC)) {
      const opToken = advanceToken();
      const expr = parseUnary();
      return createASTNode(AST_NODE_TYPES.UNARY, {
        operator: createASTNode(AST_NODE_TYPES.OPERATOR, { token: opToken }),
        expression: expr
      });
    }
    
    return parsePostfix();
  };


  // Grammar: <primary> => <identifier> | <literal>
  const parsePrimary = () => {
    const token = getCurrentToken();
    if (!token) return null;
    
    // Handle literals
    if (token.type === TOKEN_TYPES.NUMBER_LITERAL) {
      const numToken = advanceToken();
      return createASTNode(AST_NODE_TYPES.NUMBER_LIT, { 
        token: numToken, 
        value: parseFloat(numToken.lexeme) 
      });
    }
    
    if (token.type === TOKEN_TYPES.DECIMAL_LITERAL) {
      const decToken = advanceToken();
      return createASTNode(AST_NODE_TYPES.DECIMAL_LIT, { 
        token: decToken, 
        value: parseFloat(decToken.lexeme) 
      });
    }
    
    if (token.type === TOKEN_TYPES.STRING_LITERAL) {
      // Check if this is part of a composite string (split by lexical scanner)
      // Look ahead to see if there are SIS_MARKER or more STRING_LITERAL tokens
      const nextToken = peekToken();
      if (nextToken && (nextToken.type === TOKEN_TYPES.SIS_MARKER || nextToken.type === TOKEN_TYPES.STRING_LITERAL)) {
        // This is a composite string literal - parse it as such
        return parseCompositeStringLiteral();
      } else {
        // Single string literal token - use standard parser
        const strToken = advanceToken();
        return parseStringLiteral(strToken);
      }
    }
    
    if (token.type === TOKEN_TYPES.RESERVED_TRUE) {
      const boolToken = advanceToken();
      return createASTNode(AST_NODE_TYPES.BOOL_LIT, { 
        token: boolToken, 
        value: true 
      });
    }
    
    if (token.type === TOKEN_TYPES.RESERVED_FALSE) {
      const boolToken = advanceToken();
      return createASTNode(AST_NODE_TYPES.BOOL_LIT, { 
        token: boolToken, 
        value: false 
      });
    }
    
    if (token.type === TOKEN_TYPES.RESERVED_NULL) {
      const nullToken = advanceToken();
      return createASTNode(AST_NODE_TYPES.NULL_LITERAL, { 
        token: nullToken, 
        value: null 
      });
    }
    
    // Handle String Insertion System (SIS): @identifier
    // The lexical scanner creates SIS_MARKER tokens for @identifier outside strings
    // The lexeme includes both @ and the identifier (e.g., "@greeting")
    if (token.type === TOKEN_TYPES.SIS_MARKER) {
      const sisToken = advanceToken();
      // Extract identifier name from @identifier (remove the @)
      const identifierName = sisToken.lexeme.startsWith('@') 
        ? sisToken.lexeme.substring(1) 
        : sisToken.lexeme;
      
      // Create a variable reference node for the SIS expression
      return createASTNode(AST_NODE_TYPES.STRING_INSERTION, {
        token: sisToken,
        identifier: createASTNode(AST_NODE_TYPES.IDENTIFIER, {
          name: identifierName
        })
      });
    }
    
    if (token.type === TOKEN_TYPES.IDENTIFIER) {
      const identToken = advanceToken();
      return createASTNode(AST_NODE_TYPES.IDENTIFIER, {
        token: identToken,
        name: identToken.lexeme
      });
    }
    
    if (token.type === TOKEN_TYPES.DEL_LPAREN) {
      advanceToken(); // consume (
      const expr = parseExpression();
      consumeToken(TOKEN_TYPES.DEL_RPAREN, ')', 'Expected ")" after expression');
      return expr;
    }
    
    if (token.type === TOKEN_TYPES.DEL_LBRACK) {
      return parseListLiteral();
    }
    
    return null;
  };

  // Grammar: <list_lit> => "[" [ <array_elements> ] "]"
  // Grammar: <array_elements> => <expression> { "," <expression> }
  const parseListLiteral = () => {
    const lbrackToken = advanceToken(); // consume [
    const elements = [];
    if (!matchToken(TOKEN_TYPES.DEL_RBRACK)) {
      elements.push(parseExpression());
      while (matchToken(TOKEN_TYPES.DEL_COMMA)) {
        advanceToken(); // consume comma
        elements.push(parseExpression());
      }
    }
    
    consumeToken(TOKEN_TYPES.DEL_RBRACK, ']', 'Expected "]" to close list literal');
    
    return createASTNode(AST_NODE_TYPES.LIST_LIT, {
      token: lbrackToken,
      elements: createASTNode(AST_NODE_TYPES.ARRAY_ELEMENTS, { elements })
    });
  };


  try {
    const ast = parseProgram();
    return {
      ast: errors.length > 0 ? null : ast,
      errors: errors.length > 0 ? errors : undefined,
      success: errors.length === 0
    };
  } catch (error) {
    return {
      ast: null,
      errors: [{ message: error.message, line: 1, column: 1 }],
      success: false
    };
  }
};

/**
 * Validates the AST structure
 * @param {Object} ast - The root node of the AST
 * @returns {boolean} - True if the AST is valid, false otherwise
 */
export const validateAST = (ast) => {
  if (!ast) return false;
  
  // Basic validation - check if we have a program node
  if (ast.type !== AST_NODE_TYPES.ECHO_PROGRAM) {
    return false;
  }
  
  // Could add more comprehensive validation here
  return true;
};

/**
 * Infers the type of an expression node
 * @param {Object} expr - The expression node
 * @returns {string} - The inferred type
 */
const inferExpressionType = (expr) => {
  if (!expr) return 'unknown';
  
  switch (expr.type) {
    case AST_NODE_TYPES.NUMBER_LIT:
      return 'number';
    case AST_NODE_TYPES.DECIMAL_LIT:
      return 'decimal';
    case AST_NODE_TYPES.STRING_LIT:
      return 'string';
    case AST_NODE_TYPES.BOOL_LIT:
    case AST_NODE_TYPES.NULL_LITERAL:
      return 'boolean';
    case AST_NODE_TYPES.LIST_LIT:
      return 'list';
    case AST_NODE_TYPES.IDENTIFIER:
      // For now, assume identifier type is unknown
      // In a full implementation, this would use a symbol table
      return 'unknown';
    case AST_NODE_TYPES.FUNCTION_CALL:
      // For now, assume function calls return unknown
      // In a full implementation, this would look up the function signature
      return 'unknown';
    default:
      // For binary operations, infer based on operands
      if (expr.left && expr.right) {
        const leftType = inferExpressionType(expr.left);
        const rightType = inferExpressionType(expr.right);
        // Simple type promotion rules
        if (leftType === 'decimal' || rightType === 'decimal') return 'decimal';
        if (leftType === 'number' || rightType === 'number') return 'number';
        return leftType || rightType;
      }
      return 'unknown';
  }
};

/**
 * Checks if two types are compatible
 * @param {string} declaredType - The declared type
 * @param {string} actualType - The actual type
 * @returns {boolean} - True if types are compatible
 */
const isTypeCompatible = (declaredType, actualType) => {
  if (declaredType === actualType) return true;
  
  // Allow automatic promotion from number to decimal
  if (declaredType === 'decimal' && actualType === 'number') return true;
  
  // Allow any type to be assigned to unknown (for now)
  if (actualType === 'unknown') return true;
  
  return false;
};

/**
 * Converts AST to a JSON-serializable format for display
 */
export const astToJSON = (ast) => {
  if (!ast) return null;
  
  const nodeToJSON = (node) => {
    if (!node) return null;
    
    const json = {
      type: node.type
    };
    
    // Add token information if available
    if (node.token) {
      json.token = {
        type: node.token.type,
        lexeme: node.token.lexeme,
        line: node.token.line,
        column: node.token.column
      };
    }
    
    // Add common properties
    if (node.name) json.name = node.name;
    if (node.operator) json.operator = node.operator;
    if (node.value !== undefined) json.value = node.value;
    
    // Add children recursively
    if (node.children && node.children.length > 0) {
      json.children = node.children.map(nodeToJSON);
    }
    
    // Handle specific node types
    if (node.statements) {
      json.statements = node.statements.map(nodeToJSON);
    }
    
    if (node.items) {
      json.items = node.items.map(nodeToJSON);
    }
    
    if (node.args) {
      json.args = node.args.map(nodeToJSON);
    }
    
    if (node.elements) {
      json.elements = node.elements.map(nodeToJSON);
    }
    
    if (node.left && node.right) {
      json.left = nodeToJSON(node.left);
      json.right = nodeToJSON(node.right);
    }
    
    if (node.expression) {
      json.expression = nodeToJSON(node.expression);
    }
    
    if (node.condition) {
      json.condition = nodeToJSON(node.condition);
    }
    
    if (node.body) {
      json.body = nodeToJSON(node.body);
    }
    
    if (node.thenBody) {
      json.thenBody = nodeToJSON(node.thenBody);
    }
    
    if (node.elseBody) {
      json.elseBody = nodeToJSON(node.elseBody);
    }
    
    if (node.elseIfs) {
      json.elseIfs = node.elseIfs.map(nodeToJSON);
    }
    
    if (node.cases) {
      json.cases = node.cases.map(nodeToJSON);
    }
    
    if (node.content) {
      json.content = node.content.map(nodeToJSON);
    }
    
    if (node.defaultBlock) {
      json.defaultBlock = nodeToJSON(node.defaultBlock);
    }
    
    if (node.object) {
      json.object = nodeToJSON(node.object);
    }
    
    if (node.field) {
      json.field = nodeToJSON(node.field);
    }
    
    if (node.identifier) {
      json.identifier = nodeToJSON(node.identifier);
    }
    
    return json;
  };
  
  return nodeToJSON(ast);
};
