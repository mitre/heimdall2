import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Evaluation} from '../evaluations/evaluation.model';
import {User} from '../users/user.model';

export default function clear(): void {
  EvaluationTag.destroy({where: {}});
  Evaluation.destroy({where: {}});
  User.destroy({where: {}});
}
