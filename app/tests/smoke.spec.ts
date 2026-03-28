import { test, expect } from '@playwright/test'

const BASE = 'https://business-analysis-production.up.railway.app'

test('главная страница загружается', async ({ page }) => {
  await page.goto(BASE)
  await expect(page).toHaveTitle(/Opportunity/)
  await expect(page.locator('text=ДОБРО ПОЖАЛОВАТЬ')).toBeVisible()
})

test('навигация присутствует', async ({ page }) => {
  await page.goto(BASE)
  const nav = page.locator('nav')
  await expect(nav.locator('text=Профиль')).toBeVisible()
  await expect(nav.locator('text=Диагностика')).toBeVisible()
  await expect(nav.locator('text=Запрос')).toBeVisible()
  await expect(nav.locator('text=Сигналы')).toBeVisible()
  await expect(nav.locator('text=Возможности')).toBeVisible()
})

test('/signals загружается', async ({ page }) => {
  await page.goto(`${BASE}/signals`)
  await expect(page).toHaveURL(`${BASE}/signals`)
  await expect(page.locator('body')).not.toContainText('500')
  await expect(page.locator('body')).not.toContainText('Error')
})

test('/opportunities загружается', async ({ page }) => {
  await page.goto(`${BASE}/opportunities`)
  await expect(page).toHaveURL(`${BASE}/opportunities`)
  await expect(page.locator('body')).not.toContainText('500')
})

test('/discovery загружается', async ({ page }) => {
  await page.goto(`${BASE}/discovery`)
  await expect(page).toHaveURL(`${BASE}/discovery`)
  await expect(page.locator('body')).not.toContainText('500')
})

test('/assessment загружается', async ({ page }) => {
  await page.goto(`${BASE}/assessment`)
  await expect(page).toHaveURL(`${BASE}/assessment`)
  await expect(page.locator('body')).not.toContainText('500')
})

test('/profile загружается', async ({ page }) => {
  await page.goto(`${BASE}/profile`)
  await expect(page).toHaveURL(`${BASE}/profile`)
  await expect(page.locator('body')).not.toContainText('500')
})

test('переход на /signals с главной', async ({ page }) => {
  await page.goto(BASE)
  await page.click('text=Сигналы')
  await expect(page).toHaveURL(`${BASE}/signals`)
})

test('переход на /opportunities с главной', async ({ page }) => {
  await page.goto(BASE)
  await page.click('text=Возможности')
  await expect(page).toHaveURL(`${BASE}/opportunities`)
})
