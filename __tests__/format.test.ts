import {expect, test} from '@jest/globals'
import matter from 'gray-matter'
import {parse, stringify} from 'yaml'
import {formatFrontMatterValue} from '../src/format'

function parseAndFormat(body: string, key: string) {
  const {data: attributes, content: bodyWithoutFrontMatter} = matter(body)
  const {data: attributesWithoutDateProcessing} = matter(body, {
    engines: {
      yaml: {
        parse,
        stringify
      }
    }
  })
  return formatFrontMatterValue(
    attributes[key],
    attributesWithoutDateProcessing[key]
  )
}

test('works with either quotes', () => {
  const content = `---
lang: 'ko'
layout: "tweet"
---

hello
`
  expect(parseAndFormat(content, 'lang')).toEqual(`"ko"`)
  expect(parseAndFormat(content, 'layout')).toEqual(`"tweet"`)
})

test('works with array', () => {
  const content = `---
tags:
  - thought
  - dev
---

hello
`
  expect(parseAndFormat(content, 'tags')).toEqual(`
  - "thought"
  - "dev"`)
})

test('works with date', () => {
  const content = `---
created_at: 2023-01-09T22:38:00.000Z
---

hello
`
  // this shouldn't be quoted like "2023-01-09T22:38:00.000Z".
  // it should be like the following
  expect(parseAndFormat(content, 'created_at')).toEqual(
    `2023-01-09T22:38:00.000Z`
  )
})

test('works with array of date', () => {
  const content = `---
timestamps:
  - 2023-01-09T22:38:00.000Z
---

hello
`
  // this shouldn't be quoted like "2023-01-09T22:38:00.000Z".
  // it should be like the following
  expect(parseAndFormat(content, 'timestamps')).toEqual(
    `\n  - 2023-01-09T22:38:00.000Z`
  )
})
