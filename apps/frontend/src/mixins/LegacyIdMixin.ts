import {ContextualizedControl} from 'inspecjs';
import _ from 'lodash';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class LegacyIdMixin extends Vue {
  showLegacy(controls: ContextualizedControl | ContextualizedControl[]) {
    if (!Array.isArray(controls)) {
      controls = [controls];
    }
    let legacyTags = controls.reducecontrol.data.tags['legacy'];
    if (!legacyTag) {
      return '';
    }
    if (!Array.isArray(legacyTag)) {
      legacyTag = [legacyTag];
    }
    const legacyID = legacyTag.find(
      (ele: unknown) => _.isString(ele) && ele.startsWith('V-')
    );
    return legacyID ? '(' + legacyID + ')' : '';
  }
}
