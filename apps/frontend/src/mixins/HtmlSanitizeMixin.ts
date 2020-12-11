import sanitize from 'sanitize-html';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class HtmlSanitizeMixin extends Vue {
  sanitize_html(message: string): string {
    return sanitize(message);
  }
}
