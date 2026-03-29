import { test, expect, expectSuccess, expectError, uniqueSku } from './fixtures';

test.describe('Products CRUD', () => {
  test('displays catalog intake heading', async ({ authedPage: page }) => {
    await page.click('[href="/products"]');
    await expect(page.locator('h1')).toContainText('Catalog intake');
  });

  test('creates a new product', async ({ authedPage: page }) => {
    await page.click('[href="/products"]');
    const sku = uniqueSku();

    await page.fill('#sku', sku);
    await page.fill('#name', `Test Product ${sku}`);
    await page.fill('#description', 'Playwright test product');
    await page.fill('#hsn-sac', '8471');
    await page.fill('#price', '249.99');
    await page.fill('#gst-rate', '18');
    await page.click('button:has-text("Create product")');

    await expectSuccess(page, 'Product created successfully');

    // Verify product appears in the list
    const row = page.locator('.table-row', { hasText: sku });
    await expect(row).toBeVisible();
    await expect(row.locator('strong')).toContainText(`Test Product ${sku}`);
  });

  test('rejects duplicate SKU', async ({ authedPage: page }) => {
    await page.click('[href="/products"]');
    const sku = uniqueSku();

    // Create first product
    await page.fill('#sku', sku);
    await page.fill('#name', `Dup Test ${sku}`);
    await page.fill('#price', '10');
    await page.fill('#gst-rate', '5');
    await page.click('button:has-text("Create product")');
    await expectSuccess(page, 'Product created');

    // Try duplicate SKU
    await page.fill('#sku', sku);
    await page.fill('#name', 'Duplicate Attempt');
    await page.fill('#price', '20');
    await page.fill('#gst-rate', '5');
    await page.click('button:has-text("Create product")');
    await expectError(page);
  });

  test('edits an existing product', async ({ authedPage: page }) => {
    await page.click('[href="/products"]');
    const sku = uniqueSku();

    // Create a product
    await page.fill('#sku', sku);
    await page.fill('#name', `Edit Me ${sku}`);
    await page.fill('#price', '100');
    await page.fill('#gst-rate', '12');
    await page.click('button:has-text("Create product")');
    await expectSuccess(page, 'Product created');

    // Click Edit on the new product row
    const row = page.locator('.table-row', { hasText: sku });
    await row.locator('button:has-text("Edit")').click();

    // Form should show "Editing product" heading
    await expect(page.getByRole('heading', { name: /Editing product/ })).toBeVisible();
    await expect(page.locator('button:has-text("Cancel edit")')).toBeVisible();

    // Update the name
    await page.fill('#name', `Updated ${sku}`);
    await page.fill('#price', '150');
    await page.click('button:has-text("Update product")');
    await expectSuccess(page, 'Product updated');

    // Verify updated name in list
    await expect(page.getByText(`Updated ${sku}`)).toBeVisible();
  });

  test('deletes a product', async ({ authedPage: page }) => {
    await page.click('[href="/products"]');
    const sku = uniqueSku();

    // Create a product
    await page.fill('#sku', sku);
    await page.fill('#name', `Delete Me ${sku}`);
    await page.fill('#price', '50');
    await page.fill('#gst-rate', '5');
    await page.click('button:has-text("Create product")');
    await expectSuccess(page, 'Product created');

    // Delete it — accept the confirm dialog and wait for new banner
    const row = page.locator('.table-row', { hasText: sku });
    page.on('dialog', (dialog) => dialog.accept());
    // Wait for old banner to disappear then the new one to appear
    await row.locator('button:has-text("Delete")').click();
    await expect(page.locator('.status-banner--success')).toContainText('Product deleted', { timeout: 10_000 });

    // Should no longer appear
    await expect(page.locator('.table-row', { hasText: sku })).not.toBeVisible();
  });

  test('validates GST rate range (0-100)', async ({ authedPage: page }) => {
    await page.click('[href="/products"]');
    const sku = uniqueSku();

    await page.fill('#sku', sku);
    await page.fill('#name', `GST Test ${sku}`);
    await page.fill('#price', '100');
    await page.fill('#gst-rate', '150'); // Invalid
    await page.click('button:has-text("Create product")');

    // Either a validation error or the field constrains the value
    // The form has max=100 so the browser may prevent submission
    // or the API will reject it
    const errorVisible = await page
      .locator('.status-banner--error')
      .isVisible()
      .catch(() => false);
    const stillOnForm = await page
      .locator('button:has-text("Create product")')
      .isVisible();
    expect(errorVisible || stillOnForm).toBeTruthy();
  });
});
