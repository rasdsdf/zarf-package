Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // gitlab throws this error in the console which by default fails the cypress test
  return false
})

describe('Run Pipeline', () => {
  it('Login as the non-admin user', () => {
    // Login as regular user to continue on with testing
    cy.visit('/users/sign_in')
    cy.get('input[id="user_login"]').type(Cypress.env('gitlab_username'))
    cy.get('input[id="user_password"]').type(Cypress.env('gitlab_password'))
    cy.get('button[type="submit"][name="button"]').click()

    // Disable Auto DevOps
    cy.visit('/'+Cypress.env('gitlab_username')+'/'+Cypress.env('gitlab_project')+'/-/settings/ci_cd#autodevops-settings')
    cy.get('input[id="project_auto_devops_attributes_enabled"]').uncheck({force: true})
    cy.get('button[data-qa-selector="save_changes_button"]').click()

    // conditionally configure ci pipeline
    cy.visit('/'+Cypress.env('gitlab_username')+'/'+Cypress.env('gitlab_project'))
    cy.get('body').then($body => {
      if ($body.find('table[data-testid="pipelines-tab-all"]').length > 0) {
        // pipeline already configured. delete the existing pipeline
        cy.visit('/'+Cypress.env('gitlab_username')+'/'+Cypress.env('gitlab_project')+'/-/pipelines')
        cy.get('a[data-qa-selector="pipeline_commit_status"]').click()
        cy.get('button[data-testid="ci-action-component"]').first().click()
      }
      else {
        // configure new pipeline
        cy.visit('/'+Cypress.env('gitlab_username')+'/'+Cypress.env('gitlab_project')+'/-/new/main/')
        cy.get('input[id="file_name"]').click().type('.gitlab-ci.yml')
        cy.get('div[class="view-line"]').click().type('pipeline-test:{enter}{backspace}  stage: test{enter}{backspace}  script:{enter}{backspace}{backspace}    - echo The pipeline test is successful!{enter}')
        // commit file and start pipeline
        cy.scrollTo('bottom')
        cy.get('button[data-qa-selector="commit_button"]').click()
      }
    })
    // wait 9 seconds for pipeline to get started
    cy.wait(9000)
    // Go to pipelines page
    cy.visit('/'+Cypress.env('gitlab_username')+'/'+Cypress.env('gitlab_project')+'/-/pipelines')
    // Wait for pipeline to run and pass. Timeout after 120 seconds
    cy.get('a[data-qa-selector="pipeline_commit_status"]',{timeout: 120000}).should('contain','passed')
    // wait 2 seconds so that the result can be seen in video
    cy.wait(2000)
  })
})
