import {mkdirp} from 'mkdirp'
import * as core from '@actions/core'
import * as github from '@actions/github'
import frontmatter from 'front-matter'
import fs from 'fs'
import path from 'path'
import download from 'download'
import {extractImages} from './extract-images'

async function run(): Promise<void> {
  const token: string = core.getInput('token')
  const destPath: string = core.getInput('dest')
  const publishLabel: string = core.getInput('label')
  const extension: string = core.getInput('extension')
  const slugAsFolderName: boolean = core.getBooleanInput('slug_as_folder_name')
  const insertTitleToFrontMatter: boolean = core.getBooleanInput(
    'insert_title_to_front_matter'
  )
  const authors: string[] = core.getMultilineInput('authors')

  const issue = github.context.payload.issue
  if (!issue) {
    core.setFailed('This Action works only from the `issue` triggers.')
    return
  }

  const {owner, repo} = github.context.repo

  const authorizedAuthors = authors && authors.length > 0 ? authors : [owner]
  if (!authorizedAuthors.includes(github.context.actor)) {
    core.setFailed('This actor is not authorized to perform this action.')
    return
  }

  const response = await github.getOctokit(token).rest.issues.get({
    owner,
    repo,
    issue_number: issue.number
  })
  const {
    data: {title, labels}
  } = response
  const labelMatches = labels.find(
    label =>
      label === publishLabel ||
      (typeof label === 'object' && label.name === publishLabel)
  )
  if (!labelMatches) {
    core.setFailed(
      `This Action requires the label(\`${publishLabel}\`) in the issue.`
    )
    return
  }

  const {attributes, body: bodyWithoutFrontMatter} = frontmatter<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any>
  >(issue.body || '')

  const {slug} = attributes

  const fullPath = path.join(
    destPath,
    slugAsFolderName ? slug || String(issue.number) : String(issue.number),
    `index${extension}`
  )
  const dirname = path.dirname(fullPath)
  fs.rmSync(dirname, {recursive: true, force: true})
  mkdirp.sync(dirname)

  let body = bodyWithoutFrontMatter
  const images = extractImages(body)
  for (const image of images) {
    const newImageFilename = path.basename(image.filename)
    fs.writeFileSync(
      path.join(dirname, newImageFilename),
      await download(image.filename)
    )
    body = body.replace(
      image.match,
      `![${image.alt}](./${newImageFilename}${
        image.title ? ` "${image.title}"` : ''
      })`
    )
  }

  if (insertTitleToFrontMatter) {
    attributes.title = title
  }
  const frontmatterText =
    Object.keys(attributes).length === 0
      ? ''
      : [
          '---',
          ...Object.keys(attributes).map(key => `${key}: "${attributes[key]}"`),
          '---',
          ''
        ].join('\n')
  fs.writeFileSync(fullPath, frontmatterText + body)
}

try {
  run()
} catch (err) {
  core.setFailed((err as Error).message)
}
