const fs = require('fs')
const { spawn } = require('child_process')

const tsc = spawn('tsc', ['--watch'])
let inited = 0
const changePaths = []
const replacedPaths = []
let replacing = false
const checkChangePaths = () => {
  console.log(10, changePaths.length)
  if (changePaths.length) {
    const item = changePaths.shift()
    replacedPaths.push(item)
    replacing = true
    spawn('node', ['dist/replace_path.js', '--path', item]).stdout.on('close', () => {
      replacing = false
      checkChangePaths()
    })
  }
}
tsc.stdout.on('data', data => {
  const info = data.toString()
  console.log(9, info)
  if (info.includes('File change detected')) {
    replacedPaths.length = 0
  } else if (info.includes('Watching for file changes')) {
    if (!inited) {
      spawn('node', ['dist/replace_path.js']).stdout.on('close', () => {
        fs.watch('dist/src', { recursive: true }, async (eventType, filename) => {
          if (filename.endsWith('.js')) {
            const path = __dirname + '/dist/src/' + filename
            console.log(21, path, replacing, changePaths.length, replacedPaths.length)
            if (!changePaths.includes(path) && !replacedPaths.includes(path)) {
              changePaths.push(path)
              !replacing && checkChangePaths()
            }
          }
        })
      })
      inited = true
    }
  }
})

tsc.stderr.on('data', data => {
  console.error(11, data.toString())
})
