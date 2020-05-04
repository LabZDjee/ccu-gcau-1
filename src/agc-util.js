/* jshint esversion: 6 */

/*
 * Constructs a reference AGC with provision to modify configuration data, get the merged result as a CR/LF separated string or a an array or strings
 * and an option to reset the altered data back to values as they were at constructor time
 * Methods:
 *  constructor: take an array of lines exactly mirroring contents of the agc file (lines should be stripped from any line separator)
 *  set: take a configuration key (left part of the equal sign) and a value and applies this value associated with this key
 *   value can be a single string or an array of strings
 *   in the second case, as many lines will be written in sequence with the same key
 *  get: take a configuration key and returns the associated value
 *  makeContents(asString): makes the final file for saving. If asString is true, returns a single string, each line being separated by CR/LF
 *   otherwise returns an array of strings without any line separator
 *  resetDynConfig: resets object state back to what it was when constructed
 *  Note: probably not used, as deprecated by NPM package "@labzdjee/agc-util"
 */
export class AgcUtility {
  // lines: an array of strings (without line terminators)
  constructor(lines) {
    this.rawContents = []; // reference contents. don't alter this immutable set of data after contruction!
    const configELementPattern = /^([^#]\S*)\s*=\s*\"(.*)\"\s*$/;
    lines.forEach((line, index) => {
      if (index > 0) {
        const r2 = configELementPattern.exec(line);
        const r1 = configELementPattern.exec(lines[index - 1]);
        // ignore duplicate id's from previous line
        if (r1 === null || r2 === null || r1[1] !== r2[1]) {
          this.rawContents.push(line);
        }
      }
    });
    this.resetDynConfig();
  }
  // get configuration value for id
  get(id) {
    return this.configContents[id].value;
  }
  // sets configuration value for id
  //  value can be a string or an array of strings for multiple line case
  set(id, value) {
    const previousValue = this.configContents[id].value;
    this.configContents[id].value = value;
    return previousValue;
  }
  // rebuilds dynamic contents from scratch
  resetDynConfig() {
    const configBoundaryPattern = /^\$GCAUConfigurationData\s*=\s*\"(.*)\"\s*$/;
    const configELementPattern = /^([^#]\S*)\s*=\s*\"(.*)\"\s*$/;
    this.configContents = {};
    let withinConfig = false;
    for (let i = 0; i < this.rawContents.length; i++) {
      const line = this.rawContents[i];
      let regExResultArray;
      if ((regExResultArray = configBoundaryPattern.exec(line)) !== null) {
        if (regExResultArray[1].toLowerCase() === "start") {
          withinConfig = true;
        } else if (regExResultArray[1].toLowerCase() === "end") {
          withinConfig = false;
        }
      } else {
        if (withinConfig && (regExResultArray = configELementPattern.exec(line)) !== null) {
          this.configContents[regExResultArray[1]] = { value: regExResultArray[2], line: i + 1 };
        }
      }
    }
  }
  // merges reference data with altered data and returns result ready for storage
  // asString: if true returns a string with CR/LF separators, otherwise returns an array
  //  of strings
  makeContents(asString) {
    const dynContentsKeys = Object.keys(this.configContents);
    let result = [];
    if (asString !== false) {
      asString = true;
    }
    for (let i = 0; i < this.rawContents.length; i++) {
      const lineNb = i + 1;
      let hit = null;
      for (let j = 0; j < dynContentsKeys.length; j++) {
        if (this.configContents[dynContentsKeys[j]].line === lineNb) {
          hit = { key: dynContentsKeys[j], value: this.configContents[dynContentsKeys[j]].value };
          break;
        }
      }
      if (hit === null) {
        result.push(this.rawContents[i]);
      } else {
        if (Array.isArray(hit.value)) {
          hit.value.forEach((e) => {
            result.push(`${hit.key} = "${e.toString()}"`);
          });
        } else {
          result.push(`${hit.key} = "${hit.value.toString()}"`);
        }
      }
    }
    return asString ? result.join("\r\n") : result;
  }
}
