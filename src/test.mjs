import frontmatter from 'front-matter'

console.log(
  frontmatter(`---
created_at: 2023-01-09T22:38:00.000Z
lang: 'ko'
layout: "tweet"
slug: test-slug
tags:
  - thought
---

hello
`)
)
