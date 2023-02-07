#!/usr/bin/env zx
import {$} from 'zx'

const version = process.argv[3]
if (!version) {
  console.error('Version is missing.')
  console.log('  e.g. > npm run deploy 0.0.1')
  process.exit(1)
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Version is malformed.')
  console.log('  e.g. > npm run deploy 0.0.1')
  process.exit(1)
}

$`npm pkg set version=${version}`
$`npm run all`
$`git add .`
$`git commit -m "chore: release v${version}`

$`git tag v${version}`

$`git push --delete origin v0`
$`git tag -d`
$`git tag v0`
$`git push origin v0`
$`git push origin main`

$`open "https://github.com/eunjae-lee/issue-to-markdown/releases/new"`
