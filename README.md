<p align="center">
  <a href="https://github.com/eunjae-lee/issue-to-markdown/actions"><img alt="typescript-action status" src="https://github.com/eunjae-lee/issue-to-markdown/workflows/build-test/badge.svg"></a>
</p>

# issue-to-markdown

> GitHub Action to monitor and convert issues into markdown files within your repository.

How do you edit and manage your markdown files within your repository?

- `git pull`
- (merge conflicts)
- edit files
- `git commit`
- `git push`
- 😫

What if you could automatically convert GitHub Issues into markdown files, allowing you to write using just a browser?

## Usage

Create a file `.github/workflows/issue-to-markdown.yml` (or any filename) in your repository.

```yml
on:
  issues:
    types:
      - labeled

jobs:
  issue_to_markdown:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
      - uses: eunjae-lee/issue-to-markdown@v0
        with:
          token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'docs: update contents'
```

If you add a `publish` label to any of your issues, this workflow will be activated.

## How It Works

<details>
<summary>
For those unfamiliar with GitHub Actions, here's a breakdown of the process:
</summary>

1. In this step, the repository is cloned. A personal access token must be provided as token to allow the workflow to commit and push changes to the remote.

```yml
- uses: actions/checkout@v3
  with:
    token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
```

2. In this step, the issue is transformed into a markdown file, located in its own folder (default location: `content/<slug or issue_number>/index.md`). The token is also necessary here.

```yml
- uses: eunjae-lee/issue-to-markdown@v0
  with:
    token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
```

3. In this step, changes are committed and pushed to the remote. For more information on customizing the commit, refer to [this](https://github.com/stefanzweifel/git-auto-commit-action).

```yml
- uses: stefanzweifel/git-auto-commit-action@v4
  with:
    commit_message: 'docs: update contents'
```
</details>

## Personal Access Token

