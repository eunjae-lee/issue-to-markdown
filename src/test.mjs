import matter from 'gray-matter'
import {parse, stringify} from 'yaml'

// import frontmatter from 'front-matter'

const content = `---
created_at: 2023-01-09T22:38:00.000Z
lang: 'ko'
layout: "tweet"
slug: test-slug
tags:
  - thought
  - dev
---

hello
`

// const {attributes, ...rest} = frontmatter(content)

// console.log(attributes.created_at instanceof Date)

// console.log('💡 rest', rest)

const result = matter(content, {
  engines: {
    yaml: {
      parse,
      stringify
    }
  }
})
console.log(result, result.data.created_at.toString())
