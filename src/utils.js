/* jshint esversion: 6 */

/*
 * Filter prototype:
 *  takes a string to filter and returns
 *   false if string conforms to filter requirement
 *   an object with 'errorMessage' as a string and possibly
 *   a 'filetredValue' as a string if it makes sense
 */

// examples for range:
//  [A-Fa-f0-9]
//  [A-Za-z0-9 _+\-$*:]
export function rangeFilterBuilder(range) {
  return function (str) {
    const rangeRegExp = new RegExp(range);
    const escapedRange = range.replace(/\\-/, "-");
    let chars = str.split("");
    let altered = 0;
    for (let i = 0; i < chars.length; i++) {
      if (!rangeRegExp.test(chars[i])) {
        chars[i] = "";
        altered++;
      }
    }
    const errorMessage = `Illegal character${altered > 1 ? "s" : ""} (not in ${escapedRange})`;
    const filteredValue = chars.join("");
    return altered > 0 ? {
      errorMessage,
      filteredValue,
    } : false;
  };
}

export function regexpPatternFilterBuilder(regexp) {
  return function (str) {
    if (regexp.test(str)) {
      return false;
    }
    const regExpCore = regexp.toString().replace(/^\/(.*)\/$/, "$1");
    return {
      errorMessage: `Does not match pattern (regular expression: "${regExpCore}")`,
    };
  };
}

let urlTextFile = null;

/*
 * returns a 'blob' with 'text' **as a 8-bit stream**
 * will be used as 'href' property for the 'save' link
 * bWindowsLike: boolean which replaces simple LF's with CR+LF's (if not already present)
 */
export function makeUrlTextFile(text, bWindowsLike) {
  const option = {
      type: "application/octet-stream",
    },
    contents = bWindowsLike ? text.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n") : text,
    contentsLength = contents.length,
    genericBuffer = new ArrayBuffer(contentsLength),
    bufferContents = new Uint8Array(genericBuffer);
  for (let i = 0; i < contentsLength; i++) {
    const code = contents.charCodeAt(i) & 255;
    bufferContents[i] = code;
  }
  const data = new Blob([genericBuffer], option);
  // If we are replacing a previously generated file we need to
  // manually revoke the object URL to avoid memory leaks.
  if (urlTextFile !== null) {
    window.URL.revokeObjectURL(urlTextFile);
  }
  urlTextFile = window.URL.createObjectURL(data);
  return urlTextFile;
}

/*
  Removes first occurence of element 'elt' from array 'arr'
  Returns true if found (and removed), false if not found
 */
export function removeEltInArray(elt, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === elt) {
      arr.splice(i, 1);
      return true;
    }
  }
  return false;
}

// turns Number 'n' into a string with at most 'd' decimals
// examples:
//  scrapDecimalsAsString(Math.PI, 4) => "3.1426"
//  scrapDecimalsAsString(123, 3) => "123"
//  scrapDecimalsAsString(123.0004, 3) => "123"
export function scrapDecimalsAsString(n, d) {
  const factor = Math.pow(10, d);
  return (Math.round(factor * n) / factor).toString();
}

// turns Number 'n' into a string with at most 'd' decimals and trailing zeroes
// examples:
//  scrapDecimalsAsStringZPad(Math.PI, 4) => "3.1426"
//  scrapDecimalsAsStringZPad(123, 2) => "123.00"
//  scrapDecimalsAsStringZPad(-123.4, 2) => "-123.40"
//  scrapDecimalsAsStringZPad(123.0004, 3) => "123.000"
export function scrapDecimalsAsStringZPad(n, d) {
  let result = scrapDecimalsAsString(n, d);
  const indexOfDecimalPoint = result.indexOf(".");
  if (indexOfDecimalPoint < 0) {
    return `${result}.${"".padEnd(d, "0")}`;
  } else {
    return result.padEnd(d + indexOfDecimalPoint + 1, "0");
  }
}

// takes a float value (parameter 'floatValueOrString', a number or a string representing a number)
// and returns an integer rounding this float value as a string
// optional parameter 'coeffOrLambda':
//  if a number, multiplies the input by this number to give the result
//  if a string, does the same extracting the multiply value from this string
//  if a lambda function, applies this function to the input to provide the result
// examples:
//  toIntAsStr("3.14159", 10000) => "31416"
//  toIntAsStr("3", (x=>100*Math.cos(x))) => "-99"
//  toIntAsStr(-5.6) => "-6"
export function toIntAsStr(floatValueOrString, coeffOrLambda) {
  let floatValue = typeof floatValueOrString === "string" ? parseFloat(floatValueOrString) : floatValueOrString;
  switch (typeof coeffOrLambda) {
    case "number":
      floatValue *= coeffOrLambda;
      break;
    case "string":
      floatValue *= parseFloat(coeffOrLambda);
      break;
    case "function":
      floatValue = coeffOrLambda(floatValue);
      break;
  }
  return Math.round(floatValue).toString();
}

