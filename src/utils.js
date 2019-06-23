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
  return function(str) {
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
    return altered > 0 ? { errorMessage, filteredValue } : false;
  };
}

export function regexpPatternFilterBuilder(regexp) {
  return function(str) {
    if (regexp.test(str)) {
      return false;
    }
    const regExpCore = regexp.toString().replace(/^\/(.*)\/$/, "$1");
    return { errorMessage: `Does not match pattern (regular expression: "${regExpCore}")` };
  };
}

let urlTextFile = null;

/*
 * returns a 'blob' with 'text' **as a 8-bit stream**
 * will be used as 'href' property for the 'save' link
 * bWindowsLike: boolean which replaces simple LF's with CR+LF's (if not already present)
 */
export function makeUrlTextFile(text, bWindowsLike) {
  const option = { type: "application/octet-stream" },
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
