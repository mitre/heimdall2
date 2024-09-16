import fs from 'fs';
import {AnchoreGrypeMapper} from '../../../src/anchore-grype-mapper';
import {omitVersions} from '../../utils';

// describe('anchore-grype_mapper', () => {
//   it('Successfully converts anchore_grype targeted at a local/cloned repository data', () => {
//     const mapper = new AnchoreGrypeMapper(
//       fs.readFileSync(
//         'sample_jsons/anchore_grype_mapper/sample_input_report/anchore_grype.json',
//         {encoding: 'utf-8'}
//       )
//     );

//     fs.writeFileSync(
//       'sample_jsons/anchore_grype_mapper/anchore-grype-hdf.json',
//       JSON.stringify(mapper.toHdf(), null, 2)
//     );

//     expect(omitVersions(mapper.toHdf())).toEqual(
//       omitVersions(
//         JSON.parse(
//           fs.readFileSync(
//             'sample_jsons/anchore_grype_mapper/anchore-grype-hdf.json',
//             {
//               encoding: 'utf-8'
//             }
//           )
//         )
//       )
//     );
//   });
// });

// describe('anchore-grype_mapper_withraw', () => {
//   it('Successfully converts withraw flagged anchore_grype targeted at a local/cloned repository data', () => {
//     const mapper = new AnchoreGrypeMapper(
//       fs.readFileSync(
//         'sample_jsons/anchore_grype_mapper/sample_input_report/anchore_grype.json',
//         {encoding: 'utf-8'}
//       ),
//       true
//     );

//     fs.writeFileSync(
//       'sample_jsons/anchore_grype_mapper/anchore-grype-withraw.json',
//       JSON.stringify(mapper.toHdf(), null, 2)
//     );

//     expect(omitVersions(mapper.toHdf())).toEqual(
//       omitVersions(
//         JSON.parse(
//           fs.readFileSync(
//             'sample_jsons/anchore_grype_mapper/anchore-grype-withraw.json',
//             {
//               encoding: 'utf-8'
//             }
//           )
//         )
//       )
//     );
//   });
// });

// describe('anchore-grype_mapper', () => {
//   it('Successfully converts amazon.json targeted at a local/cloned repository data', () => {
//     const mapper = new AnchoreGrypeMapper(
//       fs.readFileSync(
//         'sample_jsons/anchore_grype_mapper/sample_input_report/amazon.json',
//         {encoding: 'utf-8'}
//       )
//     );

//     fs.writeFileSync(
//       'sample_jsons/anchore_grype_mapper/amazon-grype-hdf.json',
//       JSON.stringify(mapper.toHdf(), null, 2)
//     );

//     expect(omitVersions(mapper.toHdf())).toEqual(
//       omitVersions(
//         JSON.parse(
//           fs.readFileSync(
//             'sample_jsons/anchore_grype_mapper/amazon-grype-hdf.json',
//             {
//               encoding: 'utf-8'
//             }
//           )
//         )
//       )
//     );
//   });
// });

// describe('anchore-grype_mapper_withraw', () => {
//   it('Successfully converts withraw flagged amazon.json targeted at a local/cloned repository data', () => {
//     const mapper = new AnchoreGrypeMapper(
//       fs.readFileSync(
//         'sample_jsons/anchore_grype_mapper/sample_input_report/amazon.json',
//         {encoding: 'utf-8'}
//       ),
//       true
//     );

//     fs.writeFileSync(
//       'sample_jsons/anchore_grype_mapper/amazon-grype-withraw.json',
//       JSON.stringify(mapper.toHdf(), null, 2)
//     );

//     expect(omitVersions(mapper.toHdf())).toEqual(
//       omitVersions(
//         JSON.parse(
//           fs.readFileSync(
//             'sample_jsons/anchore_grype_mapper/amazon-grype-withraw.json',
//             {
//               encoding: 'utf-8'
//             }
//           )
//         )
//       )
//     );
//   });
// });

describe('anchore-grype_mapper', () => {
  it('Successfully converts tensorflow.json targeted at a local/cloned repository data', () => {
    const mapper = new AnchoreGrypeMapper(
      fs.readFileSync(
        'sample_jsons/anchore_grype_mapper/sample_input_report/tensorflow.json',
        {encoding: 'utf-8'}
      )
    );

    fs.writeFileSync(
      'sample_jsons/anchore_grype_mapper/tensorflow-grype-hdf.json',
      JSON.stringify(mapper.toHdf(), null, 2)
    );

    expect(omitVersions(mapper.toHdf())).toEqual(
      omitVersions(
        JSON.parse(
          fs.readFileSync(
            'sample_jsons/anchore_grype_mapper/tensorflow-grype-hdf.json',
            {
              encoding: 'utf-8'
            }
          )
        )
      )
    );
  });
});

// describe('anchore-grype_mapper_withraw', () => {
//   it('Successfully converts withraw flagged tensorflow.json targeted at a local/cloned repository data', () => {
//     const mapper = new AnchoreGrypeMapper(
//       fs.readFileSync(
//         'sample_jsons/anchore_grype_mapper/sample_input_report/tensorflow.json',
//         {encoding: 'utf-8'}
//       ),
//       true
//     );

//     fs.writeFileSync(
//       'sample_jsons/anchore_grype_mapper/tensorflow-grype-withraw.json',
//       JSON.stringify(mapper.toHdf(), null, 2)
//     );

//     expect(omitVersions(mapper.toHdf())).toEqual(
//       omitVersions(
//         JSON.parse(
//           fs.readFileSync(
//             'sample_jsons/anchore_grype_mapper/tensorflow-grype-withraw.json',
//             {
//               encoding: 'utf-8'
//             }
//           )
//         )
//       )
//     );
//   });
// });
