import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify, {colors} from 'vuetify/lib';
import Toasted from 'vue-toasted';
import {ToastOptions} from 'vue-toasted/types/index';
import {gen_variants, gen_visibilities} from '@/utilities/color_util';

Vue.use(Vuetify);

Vue.use(Toasted);
// options to the toast
let options: ToastOptions = {
  theme: 'toasted-primary',
  position: 'top-center',
  fullWidth: true,
  containerClass: 'background v-application',
  className: 'white--text',
  action: [
    {
      text: 'Report Issue',
      href:
        'https://github.com/mitre/heimdall-lite/issues/new?assignees=&labels=bug&template=bug_report.md&title='
    },
    {
      text: 'Dismiss',
      onClick: (_, toast_object) => toast_object.goAway(0)
    }
  ],
  // icon: 'mdi-alert-octagram',
  duration: 1e12 // effectively infinite.
};

// register the toast with the custom message
Vue.toasted.register(
  'error',
  payload => {
    if (!payload.message) {
      return `ERROR: An unidentified error has occured, if functionality
        has degraded please try refreshing the page. If that does not fix the
        issue you are experiencing, then please report the issue`;
    }

    // The vue component passes in current dark mode setting, and the toast is adjusted
    // to be high contrast
    options.className += payload.isDark ? ' invert' : '';

    // Display message passed by vue component
    return 'ERROR: ' + payload.message;
  },
  options
);

// "Not Applicable" | "Not Reviewed" | "Profile Error";
const statuses = {
  statusPassed: colors.green.base,
  statusFailed: colors.red.base,
  statusNotApplicable: colors.lightBlue.base,
  statusNoData: colors.orange.lighten1,
  statusNotReviewed: colors.orange.base,
  statusProfileError: colors.indigo.lighten2,
  statusNotRun: colors.teal.darken2,
  statusFromProfile: colors.teal.base,
  statuspassed: colors.green.base,
  statusfailed: colors.red.base,
  statusnodata: colors.orange.lighten1,
  statusnotreviewed: colors.orange.base,
  statusskipped: colors.orange.base,
  statusprofileerror: colors.indigo.lighten2,
  statusnotrun: colors.teal.darken2,
  statusfromprofile: colors.teal.base
};

// Get colors generated from base mitre using UtilColorGenerator.
// These are identical to default vuetify shading, but now we can access them programatically!
let mitrePrimaryBlue = gen_variants('#005b94');
let mitrePrimaryGrey = gen_variants('#5f636a');
let mitreSecondaryGrey = gen_variants('#cfdeea');
let mitreSecondaryBlue = gen_variants('#00b3dc');
let darkBackground = gen_variants('#303030');
let lightBackground = gen_variants('#e0e0e0', 2); // Want more extreme variations

const branding = {
  mitrePrimaryBlue,
  mitrePrimaryGrey,
  mitreSecondaryGrey,
  mitreSecondaryBlue,
  mitreSecondaryGreen: '#BFD228',
  mitreSecondaryYellow: '#FFE23C',
  mitreSecondaryOrange: '#F7901E',
  mitreSecondaryRed: '#C6401D',
  mitreSectionBackground: '#f3f2f2', //#eff3f5;
  mitreSectionBorder: '#cfcfcf', //#b4bfae
  mitreCardShadow: '#d6d6d6'
};

let severities = {
  severityLow: colors.yellow.base,
  severityMedium: colors.orange.base,
  severityHigh: colors.deepOrange.base,
  severityCritical: colors.red.base
};

let compliances = {
  complianceLow: colors.red.base,
  complianceMedium: colors.yellow.base,
  complianceHigh: colors.green.base
};

const veautiful = new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    dark: true,
    themes: {
      dark: {
        ...statuses,
        ...severities,
        ...compliances,
        ...branding,
        primary: mitreSecondaryBlue,
        'primary-visible': gen_visibilities(mitreSecondaryBlue),
        bar: darkBackground,
        'bar-visible': gen_visibilities(darkBackground),
        secondary: darkBackground,
        'secondary-visible': gen_visibilities(darkBackground)
      },
      light: {
        ...statuses,
        ...severities,
        ...compliances,
        ...branding,
        primary: mitrePrimaryBlue,
        'primary-visible': gen_visibilities(mitrePrimaryBlue),
        bar: mitrePrimaryBlue,
        'bar-visible': gen_visibilities(mitrePrimaryBlue),
        secondary: lightBackground,
        'secondary-visible': gen_visibilities(lightBackground)
      }
    },
    options: {
      customProperties: true
    }
  }
});
export default veautiful;

/*** colors from new MII homepage ***/
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
/*outlook chart states*/
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
