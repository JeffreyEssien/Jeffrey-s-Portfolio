import test from 'node:test'
import assert from 'node:assert/strict'
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from 'next/constants.js'
import config from '../../next.config.ts'

test('development, browser tests and production have independent caches; start serves the build directory', () => {
  const previous = process.env.PORTFOLIO_TEST_SERVER
  try {
    delete process.env.PORTFOLIO_TEST_SERVER
    const dev = config(PHASE_DEVELOPMENT_SERVER)
    const build = config(PHASE_PRODUCTION_BUILD)
    const start = config(PHASE_PRODUCTION_SERVER)
    process.env.PORTFOLIO_TEST_SERVER = '1'
    const browser = config(PHASE_DEVELOPMENT_SERVER)
    assert.equal(build.distDir, '.next', 'Vercel expects the standard production output directory')
    assert.equal(new Set([dev.distDir, build.distDir, browser.distDir]).size, 3)
    assert.equal(new Set([dev.typescript.tsconfigPath, build.typescript.tsconfigPath, browser.typescript.tsconfigPath]).size, 3)
    assert.equal(start.distDir, build.distDir)
    assert.equal(start.typescript.tsconfigPath, build.typescript.tsconfigPath)
  } finally {
    if (previous === undefined) delete process.env.PORTFOLIO_TEST_SERVER
    else process.env.PORTFOLIO_TEST_SERVER = previous
  }
})
