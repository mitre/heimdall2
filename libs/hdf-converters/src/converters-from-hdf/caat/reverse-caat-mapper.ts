import * as XLSX from '@e965/xlsx';
import {
  CanonizationConfig,
  ContextualizedControl,
  ContextualizedEvaluation,
  convertFileContextual,
  ExecJSON,
  HDFControl,
  isContextualizedEvaluation
} from 'inspecjs';
import * as _ from 'lodash';
import {ensureContextualizedEvaluation} from '../../utils/global';

export type InputData = {
  data: string | ExecJSON.Execution | ContextualizedEvaluation;
  filename?: string;
  controls?: ContextualizedControl[];
};

type Data = InputData & {data: ContextualizedEvaluation; filename: string};

export const CAATHeaders = [
  'Control Number',
  'Finding Title',
  'Date Identified',
  'Finding ID',
  'Information System or Program Name',
  'Repeat Findings',
  'Repeat Finding Weakness ID',
  'Finding Description',
  'Weakness Description',
  'Control Weakness Type',
  'Source',
  'Assessment/Audit Company',
  'Test Method',
  'Test Objective',
  'Test Result Description',
  'Test Result',
  'Recommended Corrective Action(s)',
  'Effect on Business',
  'Likelihood',
  'Impact'
] as const;

export type CAATRow = Partial<
  Record<(typeof CAATHeaders)[number], string | undefined>
>;

export class FromHDFToCAATMapper {
  static readonly MaxCellSize = 32000;
  static readonly MaxSheetNameLength = 31;

  static readonly NistCanonizationConfig: CanonizationConfig = {
    max_specifiers: 3,
    pad_zeros: true,
    allow_letters: false,
    add_spaces: false
  };

  static readonly FileSettings: XLSX.Properties = {
    Title: 'Compliance Assessment/Audit Tracking (CAAT) Spreadsheet',
    Subject: 'Assessment Data',
    Author: 'MITRE SAF',
    CreatedDate: new Date()
  };

  static readonly SheetOptions: XLSX.JSON2SheetOpts = {
    header: CAATHeaders.slice() // CAATHeaders is immutable but the type expects a mutable string
  };

  static formatDate(date: Date, delimiter: string): string {
    return [
      Intl.DateTimeFormat('en-US', {month: '2-digit'}),
      Intl.DateTimeFormat('en-US', {day: '2-digit'}),
      Intl.DateTimeFormat('en-US', {year: 'numeric'})
    ]
      .map((formatter) => formatter.format(date))
      .join(delimiter);
  }

  // ensure we're using Windows style newlines and fit within the maximum length
  static fix(str?: string | null): string {
    return (str ?? '')
      .replace(/(\r\n|\n|\r)/gmu, '\r\n')
      .slice(0, FromHDFToCAATMapper.MaxCellSize);
  }

  data: Data[];

