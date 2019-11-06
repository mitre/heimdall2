import chai from "chai";
import chai_as_promised from "chai-as-promised";
chai.use(chai_as_promised);
const expect = chai.expect;

import Store from "../../src/store/store";
import ReportIntakeModule from "../../src/store/report_intake";
import DataStore from "../../src/store/data_store";
import { getModule } from "vuex-module-decorators";
import { AllRaw } from "../util/fs";
import FilteredDataModule from "@/store/data_filters";
import StatusCountModule, { StatusHash } from "@/store/status_counts";
import { readFileSync } from "fs";
// import { shallowMount } from "@vue/test-utils";

describe("Parsing", () => {
  it("Report intake can read every raw file in hdf_data", function() {
    // Give it time!
    this.timeout(0);
    let raw = AllRaw();
    let intake = getModule(ReportIntakeModule, Store);
    let id = 0;

    let promises = Object.values(raw).map(file_result => {
      // Increment counter
      id += 1;

      // Do intake
      return intake.loadText({
        filename: file_result.name,
        unique_id: id,
        text: file_result.content
      });
    });

    // Done!
    return Promise.all(promises.map(p => expect(p).to.eventually.be.null));
  });

  // Note that the above side effect has LOADED THESE FILES! WE CAN USE THEM IN OTHER TESTS

  it("Counts statuses correctly", function() {
    // Grab modules
    let data = getModule(DataStore, Store);
    let filter = getModule(FilteredDataModule, Store);
    let status_count = getModule(StatusCountModule, Store);

    // Get the exec files
    let exec_files = data.executionFiles;

    // For each, we will filter then count
    exec_files.forEach(file => {
      // Get the corresponding count file
      let count_filename = `tests/hdf_data/counts/${file.filename}.info.counts`;
      let count_file_content = readFileSync(count_filename, "utf-8");
      let counts: any = JSON.parse(count_file_content);

      // Get the expected counts
      let expected: StatusHash = {
        Failed: counts.failed.total,
        Passed: counts.passed.total,
        "From Profile": 0,
        "Profile Error": counts.error.total,
        "Not Reviewed": counts.skipped.total,
        "Not Applicable": counts.no_impact.total
      };

      let expected_with_filename = {
        filename: file.filename,
        ...expected
      };

      // Get the actual
      let actual = status_count.hash({
        omit_overlayed_controls: true,
        fromFile: file.unique_id
      });

      let actual_with_filename = {
        filename: file.filename,
        ...actual
      };

      // Compare 'em
      expect(actual_with_filename).to.eql(expected_with_filename);
    });
  });
});
