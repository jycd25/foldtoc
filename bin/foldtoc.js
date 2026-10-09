#!/usr/bin/env node
import { createInterface } from 'node:readline/promises'
import { main } from '../src/cli.js'

// Anything but "y"/"yes" is a no, including Ctrl+C and Ctrl+D.
async function askOnTerminal(question) {
  const prompt = createInterface({ input: process.stdin, output: process.stderr })
  const cancel = new AbortController()
  prompt.on('SIGINT', () => cancel.abort())
  try {
    return /^y(es)?$/i.test((await prompt.question(question, { signal: cancel.signal })).trim())
  } catch {
    process.stderr.write('\n')
    return false
  } finally {
    prompt.close()
  }
}

process.exitCode = await main(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: process.stdout,
  stderr: process.stderr,
  confirm: process.stdin.isTTY ? askOnTerminal : undefined,
})
