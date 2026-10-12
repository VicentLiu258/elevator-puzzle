// @vitest-environment jsdom
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Game } from '../components/Game'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLElement | null = null

beforeAll(() => {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO
})

afterEach(() => {
  act(() => root?.unmount())
  host?.remove()
  root = null
  host = null
  localStorage.clear()
})

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => {
    root!.render(createElement(Game))
  })
}

function tabs(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('.building__page-tab')]
}

function activeLabel(): string {
  return tabs().find((t) => t.getAttribute('aria-selected') === 'true')?.textContent ?? ''
}

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('Building 楼层场景切换', () => {
  it('可在 1–5F / 6–10F / 11–15F 之间来回切换', () => {
    mount()
    const [t1, t2, t3] = tabs()
    expect(t1?.textContent).toBe('1–5F')

    click(t2!)
    expect(activeLabel()).toBe('6–10F')
    click(tabs()[0]!)
    expect(activeLabel()).toBe('1–5F')
    click(tabs()[2]!)
    expect(activeLabel()).toBe('11–15F')
    click(tabs()[1]!)
    expect(activeLabel()).toBe('6–10F')
    click(t3!)
    expect(activeLabel()).toBe('11–15F')
  })

  it('点击楼层按钮预览后，仍可用页签切回', () => {
    mount()
    const floorBtns = [...document.querySelectorAll<HTMLButtonElement>('.floor-btn')]
    const btn8 = floorBtns.find((b) => b.textContent === '8')!
    click(btn8)
    expect(activeLabel()).toBe('6–10F')
    click(tabs()[0]!)
    expect(activeLabel()).toBe('1–5F')
    click(tabs()[2]!)
    expect(activeLabel()).toBe('11–15F')
  })

  // jsdom 没有真实布局/命中测试，这里守住线上 bug 的根因：
  // 幕墙按页平移后，视口外的楼层仍会盖住页签栏，必须靠层级把栏抬到大楼之上。
  it.each(['.building__page-bar', '.tower-commands'])(
    '%s 的层级必须高于大楼（否则点击会被楼层吃掉）',
    (selector) => {
      const appCss = readFileSync(`${process.cwd()}/src/App.css`, 'utf8')
      const block = appCss.match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))
      expect(block, `${selector} 样式块不存在`).not.toBeNull()
      expect(block![1]).toMatch(/position:\s*relative/)
      const z = block![1]!.match(/z-index:\s*(\d+)/)
      expect(z, `${selector} 缺少 z-index`).not.toBeNull()
      expect(Number(z![1])).toBeGreaterThanOrEqual(10)
    },
  )

  it('上/下箭头可翻页', () => {
    mount()
    click(tabs()[1]!)
    const [up, down] = [...document.querySelectorAll<HTMLButtonElement>('.building__page-btn')]
    click(up!)
    expect(activeLabel()).toBe('11–15F')
    click(down!)
    expect(activeLabel()).toBe('6–10F')
    click(down!)
    expect(activeLabel()).toBe('1–5F')
  })
})
