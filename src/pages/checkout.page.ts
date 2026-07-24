import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { CheckoutInfo } from '../types';

export class CheckoutPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly summaryTotalLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('#first-name');
    this.lastNameInput = page.locator('#last-name');
    this.postalCodeInput = page.locator('#postal-code');
    this.continueButton = page.locator('#continue');
    this.finishButton = page.locator('#finish');
    this.completeHeader = page.locator('.complete-header');
    this.summaryTotalLabel = page.locator('.summary_total_label');
  }

  async fillInformation(info: CheckoutInfo) {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
    await this.continueButton.click();
  }

  async finishPurchase() {
    await this.finishButton.click();
  }

  async getCompleteHeaderText(): Promise<string> {
    return (await this.completeHeader.textContent()) ?? '';
  }
}
