import {mkdirp} from 'mkdirp'
import * as core from '@actions/core'
import * as github from '@actions/github'
import matter from 'gray-matter'
import {parse, stringify} from 'yaml'
import fs from 'fs'
import path from 'path'
import download from 'download'
import {extractImages} from './extract-images'
import {formatFrontMatterValue} from './format'

async function run(): Promise<void> {
  const token: string = core.getInput('token')
  const destPath: string = core.getInput('dest')
  const publishLabel: string = core.getInput('label')
  const extension: string = core.getInput('extension')
  const slugAsFolderName: boolean = core.getBooleanInput('slug_as_folder_name')
  const slugKey: string = core.getInput('slug_key')
  const insertTitleToFrontMatter: boolean = core.getBooleanInput(
    'insert_title_to_front_matter'
  )
  const titleKey: string = core.getInput('title_key')
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
    console.log(
      `This Action requires the label(\`${publishLabel}\`) in the issue.`
    )
    return
  }

  const body = issue.body || ''
  const {data: attributes, content: bodyWithoutFrontMatter} = matter(body)
  const {data: attributesWithoutDateProcessing} = matter(body, {
    engines: {
      yaml: {
        parse,
        stringify
      }
    }
  })

  const folderName =
    slugAsFolderName === true && attributes[slugKey]
      ? attributes[slugKey]
      : String(issue.number)
  const fullPath = path.join(destPath, folderName, `index${extension}`)
  const dirname = path.dirname(fullPath)
  fs.rmSync(dirname, {recursive: true, force: true})
  mkdirp.sync(dirname)

  let bodyText = bodyWithoutFrontMatter
  const images = extractImages(bodyText)
  for (const image of images) {
    const newImageFilename = path.basename(image.filename)
    fs.writeFileSync(
      path.join(dirname, newImageFilename),
      await download(image.filename)
    )
    bodyText = bodyText.replace(
      image.match,
      `![${image.alt}](./${newImageFilename}${
        image.title ? ` "${image.title}"` : ''
      })`
    )
  }

  if (insertTitleToFrontMatter) {
    attributes[titleKey] = title
  }
  const frontmatterText =
    Object.keys(attributes).length === 0
      ? ''
      : [
          '---',
          ...Object.keys(attributes).map(
            key =>
              `${key}: ${formatFrontMatterValue(
                attributes[key],
                attributesWithoutDateProcessing[key]
              )}`
          ),
          '---',
          '',
          ''
        ].join('\n')
  fs.writeFileSync(fullPath, frontmatterText + bodyText)
}

try {
  run()
} catch (err) {
  core.setFailed((err as Error).message)
}
