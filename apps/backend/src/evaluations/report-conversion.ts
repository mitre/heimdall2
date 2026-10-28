/* eslint-disable unicorn/filename-case -- Match existing evaluation module filenames. */
import {
  AnchoreGrypeMapper,
  ASFFResults as ASFFResultsMapper,
  BurpSuiteResults,
  ChecklistResults,
  CheckovMapper,
  ConveyorResults as ConveyorResultsMapper,
  CycloneDXSBOMResults,
  DBProtectMapper,
  DependencyTrackMapper,
  fingerprint,
  FortifyResults,
  GosecMapper,
  HadolintMapper,
  INPUT_TYPES,
  IonChannelMapper,
  JfrogXrayMapper,
  MsftSecureScoreResults,
  NessusResults,
  NetsparkerResults,
  NeuVectorMapper,
  NiktoMapper,
  PrismaMapper,
  SarifMapper,
  ScoutsuiteMapper,
  SnykResults,
  TrufflehogResults,
  TwistlockResults,
  VeracodeMapper,
  XCCDFResultsResults,
  ZapResults,
} from '@mitre/hdf-converters';
import { BadRequestException } from '@nestjs/common';
import { convertFile } from 'inspecjs';

// A single source report can produce several HDF evaluations.
export async function convertReport(
  data: string,
  filename: string,
): Promise<Record<string, unknown>[]> {
  try {
    const hdf = parseHdf(data);
    if (hdf) {
      return [hdf];
    }
    const converted = await convertToHdf(data, filename);
    const evaluations = Array.isArray(converted) ? converted : [converted];
    if (evaluations.length === 0) {
      throw new Error('Conversion produced no evaluations.');
    }
    return evaluations.map((evaluation) => {
      const validated = parseHdf(JSON.stringify(evaluation));
      if (!validated) {
        throw new Error('Conversion did not produce valid HDF.');
      }
      return validated;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Conversion failed.';
    throw new BadRequestException(`Unable to convert "${filename}" to HDF: ${message}`);
  }
}

async function convertToHdf(data: string, filename: string) {
  const typeGuess = fingerprint({ data, filename });
  switch (typeGuess) {
    case INPUT_TYPES.ASFF: {
      return Object.values(
        new ASFFResultsMapper(data).toHdf(),
      );
    }
    case INPUT_TYPES.BURP: {
      return new BurpSuiteResults(data).toHdf();
    }
    case INPUT_TYPES.CHECKLIST: {
      return new ChecklistResults(data).toHdf();
    }
    case INPUT_TYPES.CHECKOV: {
      return new CheckovMapper(data).toHdf();
    }
    case INPUT_TYPES.CONVEYOR: {
      return Object.values(
        new ConveyorResultsMapper(data).toHdf(),
      );
    }
    case INPUT_TYPES.CYCLONEDX_SBOM: {
      return new CycloneDXSBOMResults(data).toHdf();
    }
    case INPUT_TYPES.DB_PROTECT: {
      return new DBProtectMapper(data).toHdf();
    }
    case INPUT_TYPES.DEPENDENCY_TRACK: {
      return new DependencyTrackMapper(data).toHdf();
    }
    case INPUT_TYPES.FORTIFY: {
      return new FortifyResults(data).toHdf();
    }
    case INPUT_TYPES.GOSEC: {
      return new GosecMapper(data).toHdf();
    }
    case INPUT_TYPES.GRYPE: {
      return new AnchoreGrypeMapper(data).toHdf();
    }
    case INPUT_TYPES.HADOLINT: {
      return new HadolintMapper(data).toHdf();
    }
    case INPUT_TYPES.IONCHANNEL: {
      return new IonChannelMapper(data).toHdf();
    }
    case INPUT_TYPES.JFROG: {
      return new JfrogXrayMapper(data).toHdf();
    }
    case INPUT_TYPES.MSFT_SEC_SCORE: {
      return new MsftSecureScoreResults(data).toHdf();
    }
    case INPUT_TYPES.NESSUS: {
      return new NessusResults(data).toHdf();
    }
    case INPUT_TYPES.NETSPARKER: {
      return new NetsparkerResults(data).toHdf();
    }
    case INPUT_TYPES.NEUVECTOR: {
      return new NeuVectorMapper(data).toHdf();
    }
    case INPUT_TYPES.NIKTO: {
      return new NiktoMapper(data).toHdf();
    }
    case INPUT_TYPES.PRISMA: {
      return new PrismaMapper(data).toHdf();
    }
    case INPUT_TYPES.SARIF: {
      return new SarifMapper(data).toHdf();
    }
    case INPUT_TYPES.SCOUTSUITE: {
      return new ScoutsuiteMapper(data).toHdf();
    }
    case INPUT_TYPES.SNYK: {
      return new SnykResults(data).toHdf();
    }
    case INPUT_TYPES.TRUFFLEHOG: {
      return new TrufflehogResults(data).toHdf();
    }
    case INPUT_TYPES.TWISTLOCK: {
      return new TwistlockResults(data).toHdf();
    }
    case INPUT_TYPES.VERACODE: {
      return new VeracodeMapper(data).toHdf();
    }
    case INPUT_TYPES.XCCDF: {
      return new XCCDFResultsResults(data).toHdf();
    }
    case INPUT_TYPES.ZAP: {
      return new ZapResults(data).toHdf();
    }
    default: {
      throw new Error('Unsupported file format: no fingerprints matched.');
    }
  }
}

// Validate with the same schemas as frontend intake, preserving extra fields.
function parseHdf(text: string): Record<string, unknown> | undefined {
  const result = convertFile(text, true);
  if (result['1_0_ExecJson'] || result['1_0_ProfileJson']) {
    return JSON.parse(text);
  }
  return undefined;
}
/* eslint-enable unicorn/filename-case */