// generates an array with 'length' elements
// each element being created by lambda(i) with i: 0... length-1
// if lambda is not a function, the identity function will be used instead
// examples:
//  generateNumericArray(3) => [ 0, 1, 2 ]
//  generateNumericArray(3, x => `TEMP_${x+1}`) => [ "TEMP_1", "TEMP_2", "TEMP_3" ]
export function generateNumericArray(length, lambda) {
  if (typeof lambda !== "function") {
    lambda = (x => x);
  }
  return [...Array(length)].map((_, i) => lambda(i));
}

// sets/resets bit in hexadecimal string
//  hexString: supposed to be composed of only 0 to F characters (lower case excluded)
//  pos: is a zero-based offset to bit 0 of the binary value
//   pos should be in the [0, (hexString.length*4)-1] range
//  bool: sets bit if true, resets bit otherwise
// in case of exception, this function returns null
// examples:
//  setBitInHexString(true, 15, "2C18") => AC18
//  setBitInHexString(false, 3, "2C18") => "2C10"
//  setBitInHexString(1, 9*4+3, "000174FF17FF") => "008174FF17FF"
export function setBitInHexString(bool, pos, hexString) {
  if (typeof pos !== "number" ||
    typeof hexString !== "string" ||
    /^[0-9A-F]+$/.test(hexString) === false) {
    return null;
  }
  const index = hexString.length - Math.floor(pos / 4) - 1;
  if (index < 0 || index >= hexString.length) {
    return null;
  }
  const mask = 1 << (pos % 4);
  let val = parseInt(hexString.substring(index, index + 1), 16) & ~mask;
  if (bool) {
    val |= mask;
  }
  return `${hexString.substring(0, index)}${val.toString(16).toUpperCase()}${hexString.substring(index+1)}`;
}

// insert an integer (if a float is it rounded) into an array of integers
// array is sorted (asscending) from minimum to maximum, duplicates are not inserted
export function insertIntInSortedArray(val, array) {
  val = Math.round(val);
  if (array.indexOf(val) === -1) {
    array.push(val);
    array.sort((x, y) => parseInt(x, 10) - parseInt(y, 10));
  }
}

// take an array of sorted (ascending) integers
// and return a condensed list of those with '~' as the interval marker and ';' as the separator
// examples:
//  on [1,3,5,6,7, 8,9,10,13], returns "1;3;5~10;13"
//  on [1,2, 3,5,6,7, 8,9,10], returns "1~3;5~10"
export function extractListFromSortedArrayOfInts(array) {
  let result = "";
  let inInterval = false;
  let lastVal;
  for (let i = 0; i < array.length; i++) {
    if (i === 0) {
      result = array[i].toString();
    } else {
      if (array[i] === lastVal + 1) {
        if (inInterval === false) {
          result += "~";
          inInterval = true;
        }
        if (i === array.length - 1) {
          result += array[i].toString();
        }
      } else {
        if (inInterval) {
          result += `${lastVal};${array[i]}`;
          inInterval = false;
        } else {
          result += `;${array[i]}`;
        }
      }
    }
    lastVal = array[i];
  }
  return result;
}

// finds where the 4 bytes of a float32 are stored in as ArrayBuffer when viewed as a Float32Array
// returns an array with four offsets [0, 3]
//  first element of array gives the offset to the LSB
//  second element of array gives the offset of byte next to LSB
//  third element of array gives the offset of byte next to MSB
//  fourth element of array gives te offset of the MSB
// So, a little endian machine will return [0, 1, 2, 3]
// and a big endian machine will return [3, 2, 1, 0]
export function evaluateFloat32Endianess() {
  const arrayBuffer = new ArrayBuffer(4);
  const flt32Array = new Float32Array(arrayBuffer);
  flt32Array[0] = 1024.25; // 0x44800800
  const byteArray = new Uint8Array(arrayBuffer);
  const map = {
    0x44: 3,
    0x80: 2,
    0x08: 1,
    0x00: 0,
  };
  const result = new Array(4);
  for (let i = 0; i < 4; i++) {
    result[i] = map[byteArray[i]];
  }
  return result;
}

export const float32Endianess = evaluateFloat32Endianess();

// returns true onsly if value sits between min and max
export function isBetween(min, value, max) {
  return value >= Math.min(min, max) && value <= Math.max(min, max);
}
