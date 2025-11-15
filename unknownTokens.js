const lexicalAnalyzer = (code) => {
    const tokenList = [];
    let line = 1;
    let i = 0;

    while (i < code.length){
        const char = code [i];

        //unknwon tokens
        tokenList.push({line, type: TOKEN_TYPES.UNKNOWN, lexeme: char });
        i++;
    }
}