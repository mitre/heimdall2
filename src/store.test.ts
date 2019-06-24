import { HeimdallState } from "../src/store";
import * as fs from 'fs';

it ('Should parse JSON examples for flat profiles', () => {
    let json = fs.readFileSync("tst/examples/profile/profile.json","utf-8");
    let state = new HeimdallState;
    state.parseFile(json, "profile.json");
    expect(state.getStatus()).toEqual([
        ['Passed',         17],
        ['Failed',         28],
        ['Not Applicable', 2],
        ['Not Reviewed',   8],
        ['Profile Error',  0]
      ]);;
  });