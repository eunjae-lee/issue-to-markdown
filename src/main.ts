import {execaCommandSync} from 'execa'
import {mkdirp} from 'mkdirp'
import * as core from '@actions/core'
import * as github from '@actions/github'
import frontmatter from 'front-matter'
import fs from 'fs'
import path from 'path'

function runCommand(command: string): void {
  console.log(execaCommandSync(command).stdout)
}

async function run(): Promise<void> {
  const destPath: string = core.getInput('dest')
  const githubToken: string = core.getInput('github_token')
  const extension: string = core.getInput('extension')
  const commitPrefix: string = core.getInput('commit_prefix')
  const slugAsFolderName: boolean = core.getBooleanInput('slug_as_folder_name')

  const issue = github.context.payload.issue
  if (!issue) {
    core.setFailed('This Action works only from the `issue` triggers.')
    return
  }

  const {
    attributes: {slug}
  } = frontmatter<{slug: string}>(issue.body || '')

  const fullPath = path.resolve(
    destPath,
    slugAsFolderName ? slug : String(issue.number),
    `index${extension}`
  )
  mkdirp.sync(path.dirname(fullPath))
  fs.writeFileSync(fullPath, issue.body || '')

  const ORGANIZATION_DOMAIN = 'github.com'
  const {GITHUB_ACTOR, GITHUB_TOKEN, GITHUB_REPOSITORY} = process.env

  runCommand(
    `git remote set-url origin "https://${GITHUB_ACTOR}:${
      githubToken || GITHUB_TOKEN
    }@${ORGANIZATION_DOMAIN}/${GITHUB_REPOSITORY}"`
  )
  runCommand(`git config --global user.name "${GITHUB_ACTOR}"`)
  runCommand(
    `git config --global user.email "${GITHUB_ACTOR}@users.noreply.${ORGANIZATION_DOMAIN}"`
  )
  runCommand(`git add -A`)
  runCommand(`git commit -m "${commitPrefix} update ${fullPath}"`)
  runCommand(`git push origin main`)
}

run()
