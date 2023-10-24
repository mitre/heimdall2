import {githubMapping} from './githubBranchMapping';

export const searchOverallJsonMapping = (
  searchTerm: string,
  profileJsons: {[key: string]: any}
) => {
  const returnObj: {[key: string]: {[key: string]: string}} = {};
  const searchPattern = parseSearchString(searchTerm);
  Object.values(profileJsons).forEach((obj) => {
    for (const control of obj.controls) {
      if (searchObject(control, searchPattern).length > 0) {
        if (returnObj[obj.name]) {
          Object.assign(returnObj[obj.name], {
            [control.id]: `${obj.github_url}/blob/${
              githubMapping[
                obj.github_url.replace('https://github.com/mitre/', '')
              ]
            }/controls/${control.id}.rb`
          });
        } else {
          returnObj[obj.name] = {};
          Object.assign(returnObj[obj.name], {
            [control.id]: `${obj.github_url}/blob/${
              githubMapping[
                obj.github_url.replace('https://github.com/mitre/', '')
              ]
            }/controls/${control.id}.rb`
          });
        }
      }
    }
  });

  return returnObj;
};

interface SearchResult {
  path: string;
  key: string;
  value: any;
}

interface StackItem {
  obj: {[key: string]: any};
  path: string;
}

export const searchObject = (
  obj: {[key: string]: any},
  searchPattern: RegExp
): SearchResult[] => {
  let results: SearchResult[] = [];
  let stack: StackItem[] = [{obj, path: ''}];

  while (stack.length > 0) {
    const {obj, path} = stack.pop() as StackItem;

    // Iterate through the object keys.
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newPath = path ? path + '.' + key : key;

        // If the value is an object, push it onto the stack.
        if (typeof value === 'object' && !Array.isArray(value)) {
          stack.push({obj: value, path: newPath});
        } else {
          // Check if the key or value matches any search term.
          if (searchPattern.test(value.toString())) {
            results.push({path: newPath, key, value});
          }
        }
      }
    }
  }

  return results;
};

const parseSearchString = (searchString: string): RegExp => {
  // Create a helper function to handle OR expressions
  const processOr = (expr: string): string => {
    const orParts = expr.split(/\s*OR\s*/);
    return orParts.map((part) => part.trim()).join('|');
  };

  // Create a helper function to handle AND expressions
  const processAnd = (expr: string): string => {
    const andParts = expr.split(/\s*AND\s*/);
    return andParts.map((part) => `(?=.*(${processOr(part)}))`).join('');
  };

  // Process the input string and generate the regex pattern
  const pattern = processAnd(searchString) + '.*';
  return new RegExp(pattern);
};