  // ensure input is turned into an array of contextualized evaluations with some additional metadata
  constructor(data: InputData | InputData[]) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    this.data = data.map((datum) => {
      let contextualizedEvaluation = datum.data;
      if (_.isString(contextualizedEvaluation)) {
        const contextualizedFile = convertFileContextual(
          contextualizedEvaluation
        );
        if (!isContextualizedEvaluation(contextualizedFile)) {
          throw new Error('Input string was not an HDF ExecJSON');
        }
        contextualizedEvaluation = contextualizedFile;
      }
      contextualizedEvaluation = ensureContextualizedEvaluation(
        contextualizedEvaluation
      );
      return {
        data: contextualizedEvaluation,
        filename:
          datum.filename ?? // if provided a filename use it
          contextualizedEvaluation.data.profiles.at(0)?.name ?? // otherwise use the name of the first profile which is typically the only profile or the wrapper or overlay profile if there are multiple
          'ExecJSON', // otherwise set the default
        controls: datum.controls
      };
    });
  }

  newCaveat(hdf: HDFControl): string {
    const caveat = hdf.descriptions.caveat
      ? `(Caveat: ${FromHDFToCAATMapper.fix(hdf.descriptions.caveat)})\r\n`
      : '';
    return `${caveat}${FromHDFToCAATMapper.fix(hdf.wraps.desc)}`;
  }

  newTestResultDescription(hdf: HDFControl): string {
    const controlStatus = `${hdf.status}:\r\n\r\n`;
    const description =
      hdf.segments
        ?.map((result) => {
          const statusAndTest = `${result.status.toUpperCase()} -- Test: ${
            result.code_desc
          }\r\n`;
          const message = result.message
            ? `Message: ${result.message}\r\n\r\n`
            : '\r\n';
          return `${statusAndTest}${message}`;
        })
        .join('') ?? '';
    return `${controlStatus}${description}`;
  }

  newTestResult(hdf: HDFControl): string {
    return hdf.status === 'Passed' ? 'Satisfied' : 'Other Than Satisfied';
  }

  newImpact(hdf: HDFControl): string {
    const controlSeverity =
      hdf.severity === 'medium' ? 'moderate' : hdf.severity;
    return FromHDFToCAATMapper.fix(
      hdf.wraps.impact === 0 ? 'none' : controlSeverity
    );
  }

  getRow(control: ContextualizedControl, filename: string): CAATRow[] {
    const hdf = control.hdf;
    const allRows: CAATRow[] = _.compact(
      hdf
        .canonized_nist(FromHDFToCAATMapper.NistCanonizationConfig)
        .map((formattedNistTag) => {
          // I have not found a sample that triggers this case because the canonized_nist function seems to only return a nist tag
          if (!formattedNistTag) {
            // early exiting forces us to use the compact function to get rid of empty values in the array
            return;
          }

          const row: CAATRow = {};
          row['Control Number'] = formattedNistTag;
          row['Finding Title'] = `Test ${FromHDFToCAATMapper.fix(
            hdf.wraps.id
          )} - ${FromHDFToCAATMapper.fix(hdf.wraps.title)}`;
          if (hdf.start_time) {
            row['Date Identified'] = FromHDFToCAATMapper.formatDate(
              new Date(hdf.start_time),
              '/'
            );
          }
          row['Finding ID'] = `${filename} - Test ${FromHDFToCAATMapper.fix(
            hdf.wraps.id
          )}`;
          row['Finding Description'] = FromHDFToCAATMapper.fix(hdf.wraps.title);
          row['Weakness Description'] = this.newCaveat(hdf);
          row['Control Weakness Type'] = 'Security';
          row['Source'] = 'Self-Assessment';
          row['Test Method'] = 'Test';
          row['Test Objective'] = FromHDFToCAATMapper.fix(
            hdf.descriptions.check ?? hdf.wraps.tags.check
          );
          row['Test Result Description'] = FromHDFToCAATMapper.fix(
            this.newTestResultDescription(hdf)
          );
          row['Test Result'] = this.newTestResult(hdf);
          row['Recommended Corrective Action(s)'] = FromHDFToCAATMapper.fix(
            hdf.descriptions.fix ?? hdf.wraps.tags.fix
          );
          row['Impact'] = this.newImpact(hdf);
          return row;
        })
    );
    return allRows;
  }

  // returnWorkBook: true -> raw workbook class
  // returnWorkBook: false | undefined -> binary string by default otherwise whatever is specified in the options parameter
  toCAAT(
    returnWorkBook = false,
    options: XLSX.WritingOptions = {bookType: 'xlsx', type: 'binary'}
  ) {
    // Sheet names must be unique across the workbook
    const takenSheetNames: string[] = [];

    // Define our workbook
    const workBook = XLSX.utils.book_new();

    // For each contextualized evaluation
    for (const d of this.data) {
      // Ensure sheet name uniqueness
      let renameCount = 2;
      const fullName = `${
        d.filename ?? d.data.data.profiles.at(0)?.name ?? 'ExecJSON'
      }`;
      let sheetName: string = fullName.substring(
        0,
        FromHDFToCAATMapper.MaxSheetNameLength
      );
      while (takenSheetNames.includes(sheetName)) {
        sheetName =
          fullName.substring(0, FromHDFToCAATMapper.MaxSheetNameLength - 5) +
          ` (${renameCount})`; // space for up to a 2 digit number; there's no check to stop it going past other than the workbook failing to be created, but that should be fine since the likelihood of someone having that many dupes is very slim
        renameCount++;
      }
      takenSheetNames.push(sheetName);

      // Create a new Sheet
      workBook.SheetNames.push(sheetName);
      workBook.Props = FromHDFToCAATMapper.FileSettings;

      // Get the controls for the current evaluation
      const processedControls = new Set();
      const rows: CAATRow[] = [];
      // Convert them into rows
      for (const control of d.controls ??
        d.data.contains.flatMap((profile) => profile.contains)) {
        const root = control.root;

        // Overlay profiles will usually share controls
        if (processedControls.has(root.hdf.wraps.id)) {
          continue;
        }

        processedControls.add(root.hdf.wraps.id);
        rows.push(...this.getRow(root, d.filename));
      }

      rows.sort(
        (x, y) =>
          x['Finding Title']?.localeCompare(y['Finding Title'] ?? '') ?? 1
      );

      // Add rows to sheet
      const workSheet = XLSX.utils.json_to_sheet(
        rows,
        FromHDFToCAATMapper.SheetOptions
      );
      workBook.Sheets[sheetName] = workSheet;
    }

    if (returnWorkBook) {
      return workBook;
    }
    return XLSX.write(workBook, options);
  }
}
