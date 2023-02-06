import {expect, test} from '@jest/globals'
import {extractImages} from '../src/extract-images'

test('extracts an empty array from empty string', () => {
  expect(extractImages('')).toEqual([])
})

test('extracts urls correctly', () => {
  expect(
    extractImages(`
  foo

  ![IMG_8640](https://user-images.githubusercontent.com/499898/216828317-f11b77f7-c2cf-4488-af17-9172390b0e32.JPG "hello world")
  
  bar
  Group 1 will be image 2.png, and group 2 will be hello world.
  
  The problem appears when I try to parse a link without title:
  
  foo
  
  ![](image 2.png)
  
  bar
  `)
  ).toEqual([
    {
      alt: 'IMG_8640',
      filename:
        'https://user-images.githubusercontent.com/499898/216828317-f11b77f7-c2cf-4488-af17-9172390b0e32.JPG',
      match:
        '![IMG_8640](https://user-images.githubusercontent.com/499898/216828317-f11b77f7-c2cf-4488-af17-9172390b0e32.JPG "hello world")',
      title: 'hello world'
    },
    {
      alt: '',
      filename: 'image 2.png',
      match: '![](image 2.png)',
      title: undefined
    }
  ])
})

test('strips qoutes', () => {
  expect(
    extractImages(`
  ![IMG_8640](https://user-images.githubusercontent.com/499898/216828317-f11b77f7-c2cf-4488-af17-9172390b0e32.JPG "hello world")
  ![](image 2.png 'hi there')
  `)
  ).toEqual([
    {
      alt: 'IMG_8640',
      filename:
        'https://user-images.githubusercontent.com/499898/216828317-f11b77f7-c2cf-4488-af17-9172390b0e32.JPG',
      match:
        '![IMG_8640](https://user-images.githubusercontent.com/499898/216828317-f11b77f7-c2cf-4488-af17-9172390b0e32.JPG "hello world")',
      title: 'hello world'
    },
    {
      alt: '',
      filename: 'image 2.png',
      match: `![](image 2.png 'hi there')`,
      title: 'hi there'
    }
  ])
})
