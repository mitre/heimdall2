import {describe, it, expect, vi} from 'vitest';
import {of} from 'rxjs';
import {CreateEvaluationInterceptor} from './create-evaluation-interceptor';

describe('CreateEvaluationInterceptor', () => {
  const mockGroupsService = {} as any;
  const interceptor = new CreateEvaluationInterceptor(mockGroupsService);

  function createMockContext(body: Record<string, unknown>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({body}),
      }),
    } as any;
  }

  const mockCallHandler = {handle: () => of('next')};

  it('splits comma-separated evaluationTags into {value} objects', () => {
    const body = {evaluationTags: 'stig,cis,rhel9'};
    interceptor.intercept(createMockContext(body), mockCallHandler);
    expect(body.evaluationTags).toEqual([
      {value: 'stig'},
      {value: 'cis'},
      {value: 'rhel9'},
    ]);
  });

  it('sets evaluationTags to empty array when undefined', () => {
    const body = {evaluationTags: undefined};
    interceptor.intercept(createMockContext(body), mockCallHandler);
    expect(body.evaluationTags).toEqual([]);
  });

  it('sets evaluationTags to empty array when empty string', () => {
    const body = {evaluationTags: ''};
    interceptor.intercept(createMockContext(body), mockCallHandler);
    expect(body.evaluationTags).toEqual([]);
  });

  it('converts string "true" public to boolean true', () => {
    const body = {public: 'true', evaluationTags: undefined};
    interceptor.intercept(createMockContext(body), mockCallHandler);
    expect(body.public).toBe(true);
  });

  it('splits comma-separated groups', () => {
    const body = {groups: '1,2,3', evaluationTags: undefined};
    interceptor.intercept(createMockContext(body), mockCallHandler);
    expect(body.groups).toEqual(['1', '2', '3']);
  });
});
