/**
 * =========================================
 * Code Samples – Test Cases Library
 * =========================================
 */

export const CODE_SAMPLES = {
  STANDARD_ECHO: {
    id: 'standard_echo',
    label: '✓ Standard ECHO (Valid)',
    content: `start
string greeting = "Hello, E.C.H.O!"
echo greeting

number count = 0
for count from 1 to 5
\techo "Loop iteration: @count"
end for

end`
  },

  DELIMITER_MISMATCH: {
    id: 'delimiter_mismatch',
    label: '⚠ Delimiter Mismatch',
    content: `start
string name = "test"
number values = [1, 2, 3}

if (name == "test" then
\techo "Found"
end if

end`
  },

  FORBIDDEN_SEMICOLON: {
    id: 'forbidden_semicolon',
    label: '⚠ Forbidden Semicolon',
    content: `start
string message = "Invalid";
number counter = 0;

echo message;
echo "Done";

end`
  },

  LONG_IDENTIFIER: {
    id: 'long_identifier',
    label: '⚠ Long Identifier (>64 chars)',
    content: `start
string thisIsAnExtremelyLongVariableNameThatExceedsTheSixtyFourCharacterLimit = "Invalid"
echo thisIsAnExtremelyLongVariableNameThatExceedsTheSixtyFourCharacterLimit
end`
  },

  MISSING_THEN: {
    id: 'missing_then',
    label: '⚠ Missing THEN keyword',
    content: `start
number age = 25

if age > 18
\techo "Adult"
end if

if age < 65
\techo "Working age"
end if

end`
  },

  UNCLOSED_BLOCK: {
    id: 'unclosed_block',
    label: '⚠ Unclosed Block',
    content: `start
function greet(name)
\techo "Hello, @name"

number x = 10
while x > 0
\techo "Countdown: @x"
\tx = x - 1

end`
  },

  UNINITIALIZED_VARIABLE: {
    id: 'uninitialized_variable',
    label: '⚠ Uninitialized Variable',
    content: `start
string username
number age
boolean active

echo "Welcome"
end`
  },

  COMPLEX_VALID: {
    id: 'complex_valid',
    label: '✓ Complex Valid Program',
    content: `start
// User management system
string currentUser = "admin"
number loginAttempts = 0
boolean isAuthenticated = false

function validateUser(username, password)
\tif username == "admin" then
\t\tif password == "secret123" then
\t\t\tisAuthenticated = true
\t\t\techo "Login successful"
\t\telse
\t\t\techo "Invalid password"
\t\tend if
\telse
\t\techo "User not found"
\tend if
end function

// Main program loop
for loginAttempts from 1 to 3
\techo "Attempt @loginAttempts of 3"
\tif isAuthenticated == true then
\t\techo "Access granted"
\telse
\t\techo "Access denied"
\tend if
end for

end`
  }
};

export const getSampleById = (id) => {
  return Object.values(CODE_SAMPLES).find(sample => sample.id === id);
};

export const getAllSamples = () => {
  return Object.values(CODE_SAMPLES);
};
