export const searchOverallJsonMapping = (
  searchTerms: SearchTerm[],
  profileJsons: {[key: string]: any}
) => {
  const returnObj: {[key: string]: {[key: string]: string}} = {};
  Object.values(profileJsons).forEach((obj) => {
    for (const control of obj.controls) {
      if (searchObject(control, searchTerms).length > 0) {
        if (returnObj[obj.name]) {
          Object.assign(returnObj[obj.name], {
            [control.id]: `${obj.github_url}/blob/master/controls/${control.id}.rb`
          });
        } else {
          returnObj[obj.name] = {};
          Object.assign(returnObj[obj.name], {
            [control.id]: `${obj.github_url}/blob/master/controls/${control.id}.rb`
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
  searchTerms: SearchTerm[]
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
          if (complexSearch(value.toString(), searchTerms)) {
            //searchTerms.includes(key)
            results.push({path: newPath, key, value});
          }
        }
      }
    }
  }

  return results;
};

type SearchType = 'AND' | 'OR';

export interface SearchTerm {
  term: string;
  type: SearchType;
}

export const complexSearch = (text: string, terms: SearchTerm[]): boolean => {
  let andPattern = '';
  let orPattern = '';

  for (const term of terms) {
    if (term.type === 'AND') {
      andPattern += `(?=.*${term.term})`;
    } else if (term.type === 'OR') {
      orPattern += (orPattern ? '|' : '') + term.term;
    }
  }

  const andResult = andPattern ? new RegExp(andPattern).test(text) : true;
  const orResult = orPattern ? new RegExp(orPattern).test(text) : false;

  return andResult && orResult;
};
