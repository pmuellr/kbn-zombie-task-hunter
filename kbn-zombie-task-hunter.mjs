#!/usr/bin/env node

// import fs from 'node:fs'
import path from 'node:path'

main()

async function main() {
  // get cli arguments, read and generate config
  const esUrl = process.argv[2]
  if (!esUrl) {
    console.log(getHelp())
    process.exit()
  }

  start(esUrl)
}

/** @type { (esUrl: string) => Promise<void> } */
async function start(esUrl) {
  const taskInfo = await getTasks(esUrl)
  const ruleInfo = await getRules(esUrl)

  /** @type { {taskId : string, taskIndex: string }[] } */
  const disableTasks = []

  for (const [taskId, { index, ruleId, enabled }] of taskInfo) {

    const rule = ruleInfo.get(ruleId)
    if (!rule) {
      // console.log(`rule not found for task ${taskId}: ruleId: ${ruleId}`)
      continue
    }

    if (rule.taskId !== taskId) {
      if (rule.enabled) {
        console.log(`task ${taskId}'s enabled  rule points to a different task: ruleId: ${ruleId}, rule's taskId: ${rule.taskId}`)
      } else {
        console.log(`task ${taskId}'s disabled rule points to a different task: ruleId: ${ruleId}, rule's taskId: ${rule.taskId}`)
      }

      disableTasks.push({ taskId, taskIndex: index })
    }
  }

  if (disableTasks.length === 0) {
    console.log('no zombie tasks')
    return
  }

  console.log('')
  console.log(`Found ${disableTasks.length} task documents to delete via Dev Tools.`)
  console.log(`For elastic stack >= 9, use a user with the "kibana_system" role.`)
  console.log('')

  console.log(`POST /_bulk`)
  for (const { taskId, taskIndex } of disableTasks) {
    console.log(`{ "delete" : { "_id" : "${taskId}", "_index": "${taskIndex}" } }`)
  }
}

/** @type { (esUrl: string) => Promise<Map<string, { index: string, ruleId: string, enabled: boolean }>> } */
async function getTasks(esUrl) {
  /** @type { Map<string, { index: string, ruleId: string, enabled: boolean }> } */
  const result = new Map()

  const res = await search(esUrl, '.kibana,.kibana_task_manager/_search', {
    // to allow more, we'll have to use a PIT-based search
    size: 10000,
    _source: [
      'task.taskType',
      'task.params',
      'task.enabled',
    ],
    query: {
      bool: {
        filter: [
          { term: { type: 'task' } },
          { regexp: { 'task.taskType': { value: 'alerting:.*' } } }
        ]
      }
    }
  })
  
  for (const hit of res?.hits?.hits || []) {
    // console.log(JSON.stringify(hit))
    const id = hit._id
    const index = hit._index
    const enabled = hit._source?.task?.enabled || false
    const paramsEncoded = hit._source?.task?.params || '{"alertId": undefined}'
    const params = JSON.parse(paramsEncoded)
    const ruleId = `alert:${params.alertId}`

    result.set(id, { index, ruleId, enabled })
  }

  // console.log(JSON.stringify(Array.from(result.entries()), null, 4))
  return result
}

/** @type { (esUrl: string) => Promise<Map<string, { taskId?: string, enabled: boolean }>> } */
async function getRules(esUrl) {
  /** @type { Map<string, { taskId?: string, enabled: boolean }> } */
  const result = new Map()

  const res = await search(esUrl, '.kibana,.kibana_alerting_cases/_search', {
    // to allow more, we'll have to use a PIT-based search
    size: 10000,
    _source: [
      'alert.enabled',
      'alert.scheduledTaskId',
    ],
    query: {
      bool: {
        filter: [
          { term: { type: 'alert' } },
        ]
      }
    }
  })

  for (const hit of res?.hits?.hits || []) {
    const id = hit._id
    const enabled = hit._source?.alert?.enabled || false

    if (hit._source?.alert?.scheduledTaskId) {
      const taskId = `task:${hit._source.alert.scheduledTaskId}`
      result.set(id, { taskId, enabled })
    } else {
      result.set(id, { enabled })
    }

  }

  // console.log(JSON.stringify(Array.from(result.entries()), null, 4))
  return result
}

/** @type { (esUrl: string, urlPath: string, query:any) => Promise<any> } */
async function search(esUrl, urlPath, query) {
  const { url, authHeader } = splitUrl(esUrl)

  const headers = new Headers()
  headers.append("Content-Type", "application/json")

  if (authHeader) {
    headers.append("Authorization", authHeader)  
  }

  const finalUrl = path.join(url, urlPath)
  const req = new Request(finalUrl, {
    method: "POST",
    body: JSON.stringify(query),
    headers: headers,
  })

  const res = await fetch(req)
  return await res.json()
}

/** @type { (esUrl: string) => { url: string, authHeader: string } } */
function splitUrl(esUrl) {
  const u = URL.parse(esUrl)
  if (!u) {
    throw new Error(`invalid URL: "${esUrl}"`)
  }

  const url = `${u.protocol}//${u.host}${u.pathname}${u.search}`

  if (!u.username || !u.password) {
    const authHeader = ''
    return { url, authHeader}
  }

  if (u.username?.toUpperCase() === 'APIKEY') {
    const authHeader = `ApiKey ${u.password}`
    return { url, authHeader }
  }

  const encodedAuth = Buffer
    .from(`${u.username}:${u.password}`)
    .toString('base64')
  const authHeader = `Basic ${encodedAuth}`
  return { url, authHeader }
}

/** @type { () => string } */
function getHelp() {
  const thisFile = new URL(import.meta.url).pathname
  const thisModule = path.basename(thisFile)
  return `
${thisModule} <es-url>

Will analyze Kibana alerting rules and their tasks to ensure everything
is consistent.

The es-url should be of the form:
   http(s)://<userid>:<password>@<hostname>:<port>
   http(s)://APIKEY:<apikey>@<hostname>:<port>
  `.trim()
}
