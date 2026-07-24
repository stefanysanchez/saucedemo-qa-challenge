import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForUrlContains(fragment: string) {
    await this.page.waitForURL(`**${fragment}**`);
  }
}
