import {mkdirp} from 'mkdirp'
import * as core from '@actions/core'
import * as github from '@actions/github'
import frontmatter from 'front-matter'
import fs from 'fs'
import path from 'path'
import {simpleGit} from 'simple-git'

async function run(): Promise<void> {
  const destPath: string = core.getInput('dest')
  const githubToken: string = core.getInput('github_token')
  const extension: string = core.getInput('extension')
  const commitPrefix: string = core.getInput('commit_prefix')
  const slugAsFolderName: boolean = core.getBooleanInput('slug_as_folder_name')
  console.log('TEST', {
    destPath,
    githubToken,
    extension,
    commitPrefix,
    slugAsFolderName,
    GITHUB_ACTOR: process.env.GITHUB_ACTOR,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY
  })

  const issue = github.context.payload.issue
  if (!issue) {
    core.setFailed('This Action works only from the `issue` triggers.')
    return
  }

  const {
    attributes: {slug}
  } = frontmatter<{slug: string}>(issue.body || '')

  const relativePath = path.join(
    destPath,
    slugAsFolderName ? slug || String(issue.number) : String(issue.number),
    `index${extension}`
  )
  const fullPath = path.resolve(relativePath)
  mkdirp.sync(path.dirname(fullPath))
  fs.writeFileSync(fullPath, issue.body || '')

  const ORGANIZATION_DOMAIN = 'github.com'
  const {GITHUB_ACTOR, GITHUB_TOKEN, GITHUB_REPOSITORY} = process.env

  const git = simpleGit()
  git
    .addRemote(
      'origin',
      `https://${GITHUB_ACTOR}:${
        githubToken || GITHUB_TOKEN
      }@${ORGANIZATION_DOMAIN}/${GITHUB_REPOSITORY}`
    )
    .addConfig('user.name', GITHUB_ACTOR || 'github-actions')
    .addConfig(
      'user.email',
      `${GITHUB_ACTOR}@users.noreply.${ORGANIZATION_DOMAIN}`
    )
    .add('./*')
    .commit(`${commitPrefix} update ${relativePath}`)
    .push('origin', 'main')
}

run()
