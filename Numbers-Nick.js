// Parse a number (integer or decimal) starting at index i
const parseNumber = (code, startIndex) => {
  let i = startIndex;
  let numberStr = '';
  let hasDot = false;
  let hasExponent = false;

  // Optional sign at the beginning
  if (code[i] === '+' || code[i] === '-') {
    numberStr += code[i];
    i++;
  }

  while (i < code.length) {
    const char = code[i];

    // Digit
    if (/[0-9]/.test(char)) {
      numberStr += char;
      i++;
      continue;
    }

    // Dot for decimal
    if (char === '.' && !hasDot && !hasExponent) {
      hasDot = true;
      numberStr += char;
      i++;
      continue;
    }

    // Exponent e or E
    if ((char === 'e' || char === 'E') && !hasExponent) {
      hasExponent = true;
      numberStr += char;
      i++;

      // Optional sign after exponent
      if (code[i] === '+' || code[i] === '-') {
        numberStr += code[i];
        i++;
      }

      // Must have at least one digit after exponent
      if (!/[0-9]/.test(code[i])) break; // invalid exponent, stop parsing
      continue;
    }

    // If none of the above, stop parsing number
    break;
  }

  // Determine token type
  const type = hasDot || hasExponent ? 'DECIMAL_LITERAL' : 'NUMBER_LITERAL';

  return { lexeme: numberStr, type, newIndex: i };
};
