import { test, expect } from '@playwright/test'

test.describe('Visual Check', () => {
  test('home page light mode', async ({ page }) => {
    // Force light mode
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light')
    })
    await page.goto('http://localhost:3000/')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/home-light.png', fullPage: true })
  })

  test('home page dark mode', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('http://localhost:3000/')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/home-dark.png', fullPage: true })
  })

  test('login page light mode', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light')
    })
    await page.goto('http://localhost:3000/login')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/login-light.png', fullPage: true })
  })

  test('register page dark mode', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('http://localhost:3000/register')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/register-dark.png', fullPage: true })
  })
})
