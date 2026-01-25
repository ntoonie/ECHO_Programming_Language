/**
 * Code Samples Library
 * 
 * Provides test cases for the ECHO language syntax analyzer.
 * Contains valid examples and error cases aligned with formal grammar.
 * Dependencies: None (pure data export)
 */

export const CODE_SAMPLES = {
  // Valid examples

  VALID_MINIMAL: {
    id: 'valid_minimal',
    label: '✓ 1. Minimal (Valid)',
    content: `start
echo "Hello, ECHO!"
end`
  },

  VALID_BASIC: {
    id: 'valid_basic',
    label: '✓ 2. Declarations & SIS (Valid)',
    content: `start
string name = "ECHO"
number x = 42
decimal pi = 3.14
boolean ok = true
list arr = [1, 2, 3]
echo "Name: @name, x=@x, pi=@pi"
end`
  },

  VALID_CONTROL_FLOW: {
    id: 'valid_control_flow',
    label: '✓ 3. If/Else & For (Valid)',
    content: `start
number n = 10
if n > 5
\techo "n is greater than 5"
else
\techo "n is 5 or less"
end if

for n = 1 to 3
\techo "Count: @n"
end for
end`
  },

  VALID_LOOPS_SWITCH: {
    id: 'valid_loops_switch',
    label: '✓ 4. Switch, While, Do-While (Valid)',
    content: `start
number choice = 2
switch choice
case 1
\techo "One"
case 2
\techo "Two"
default
\techo "Other"
end switch

number i = 0
while i < 2
\techo "@i"
\ti = i + 1
end while

number j = 0
do
\techo "j=@j"
\tj = j + 1
while j < 2
end do
end`
  },

  VALID_FULL: {
    id: 'valid_full',
    label: '✓ 5. Function, Nested If, For-By (Valid)',
    content: `start
function number add(number a, number b)
\tnumber sum = a + b
\treturn sum
end function

number x = 10
number y = 20
number total = add(x, y)
echo "Sum: @total"

if total > 25
\tif total < 50
\t\techo "Between 25 and 50"
\telse
\t\techo "50 or more"
\tend if
else
\techo "25 or less"
end if

number k
for k = 0 to 10 by 2
\techo "Step: @k"
end for
end`
  },

  VALID_COMPREHENSIVE: {
    id: 'valid_comprehensive',
    label: '✓ 6. Comprehensive All Features (Valid)',
    content: `start
    function number calculatePower(number base, number exponent)
        number result = base ^ exponent
        return result
    end function

    function printStatus(string msg)
        echo "Status update: @msg"
    end function

    data struct Point {
        number x = 0
        number y = 0
    }

    number userVal = 0
    decimal pi = 3.14159
    string greeting = "Welcome"
    boolean isRunning = true
    list Fibonacci = [1, 1, 2, 3, 5, 8]

    echo "Initial List value: "
    echo Fibonacci[4]

    userVal = input(number, "Enter a base number: ")
    
    number calc = calculatePower(userVal, 2)
    echo "Squared value is: @calc"

    if calc > 100
        echo "Value is large"
    else if calc > 50
        echo "Value is medium"
    else
        echo "Value is small"
    end if

    switch userVal
        case 0
            echo "Zero entered"
        case 1
            echo "One entered"
        default
            echo "Other number entered"
    end switch

    for i = 1 to 10 by 2
        calc += i
    end for

    while isRunning
        calc--
        if calc < 0
            isRunning = false
        end if
    end while

    do
        calc += 5
    while calc < 20
    end do

    number complexMath = (100 // 3) * 2
    complexMath %= 4
    
    printStatus(greeting)
end`
  },

  // Error examples

  ERROR_MISSING_START: {
    id: 'error_missing_start',
    label: '⚠ 1. Missing START (Structural)',
    content: `string msg = "No start keyword"
echo @msg
end`
  },

  ERROR_DELIMITER_MISMATCH: {
    id: 'error_delimiter_mismatch',
    label: '⚠ 2. Delimiter Mismatch (Syntax)',
    content: `start
list a = [1, 2, 3)
echo "List: @a"
end`
  },

  ERROR_SEMICOLON: {
    id: 'error_semicolon',
    label: '⚠ 3. Forbidden Semicolon (Syntax)',
    content: `start
string s = "test";
echo "Value: @s"
end`
  },

  ERROR_UNCLOSED_BLOCK: {
    id: 'error_unclosed_block',
    label: '⚠ 4. Unclosed Block (Grammar)',
    content: `start
number n = 5
if n > 0
\techo "positive"
end
end`
  },

  ERROR_LONG_IDENTIFIER: {
    id: 'error_long_identifier',
    label: '⚠ 5. Long Identifier >64 chars (Semantic)',
    content: `start
string thisVariableNameExceedsTheMaximumAllowedLengthOfSixtyFourCharacters = "x"
echo "ok"
end`
  }
};

/**
 * Get sample by ID
 * 
 * Finds a code sample by its unique identifier.
 * 
 * @param {String} id - The unique identifier of the sample
 * @returns {Object|undefined} The sample object or undefined if not found
 */
export const getSampleById = (id) => {
  return Object.values(CODE_SAMPLES).find((sample) => sample.id === id);
};

/**
 * Get all samples
 * 
 * Returns all available code samples as an array.
 * 
 * @returns {Array} Array of all sample objects
 */
export const getAllSamples = () => {
  return Object.values(CODE_SAMPLES);
};
