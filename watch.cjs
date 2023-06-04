const fs = require('fs')
const { spawn } = require('child_process')

const tsc = spawn('tsc', ['--watch'])
let inited = 0
let tsChange = 0
const changePaths = []
const checkChangePaths = () => {
  if (changePaths.length) {
    const item = changePaths.shift()
    spawn('node', ['dist/replace_path.js', '--path', item]).stdout.on('close', () => {
      checkChangePaths()
    })
  } else {
    tsChange = 0
  }
}
tsc.stdout.on('data', data => {
  const info = data.toString()
  console.log(9, info)
  if (info.includes('File change detected')) {
    tsChange = 1
  } else if (info.includes('Watching for file changes')) {
    tsChange = 1
    if (!inited) {
      spawn('node', ['dist/replace_path.js'])
      tsChange = 0
      fs.watch('dist/src', { recursive: true }, async (eventType, filename) => {
        if (filename.endsWith('.js')) {
          const path = __dirname + '/dist/src/' + filename
          console.log(21, tsChange, path)
          if (tsChange && !changePaths.includes(path)) {
            changePaths.push(path)
            checkChangePaths()
          }
        }
      })
      inited = true
    }
  }
})

tsc.stderr.on('data', data => {
  console.error(11, data.toString())
})
