import frontmatter from 'front-matter'

const {attributes, ...rest} = frontmatter(`---
created_at: 2023-01-09T22:38:00.000Z
lang: 'ko'
layout: "tweet"
slug: test-slug
tags:
  - thought
---

hello
`)

console.log(attributes.created_at instanceof Date)

console.log('💡 rest', rest)
