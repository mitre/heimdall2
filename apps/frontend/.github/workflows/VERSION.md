name: Generate VERSION.md
on:
  push:
    # branches to consider in the event; optional, defaults to all
    branches:
      - master
jobs:
  test:
    name: Generate VERSION.md
    runs-on: ubuntu-latest
    steps:
      - name: Checkout heimdall-vuetify
        uses: actions/checkout@v1  
        with:
          token: ${{secrets.GITHUB_TOKEN}}   
      - name: Get information for VERSION.md
        run: |
          git pull origin master
          echo "**Release:** " > VERSION.md
          git describe --tags $(git rev-list --tags --max-count=1) >> VERSION.md
          echo "<br><br>**Date:** " >> VERSION.md
          git show -s --format=%ci $(git rev-list --tags --max-count=1) >> VERSION.md
          echo "<br><br>**Commit:** " >> VERSION.md
          git rev-list --tags --max-count=1 >> VERSION.md
      - name: Commit and push changes to VERSION.md
        uses: github-actions-x/commit@v2.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          push-branch: 'master'
          commit-message: 'Publish version information'
          force-add: 'true'
        env:
          CI: true