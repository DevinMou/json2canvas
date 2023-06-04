import fs from 'fs'
import path from 'path'
import process from 'process'
const __dirname = path.join(new URL('.', import.meta.url).pathname, '../')
const args = process.argv.slice(2)
const pathIndex = args.indexOf('--path')
const pathArg = pathIndex !== -1 ? args[pathIndex + 1] : ''
const dirPath = pathArg || path.join(__dirname, 'dist/src')

function replaceInFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const newContent = content.replace(/from\s+['"]([^'"]+)['"]/g, (_, match) => {
    const replacePath = path.join(filePath.replace(/\/[^\/]+\.js$/, ''), match).slice(__dirname.length + 4)
    // console.log(10, match, replacePath)
    return `from '${replacePath}'`
  })
  fs.writeFileSync(filePath, newContent)
}

function replaceInDir(dirPath: string) {
  if (dirPath.endsWith('.js')) {
    replaceInFile(dirPath)
  } else {
    const files = fs.readdirSync(dirPath)
    files.forEach(file => {
      const filePath = path.join(dirPath, file)
      if (fs.statSync(filePath).isDirectory()) {
        replaceInDir(filePath)
      } else if (path.extname(file) === '.js') {
        replaceInFile(filePath)
      }
    })
  }
}

replaceInDir(dirPath)
