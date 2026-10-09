# Release Docs

## Repository Tasks

1. Verify Git working tree is clean
2. Choose a new version tag that's not taken
3. Write the new version on CHANGELOG.md, documenting all notable changes.
4. Update the version number on package.json
5. Wrap the completed tasks blob with the version on the Roadmap
6. Commit everything with `docs: prepare v{VERSION} release`.
7. Push `main` to Github
8. Run

  ```bash
  git tag -a v{VERSION} -m "Web Jam v{VERSION}"
  git push origin v{VERSION}
  ```

## Outreach Tasks (draft)

- For major versions, write a blog post and/or make a video.
- Consider a newsletter and social media posts.

