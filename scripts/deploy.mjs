#!/usr/bin/env zx
import {$} from 'zx'

const version = process.argv[3]
if (!version) {
  console.error('Version is missing.')
  console.log('  e.g. > yarn deploy 0.0.1')
  process.exit(1)
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Version is malformed.')
  console.log('  e.g. > yarn deploy 0.0.1')
  process.exit(1)
}

await $`npm pkg set version=${version}`
await $`yarn all`
await $`git add .`
await $`git commit -m "chore: release v${version}"`

await $`git tag v${version}`
await $`git push origin v${version}`

try {
  await $`git push --delete origin v1`
} catch (err) {
  // ignore this
}
try {
  await $`git tag -d v1`
} catch (err) {
  // ignore this
}
await $`git tag v1`
await $`git push origin v1`
await $`git push origin main`

await $`open "https://github.com/eunjae-lee/issue-to-markdown/releases/new"`
