export default class Sidebar {
  togglePassed(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(0).click({force: true});
    });
  }

  toggleFailed(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(1).click({force: true});
    });
  }

  toggleNotApplicable(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(2).click({force: true});
    });
  }

  toggleNotReviewed(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(3).click({force: true});
    });
  }

  toggleLow(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(4).click({force: true});
    });
  }
  toggleMedium(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(5).click({force: true});
    });
  }
  toggleHigh(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(6).click({force: true});
    });
  }
  toggleCritical(): void {
    cy.get('[data-cy=commonFilters]').within(() => {
      cy.get('input[role=switch]').eq(7).click({force: true});
    });
  }

  openSidebar(): void {
    cy.get('[data-cy=openSidebar]').click({force: true});
  }

  saveFileToDatabase(name: string): void {
    this.openSidebar();
    cy.get(`[title="${name}"] [data-cy=saveFile]`).click();
  }

  closeFile(name: string): void {
    cy.get(`[title="${name}"] [data-cy=closeFile]`).click();
  }

  saveFileToHdf(name: string): void {
    cy.get(`[title="${name}"]`).get('[data-cy=saveToHdf]').click();
  }

  exportFileToHdf(): void {
    cy.get('[data-cy=exportButton]').click();
    cy.get('[data-cy=exportJson]').click();
  }

  exportFileToCkl(name: string): void {
    cy.get('[data-cy=exportButton]').click();
    cy.get('[data-cy=exportCkl]').click();
    cy.contains(name).within(() => cy.get('input[role=checkbox]').click());
    cy.contains('Export').click();
  }

  filterByCategory(
    property: string,
    keyword: string,
    exclusive?: boolean
  ): void {
    const categoryFiltersHeader = /Category Filters/;
    this.selectDropdownFilter(
      categoryFiltersHeader,
      property,
      keyword,
      exclusive
    );
  }

  filterByMetadata(property: string, keyword: string, exclusive?: boolean) {
    const metadataFiltersHeader = /^((?!Category).)* Filters/;
    this.selectDropdownFilter(
      metadataFiltersHeader,
      property,
      keyword,
      exclusive
    );
  }

  selectDropdownFilter(
    headerRegExp: RegExp,
    property: string,
    keyword: string,
    exclusive?: boolean
  ) {
    cy.contains(headerRegExp)
      .parent()
      .contains('Filter Properties')
      .parent()
      .within(() => cy.get('input[type=text]').click());

    cy.get('div[role=option]').contains(property).click();

    cy.contains(headerRegExp)
      .parent()
      .contains('Enter filter keyword')
      .parent()
      .within(() => cy.get('input[type=text]').clear().type(keyword));

    if (exclusive) {
      cy.contains('Exclusive (-) Filter')
        .parent()
        .within(() => cy.get('input[type=radio]'))
        .click();
    }

    cy.contains(headerRegExp).parent().contains('Add').click();
  }
}
