import DOMPurify from 'dompurify';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class HtmlSanitizeMixin extends Vue {
  sanitize_html(message: string): string {
    return DOMPurify.sanitize(message);
  }
}
