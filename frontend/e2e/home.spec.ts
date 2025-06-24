import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Sabs v2/);
    
    // Check that the main heading is visible
    await expect(page.locator('h1')).toContainText('Welcome to Sabs v2');
    
    // Check that the description is visible
    await expect(page.locator('p')).toContainText('Next-generation micro-finance platform');
    
    // Check that the Get Started button is visible
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
  });

  test('should display platform features', async ({ page }) => {
    await page.goto('/');
    
    // Check that the features section is visible
    await expect(page.locator('text=Platform Features')).toBeVisible();
    
    // Check that specific features are listed
    await expect(page.locator('text=Multi-tenant architecture')).toBeVisible();
    await expect(page.locator('text=Role-based access control')).toBeVisible();
    await expect(page.locator('text=Real-time transaction processing')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Get Started")')).toBeVisible();
  });
});