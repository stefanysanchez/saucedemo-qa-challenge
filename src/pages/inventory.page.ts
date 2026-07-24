import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  readonly inventoryItem: Locator;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.inventoryItem = page.locator('.inventory_item');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartIcon = page.locator('.shopping_cart_link');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
  }

  async addProductToCartByName(productName: string) {
    const item = this.page.locator('.inventory_item', { hasText: productName });
    await item.locator('button', { hasText: 'Add to cart' }).click();
  }

  async removeProductFromCartByName(productName: string) {
    const item = this.page.locator('.inventory_item', { hasText: productName });
    await item.locator('button', { hasText: 'Remove' }).click();
  }

  async getCartCount(): Promise<number> {
    const count = await this.cartBadge.count();
    if (count === 0) return 0;
    const text = await this.cartBadge.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  async goToCart() {
    await this.cartIcon.click();
  }

  async isLoaded(): Promise<boolean> {
    return this.inventoryItem.first().isVisible();
  }
}
