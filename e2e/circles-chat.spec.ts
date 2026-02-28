import { test, expect } from '@playwright/test'

test.describe('Circle & Chat Flow', () => {
  const timestamp = Date.now()
  const testEmail = `circle.test.${timestamp}@test.com`
  const testPassword = 'TestPassword123!'
  const testUsername = `circleuser${timestamp}`
  const circleName = `テストサークル ${timestamp}`

  test.beforeEach(async ({ page }) => {
    // Register a new user
    await page.goto('/register')
    await page.locator('input[type="text"]').first().fill(testUsername)
    await page.locator('input[type="email"]').fill(testEmail)
    await page.locator('input[type="password"]').first().fill(testPassword)
    await page.locator('input[type="password"]').last().fill(testPassword)
    await page.locator('button:has-text("登録")').click()

    // Wait for redirect to circles page
    await page.waitForURL('**/circles', { timeout: 10000 }).catch(async () => {
      // If registration fails (user exists), try login
      await page.goto('/login')
      await page.locator('input[type="email"]').fill(testEmail)
      await page.locator('input[type="password"]').fill(testPassword)
      await page.locator('button:has-text("ログイン")').click()
      await page.waitForURL('**/circles', { timeout: 10000 })
    })
  })

  test('should display circles page with empty state', async ({ page }) => {
    await expect(
      page.locator('h1:has-text("サークル")')
    ).toBeVisible()
    // Either empty state or circle list should be visible
    const emptyState = page.locator('text=まだサークルがありません')
    const circleGrid = page.locator('[class*="grid"]')
    await expect(emptyState.or(circleGrid)).toBeVisible()
  })

  test('should create a new circle', async ({ page }) => {
    // Click create button
    await page.locator('button:has-text("新規作成")').click()

    // Fill circle form
    await expect(
      page.locator('text=新しいサークルを作成')
    ).toBeVisible()
    await page
      .locator('input[placeholder="サークルの名前"]')
      .fill(circleName)
    await page
      .locator('textarea[placeholder*="サークルの説明"]')
      .fill('E2Eテスト用のサークルです')

    // Submit
    await page.locator('button:has-text("作成")').click()

    // Wait for circle to appear in list
    await expect(page.locator(`text=${circleName}`)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should navigate to circle detail and see channels', async ({
    page,
  }) => {
    // First create a circle
    await page.locator('button:has-text("新規作成")').click()
    await page
      .locator('input[placeholder="サークルの名前"]')
      .fill(circleName)
    await page.locator('button:has-text("作成")').click()
    await expect(page.locator(`text=${circleName}`)).toBeVisible({
      timeout: 10000,
    })

    // Click on the circle
    await page.locator(`text=${circleName}`).click()

    // Should show circle detail with channel sidebar
    await expect(page.locator('text=一般')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=メンバー')).toBeVisible()
  })

  test('should send a message in a channel', async ({ page }) => {
    // Create circle
    await page.locator('button:has-text("新規作成")').click()
    await page
      .locator('input[placeholder="サークルの名前"]')
      .fill(circleName)
    await page.locator('button:has-text("作成")').click()
    await expect(page.locator(`text=${circleName}`)).toBeVisible({
      timeout: 10000,
    })

    // Navigate to circle
    await page.locator(`text=${circleName}`).click()

    // Click on 一般 channel
    await page.locator('a:has-text("一般")').click()

    // Should show channel header
    await expect(
      page.locator('h3:has-text("一般")')
    ).toBeVisible({ timeout: 10000 })

    // Type and send a message
    const messageText = `テストメッセージ ${Date.now()}`
    await page
      .locator('textarea[placeholder*="メッセージを入力"]')
      .fill(messageText)
    await page.locator('button:has-text("送信")').click()

    // Message should appear
    await expect(page.locator(`text=${messageText}`)).toBeVisible({
      timeout: 10000,
    })
  })

  test('should take screenshots in light and dark modes', async ({ page }) => {
    // Create a circle first
    await page.locator('button:has-text("新規作成")').click()
    await page
      .locator('input[placeholder="サークルの名前"]')
      .fill(circleName)
    await page.locator('button:has-text("作成")').click()
    await expect(page.locator(`text=${circleName}`)).toBeVisible({
      timeout: 10000,
    })

    // Light mode screenshot of circles list
    await page.screenshot({ path: 'e2e/screenshots/circles-list-light.png' })

    // Navigate to circle detail
    await page.locator(`text=${circleName}`).click()
    await expect(page.locator('text=一般')).toBeVisible({ timeout: 10000 })
    await page.screenshot({
      path: 'e2e/screenshots/circle-detail-light.png',
    })

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    })

    await page.screenshot({
      path: 'e2e/screenshots/circle-detail-dark.png',
    })

    // Go back and screenshot circles list in dark
    await page.goto('/circles')
    await page.waitForTimeout(1000)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.screenshot({ path: 'e2e/screenshots/circles-list-dark.png' })
  })
})
