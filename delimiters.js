const lexicalAnalyzer = (code)=> {
    const tokenList = [];
    let line = 1;
    let i = 0;

    while (i < code.length){
        const char = code[i];

        //Delimiters
        //whitespaces
        if (char === ' '){
            tokenList.push ({ line, type: TOKEN_TYPES.WHITESPACE, lexeme: char });
            i++;
            continue;
        }

        //newline
        if (char === '/n'){
            tokenList.push({ line, type: TOKEN_TYPES.NEWLINE, lexeme: '//n' });
            line++;
            i++;
            continue;
        }

        //comma
        if (char === ','){
            tokenList.push({ line, type: TOKEN_TYPES.COMMA, lexeme: char });
            i++;
            continue;
        }

        //left parenthesis
        if (char === '('){
            tokenList.push({ line, type: TOKEN_TYPES.LPAREN, lexeme: char });
            i++;
            continue;
        }

        //right parenthesis
        if (char === ')'){
            tokenList.push({ line, type: TOKEN_TYPES.RPAREN, lexeme: char });
            i++;
            continue;
        }

        //left bracket
        if (char === '['){
            tokenList.push({ line, type: TOKEN_TYPES.LBRACKET, lexeme: char });
            i++;
            continue;
        }

        //right bracket
        if (char === ']'){
            tokenList.push({ line, type: TOKEN_TYPES.RBRACKET, lexeme: char });
            i++;
            continue;
        }

        //quotation mark
        if (char === '"'){
            tokenList.push({ line, type: TOKEN_TYPES.STRING_LITERAL, lexeme: char });
            i++;
            continue;
        }
    }
}