import { ContributorsAccumulator, landedPullRequests, prCloseNumbers } from '@angularians/shared'
import { collectActivity } from './activity.ts'
import { collectAdvisories } from './advisories.ts'
import { collectDiscussions } from './discussions.ts'
import { gitCommits } from './commits.ts'
import { parseConfig } from './config.ts'
import { emptyStats, writeData, writePart, type Collected } from './finalize.ts'
import { restPulls, searchPulls } from './pulls.ts'

const config = parseConfig(process.argv.slice(2), process.env)
const now = new Date()
console.log(`Collecting ${config.repos.map(r => `${r.owner}/${r.name}`).join(', ')}${config.since ? ` since ${config.since.toISOString()}` : ', full history'} (PRs from ${config.pulls}${config.activity ? ', with issues, comments and review comments' : ', landed PRs only'})${config.part ? ', as a part' : ''}`)

const accumulator = new ContributorsAccumulator(now)
const stats = emptyStats()

for (const repo of config.repos) {
  const fullName = `${repo.owner}/${repo.name}`
  const [pulls, commits] = await Promise.all([
    config.pulls === 'rest' ? restPulls(repo, config.since) : searchPulls(repo, config.since, now),
    gitCommits(fullName, config.cacheDir, config.since),
  ])
  const repoLanded = landedPullRequests(pulls, commits, fullName)
  const merged = new Set(pulls.filter(pull => pull.merged_at).map(pull => pull.number))
  for (const commit of commits) {
    const numbers = prCloseNumbers(commit.message)
    if (numbers.length) stats.prCloseCommits++
    if (numbers.length > 1) stats.multiPrCommits++
  }
  stats.pulls += pulls.length
  stats.commits += commits.length
  stats.landedMerged += repoLanded.filter(pull => merged.has(pull.number)).length
  stats.landedByPrClose += repoLanded.filter(pull => !merged.has(pull.number)).length
  stats.landedPullRequests += repoLanded.length
  for (const pull of repoLanded) accumulator.addLandedPullRequest(pull)
  console.log(`${fullName}: ${pulls.length} closed PRs, ${commits.length} commits, ${repoLanded.length} landed PRs`)

  if (config.activity) {
    const activity = await collectActivity(repo, config.since, accumulator)
    stats.issues += activity.issues
    stats.comments += activity.comments
    stats.reviewComments += activity.reviewComments
    stats.activityPages += activity.pages
    console.log(`${fullName}: ${activity.issues} issues, ${activity.comments} comments, ${activity.reviewComments} review comments (${activity.pages} pages)`)
    // GitHub Discussions (such as angular/angular's RFCs): scored as issues and comments.
    const discussions = await collectDiscussions(repo, config.since, accumulator)
    stats.discussions += discussions.discussions
    stats.discussionComments += discussions.discussionComments
    console.log(`${fullName}: ${discussions.discussions} discussions, ${discussions.discussionComments} discussion comments (of ${discussions.read} discussions, ${discussions.readComments} comments read)`)
  }
}

if (config.advisories) {
  const advisories = await collectAdvisories(config.since, accumulator)
  stats.advisories = advisories.advisories
  console.log(`Security advisories: ${advisories.advisories}, ${advisories.reported} of them with a reporter`)
}

const collected: Collected = {
  repos: config.repos.map(r => `${r.owner}/${r.name}`),
  collectedAt: now.toISOString(),
  since: config.since?.toISOString() ?? null,
  activity: config.activity,
  files: accumulator.records(),
  packages: accumulator.packages(),
  stats,
}

if (config.part) await writePart(config.outputDir, collected)
else await writeData(config.outputDir, collected, { profiles: config.profiles })
