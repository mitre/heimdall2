import Vuetify, { colors } from 'vuetify/lib';
import '@mdi/font/css/materialdesignicons.css';
import { gen_variants, gen_visibilities } from '@/utilities/color_util';

const statuses = {
  statusFailed: colors.red.base,
  statusfailed: colors.red.base,
  statusFromProfile: colors.teal.base,
  statusfromprofile: colors.teal.base,
  statusNoData: colors.orange.lighten1,
  statusnodata: colors.orange.lighten1,
  statusNotApplicable: colors.lightBlue.base,
  statusNotReviewed: colors.orange.base,
  statusnotreviewed: colors.orange.base,
  statusNotRun: colors.teal.darken2,
  statusnotrun: colors.teal.darken2,
  statusPassed: colors.green.base,
  statuspassed: colors.green.base,
  statusProfileError: colors.indigo.lighten2,
  statusprofileerror: colors.indigo.lighten2,
  statusskipped: colors.orange.base,
};

// Get colors generated from base mitre using UtilColorGenerator.
// These are identical to default vuetify shading, but now we can access them programatically!
const mitrePrimaryBlue = gen_variants('#005b94');
const mitrePrimaryGrey = gen_variants('#5f636a');
const mitreSecondaryGrey = gen_variants('#cfdeea');
const mitreSecondaryBlue = gen_variants('#00b3dc');
const darkBackground = gen_variants('#303030');

const branding = {
  mitreCardShadow: '#d6d6d6',
  mitrePrimaryBlue,
  mitrePrimaryGrey,
  mitreSecondaryBlue,
  mitreSecondaryGreen: '#BFD228',
  mitreSecondaryGrey,
  mitreSecondaryOrange: '#F7901E',
  mitreSecondaryRed: '#C6401D',
  mitreSecondaryYellow: '#FFE23C',
  mitreSectionBackground: '#f3f2f2', // #eff3f5;
  mitreSectionBorder: '#cfcfcf', // #b4bfae
};

const severities = {
  severityCritical: colors.red.base,
  severityHigh: colors.deepOrange.base,
  severityLow: colors.yellow.base,
  severityMedium: colors.orange.base,
  severityNone: colors.lightBlue.base,
};

const compliances = {
  complianceHigh: colors.green.base,
  complianceLow: colors.red.base,
  complianceMedium: colors.yellow.base,
};

const formats = {
  formatCode: colors.orange.base,
  formatInspec: colors.green.base,
  formatScanner: colors.teal.base,
  formatStig: colors.blue.base,
  formatUnknown: colors.grey.base,
};

const vuetify = new Vuetify({
  icons: { iconfont: 'mdi' },
  theme: {
    dark: true,
    options: { customProperties: true },
    themes: {
      dark: {
        ...statuses,
        ...severities,
        ...compliances,
        ...formats,
        ...branding,
        bar: darkBackground,
        'bar-visible': gen_visibilities(darkBackground),
        primary: mitreSecondaryBlue,
        'primary-visible': gen_visibilities(mitreSecondaryBlue),
        secondary: darkBackground,
        'secondary-visible': gen_visibilities(darkBackground),
      },
    },
  },
});
export default vuetify;

/** * colors from new MII homepage ***/
/*
@highlightGrey: #999999;
@cardLabelIcons: #aaaaaa;
@cardShadow: #d6d6d6;
@fontLink: #3366cc;     //#006fce;
@fontLinkVisited: #72078f;
@fontBody: #333333;
@fontTitle: #333333;
@contentBackground: #ffffff;    //#eff3f5;
@orangeBackground: #f4b436;
@navHighlightBlue: #56c5f2;
@highlight-background-color: @cardShadow;
@link-color: @fontLink;         //#0015E8;
@sectionBackground: #f3f2f2;    //#eff3f5;
@sectionBorder: #cfcfcf;        //#b4bfae
/*outlook chart states */
/*
@outlookBusy: #9698ce;
@outlookOut: #a96ead;
@colorBackground: @contentBackground;
@mitrePrimaryBlue: #005B94;
@mitrePrimaryGrey: #5f636a;
@mitreSecondaryGreen: #BFD228;
@mitreSecondaryGrey: #CFDEEA;
@mitreSecondaryBlue: #00B3DC;
@mitreSecondaryYellow: #FFE23C;
@mitreSecondaryOrange: #F7901E;
@mitreSecondaryRed: #C6401D;
@themeGreen: #9bc25b;
@projectPagesGreen: #5ea100;
@footerBlack: #333333;
@emergencyNewsRed: @mitreSecondaryRed;
@errorBackground: #FFBABA;
@warningBackground: #f9f2ca;
@feedbackOrange: #f7c869;
@feedExternalNews: #85adb3;
@feedModeling: #61b83c;
@feedEcis: @themeGreen;
@feedCustom: #e7a53c;
@feedEvent: #7184a9;
@feedMitre: @mitrePrimaryBlue;
@feedWorkstream: @mitreSecondaryBlue;
@coverageGraphAxisGrey: #b2c8d3;
*/
