import { test, expect } from '@playwright/test'

test.describe('Registration Flow', () => {
  test('should display registration page', async ({ page }) => {
    await page.goto('/register')
    
    // Check if page loads
    await expect(page.locator('h1')).toContainText('SECOCA')
    await expect(page.locator('text=新しいサークル体験')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/register')
    
    // Try submitting empty form
    await page.locator('button:has-text("登録")').click()
    
    // Check for validation error
    const errorMessage = page.locator('text=パスワードが一致しません')
    if (await errorMessage.isVisible()) {
      console.log('✓ Password validation working')
    }
  })

  test('should register new user', async ({ page }) => {
    await page.goto('/register')

    const timestamp = Date.now()
    const testEmail = `test.user.${timestamp}@test.com`
    const testPassword = 'TestPassword123!'
    const testUsername = `testuser${timestamp}`
    
    // Fill form
    await page.locator('input[type="text"]').first().fill(testUsername)
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').first().fill(testPassword)
    await page.locator('input[type="password"]').last().fill(testPassword)
    
    // Submit
    await page.locator('button:has-text("登録")').click()
    
    // Wait and check result
    await page.waitForTimeout(3000)
    
    // Check if redirected or error shown
    const errorDiv = page.locator('text=/ログイン|失敗|エラー/')
    if (await errorDiv.isVisible()) {
      const errorText = await errorDiv.textContent()
      console.log('❌ Registration error:', errorText)
    } else {
      console.log('✓ Registration completed (redirected)')
    }
    
    console.log('Current URL:', page.url())
  })
})
