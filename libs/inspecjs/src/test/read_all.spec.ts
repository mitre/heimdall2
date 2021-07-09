import * as fs from "fs";
import {ConversionResult, convertFile} from '../fileparse';
import {inspecJSFunctions} from './read_all';

test('Correctly reads the contents of the given files', async () => {
  expect.assertions(25);
  await fs.readdir("parse_testbed/", (err, filenames) => {
    filenames.forEach(function (filename) {
      const content = fs.readFileSync("parse_testbed/" + filename, "utf-8");
      const result: ConversionResult = convertFile(content);
      expect(result).toHaveProperty("1_0_ExecJson");
    });
  });
})

test('Instantiates a counts object with all keys set to 0', () => {
  expect(inspecJSFunctions.new_count()).toEqual({
    'From Profile': 0,
    'Not Applicable': 0,
    'Not Reviewed': 0,
    "Profile Error": 0,
    Failed: 0,
    Passed: 0
  });
})

test('Counts all of the statuses in a list of hdf controls', () => {
  expect(inspecJSFunctions.count_hdf([])).toEqual({
    'From Profile': 0,
    'Not Applicable': 0,
    'Not Reviewed': 0,
    'Profile Error': 0,
    Failed: 0,
    Passed: 0
  });
})

test('Trivial overlay filter that takes the version of the control that has results from amongst all indentical ids', () => {
  expect(inspecJSFunctions.filter_overlays([])).toEqual([]);
})

test('Returns proper status counts for sample file in parse_testbed', () => {
  const content = fs.readFileSync('parse_testbed/aws-ami-results.json', "utf-8");
  const result: ConversionResult = convertFile(content);
  if(result["1_0_ExecJson"] !== undefined) {
    expect(inspecJSFunctions.count_exec_1_0(result["1_0_ExecJson"])).toEqual({
      'From Profile': 0,
      'Not Applicable': 0,
      'Not Reviewed': 6,
      'Profile Error': 2,
      Failed: 28,
      Passed: 16    
    })
  }
})

test('Properly formats status counts', () => {
  expect(inspecJSFunctions.format_count({
    'From Profile': 12,
    'Not Applicable': 43,
    'Not Reviewed': 9,
    'Profile Error': 0,
    Failed: 2,
    Passed: 5
  })).toBe(
    `\
      Passed          : 5\n\
      Failed          : 2\n\
      Not Applicable  : 43\n\
      Not Reviewed    : 9\n\
      Profile Error   : 0`
  );
})
