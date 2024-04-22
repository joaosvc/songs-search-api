import { between } from "./between";

interface EscapedObject {
  start: string;
  end: string;
  startPrefix?: RegExp;
}

/**
 * Escape sequences for cutAfterJSON
 * @param {string} start the character string the escape sequence
 * @param {string} end the character string to stop the escape seequence
 * @param {undefined|Regex} startPrefix a regex to check against the preceding 10 characters
 */
const ESCAPING_SEQUENZES = [
  { start: '"', end: '"' },
  { start: "'", end: "'" },
  { start: "`", end: "`" },
  // RegeEx
  { start: "/", end: "/", startPrefix: /(^|[[{:;,/])\s?$/ },
];

const JSON_CLOSING_CHARS = /^[)\]}'\s]+/;

export const parseJSON = <T>(
  source: string,
  variableName: string,
  json: T | string
): T => {
  if (!json || typeof json === "object") {
    return json as T;
  } else {
    try {
      const jsonString = json as string;
      const trimmedJSON = jsonString.replace(JSON_CLOSING_CHARS, "");
      return JSON.parse(trimmedJSON) as T;
    } catch (err: any) {
      throw new Error(
        `Error parsing ${variableName} in ${source}: ${err.message}`
      );
    }
  }
};

export const findJSON = <T>(
  source: string,
  varName: string,
  body: string,
  left: string | RegExp,
  right: string,
  prependJSON: string
): T => {
  const jsonStr = between(body, left, right);

  if (!jsonStr) {
    throw new Error(`Could not find ${varName} in ${source}`);
  }
  return parseJSON<T>(
    source,
    varName,
    cutAfterJSON(`${prependJSON}${jsonStr}`)
  );
};

export const cutAfterJSON = (mixedJson: string): string => {
  // Define the general open and closing tag
  let open: string | undefined, close: string | undefined;

  if (mixedJson[0] === "[") {
    open = "[";
    close = "]";
  } else if (mixedJson[0] === "{") {
    open = "{";
    close = "}";
  }

  if (!open) {
    throw new Error(
      `Can't cut unsupported JSON (need to begin with [ or { ) but got: ${mixedJson[0]}`
    );
  }

  // States if the loop is currently inside an escaped js object
  let isEscapedObject: EscapedObject | null = null;

  // States if the current character is treated as escaped or not
  let isEscaped = false;

  // Current open brackets to be closed
  let counter = 0;

  let i;
  // Go through all characters from the start
  for (i = 0; i < mixedJson.length; i++) {
    // End of current escaped object
    if (
      !isEscaped &&
      isEscapedObject !== null &&
      mixedJson[i] === isEscapedObject.end
    ) {
      isEscapedObject = null;
      continue;
      // Might be the start of a new escaped object
    } else if (!isEscaped && isEscapedObject === null) {
      for (const escaped of ESCAPING_SEQUENZES) {
        if (mixedJson[i] !== escaped.start) continue;
        // Test startPrefix against last 10 characters
        if (
          !escaped.startPrefix ||
          mixedJson.substring(i - 10, i).match(escaped.startPrefix)
        ) {
          isEscapedObject = escaped;
          break;
        }
      }
      // Continue if we found a new escaped object
      if (isEscapedObject !== null) {
        continue;
      }
    }

    // Toggle the isEscaped boolean for every backslash
    // Reset for every regular character
    isEscaped = mixedJson[i] === "\\" && !isEscaped;

    if (isEscapedObject !== null) continue;

    if (mixedJson[i] === open) {
      counter++;
    } else if (mixedJson[i] === close) {
      counter--;
    }

    // All brackets have been closed, thus end of JSON is reached
    if (counter === 0) {
      // Return the cut JSON
      return mixedJson.substring(0, i + 1);
    }
  }

  // We ran through the whole string and ended up with an unclosed bracket
  throw new Error(
    "Can't cut unsupported JSON (no matching closing bracket found)"
  );
};
