import {mkdirp} from 'mkdirp'
import * as core from '@actions/core'
import * as github from '@actions/github'
import matter from 'gray-matter'
import {parse, stringify} from 'yaml'
import fs from 'fs'
import path from 'path'
import download from 'download'
import dayjs from 'dayjs'
import {extractImages} from './extract-images'
import {formatFrontMatterValue} from './format'
import sharp from 'sharp'
import {fileTypeFromBuffer} from 'file-type'

async function run(): Promise<void> {
  const token: string = core.getInput('token')
  const destPath: string = core.getInput('dest')
  const publishLabel: string = core.getInput('label')
  const extension: string = core.getInput('extension')
  const slugAsFolderName: boolean = core.getBooleanInput('slug_as_folder_name')
  const slugKey: string = core.getInput('slug_key')
  const injectTitle: boolean = core.getBooleanInput('inject_title')
  const injectTitleKey: string = core.getInput('inject_title_key')
  const authors: string[] = core.getMultilineInput('authors')

  const useCustomPath: boolean = core.getBooleanInput('use_custom_path')
  const useCustomPathKey: string = core.getInput('use_custom_path_key')

  const injectCreatedAt: boolean = core.getBooleanInput('inject_created_at')
  const injectCreatedAtKey: string = core.getInput('inject_created_at_key')
  const injectCreatedAtFormat: string = core.getInput(
    'inject_created_at_format'
  )
  const injectCreatedAtAsString: boolean = core.getBooleanInput(
    'inject_created_at_as_string'
  )

  const injectUpdatedAt: boolean = core.getBooleanInput('inject_updated_at')
  const injectUpdatedAtKey: string = core.getInput('inject_updated_at_key')
  const injectUpdatedAtFormat: string = core.getInput(
    'inject_updated_at_format'
  )
  const injectUpdatedAtAsString: boolean = core.getBooleanInput(
    'inject_updated_at_as_string'
  )

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
  const fullPath = useCustomPath
    ? attributes[useCustomPathKey]
    : path.join(destPath, folderName, `index${extension}`)
  const dirname = path.dirname(fullPath)

  if (!fs.existsSync(dirname)) {
    mkdirp.sync(dirname)
  }

  let bodyText = bodyWithoutFrontMatter
  const images = extractImages(bodyText)
  for (const image of images) {
    let newImageFilename = path.basename(image.filename)
    fs.writeFileSync(
      path.join(dirname, newImageFilename),
      await download(image.filename)
    )

    const imagePath = path.join('./', newImageFilename)
    const imageExt = path.extname(image.filename).toLocaleLowerCase()

    if (imageExt === '') {
      const buffer = fs.readFileSync(imagePath)
      const imageType = await fileTypeFromBuffer(buffer)
      sharp.cache(false)

      if (
        imageType !== undefined &&
        sharp.format.hasOwnProperty(imageType?.ext)
      ) {
        if (imageType.ext === 'gif') {
          await sharp(`./${newImageFilename}`, {
            limitInputPixels: false,
            animated: true,
            density: 1
          }).toFile(`newImageFilename.${imageType.ext}`)
        } else {
          await sharp(`./${newImageFilename}`).toFile(
            `newImageFilename.${imageType.ext}`
          )
        }
        newImageFilename += `.${imageType.ext}`
        fs.unlinkSync(imagePath)
      }
    }
    bodyText = bodyText.replace(
      image.match,
      `![${image.alt}](./${newImageFilename}${
        image.title ? ` "${image.title}"` : ''
      })`
    )
  }

  if (injectTitle) {
    attributes[injectTitleKey] = title
  }

  if (injectCreatedAt) {
    attributes[injectCreatedAtKey] =
      injectCreatedAtFormat === 'ISO'
        ? dayjs(issue.created_at).toISOString()
        : dayjs(issue.created_at).format(injectCreatedAtFormat)
  }

  if (injectUpdatedAt) {
    attributes[injectUpdatedAtKey] =
      injectUpdatedAtFormat === 'ISO'
        ? dayjs(issue.updated_at).toISOString()
        : dayjs(issue.updated_at).format(injectUpdatedAtFormat)
  }

  const frontmatterText =
    Object.keys(attributes).length === 0
      ? ''
      : [
          '---',
          ...Object.keys(attributes).map(key => {
            const value = attributes[key]
            let formattedValue
            if (typeof value === 'object' && value instanceof Date) {
              formattedValue = attributesWithoutDateProcessing[key]
            } else if (
              injectCreatedAt &&
              key === injectCreatedAtKey &&
              !injectCreatedAtAsString
            ) {
              formattedValue = value
            } else if (
              injectUpdatedAt &&
              key === injectUpdatedAtKey &&
              !injectUpdatedAtAsString
            ) {
              formattedValue = value
            } else {
              formattedValue = formatFrontMatterValue(
                attributes[key],
                attributesWithoutDateProcessing[key]
              )
            }
            return `${key}: ${formattedValue}`
          }),
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
