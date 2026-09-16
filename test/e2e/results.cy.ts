import { createUser, signIn } from '../support/auth';
import { sampleName } from '../support/data';
import { loadSample } from '../support/ui';

describe('Results', () => {
  beforeEach(() => {
    createUser();
    signIn();
  });

  it('displays correct data for the Acme Overlay Example sample', () => {
    loadSample(sampleName);
    cy.get('[data-cy="profileInfo"]').click();
    for (const text of [sampleName, '0.2.0', '6414f43b3c6ff3106c96b2e75067a9ed6144a728373b864f4de8b3fb3c6c528f']) {
      cy.get('[data-cy="profileInfoFields"]').should('contain.text', text);
    }
    for (const text of [sampleName, '4.19.2', 'mac_os_x19.4.0', '0.605412']) {
      cy.get('[data-cy="fileinfo"]').should('contain.text', text);
    }
    cy.get('[data-cy="cardText"]').should(($cards) => {
      const summaries = Array.from($cards, card => card.textContent?.replaceAll(/\s+/gv, ' ').trim());
      expect(summaries).to.have.members(['Passed: 5', 'Failed: 60', 'Not Applicable: 1', 'Not Reviewed: 35']);
    });
  });

  it('displays code tab contents for the Acme Overlay Example sample', () => {
    loadSample(sampleName);
    // Control rows are lazy-rendered when scrolled into view.
    cy.scrollTo('bottom');
    cy.get('[data-cy="toggleControlDetails"]').first().click();
    cy.get('a[href="#tab-code"]').click();
    cy.get('pre').should('contain.text', '# Profile name');
  });

  it('displays severity override indicators when present', () => {
    loadSample('Small Profile With Severity Overrides');
    cy.get('[data-cy="profileInfo"]').click();
    cy.scrollTo('bottom');
    cy.get('[data-cy="severityOverride"]').should('have.length', 3);
  });
});
