import Koa from 'koa';
import fs from 'fs';
import path from 'path';
const __dirname = new URL('.', import.meta.url).pathname
const app = new Koa();
app.use(async (ctx) => {
    const { url } = ctx.request;
    if (/\/\b(\w+)$/.test(url)) {
      const name = /\/\b(\w+)$/.exec(url)[1]
      if (/\.(t|j)s$/.test(ctx.request.header.referer)) {
        const p = path.join(__dirname, '/dist/' + name + '.js');
        ctx.type = 'application/javascript';
        ctx.body = rewriteImport(fs.readFileSync(p, 'utf8'));
      } else {
        ctx.type = 'text/html';
        ctx.body = fs.readFileSync(path.join(__dirname, `./src/${name}.html`), 'utf8');
      }
    }
    else if (url === '/') {
        ctx.type = 'text/html';
        ctx.body = fs.readFileSync(path.join(__dirname, './index.html'), 'utf8');
    }
    else if (url.endsWith('.js')) {
        const p = path.join(__dirname, url);
        ctx.type = 'application/javascript';
        ctx.body = rewriteImport(fs.readFileSync(p, 'utf8'));
    }
    else if (url.endsWith('.ts')) {
        const p = path.join(__dirname, '/dist' + url.replace(/ts$/, 'js'));
        ctx.type = 'application/javascript';
        ctx.body = rewriteImport(fs.readFileSync(p, 'utf8'));
    }
    else if (url.startsWith('/@modules')) {
        // 以modules开头说明这是模块替换结果的加载
        const moduleName = url.replace('/@modules/', '');
        // node_modules目录中去查找，此时在node_modules获取到了对应包名的路径
        const prefix = path.join(__dirname, './node_modules', moduleName);
        // 在对应包中的package.json中获取module字段对应的值，因为module字段对应的值为打包后的js文件
        const module = require(prefix + '/package.json').module;
        // 拼接前缀与对应的模块，此时就获取到对应包名所打包的那个文件
        const filePath = path.join(prefix, module);
        // 读取对应的文件
        const ret = fs.readFileSync(filePath, 'utf8');
        ctx.type = 'application/javascript';
        ctx.body = rewriteImport(ret);
    }
});
// 模块地址重写
function rewriteImport(content) {
    // 把所读取的文件内容的模块,进行更改
    // 把以.或者..开头，.或者..结尾中间的内容进行匹配 
    // s1是匹配的部分，s2是分组的内容
    return content.replace(/ from ['"](.*)['"]/g, (s1, s2) => {
        // 如果是以./ / ../开头的话，则直接进行返回所匹配的内容
        // console.log(60, s2, "-----");
        if (s2.startsWith('./') || s2.startsWith('/') || s2.startsWith('../'))
            return s1;
        // 否则就返回对应modules的对应路径
        else
            return ` from '/@modules/${s2}'`;
    });
}
app.listen(7001, () => {
    console.log('This is demo_serve');
});
// 替换后的样子
// // localhost:3000/App.vue
// import { updateStyle } from "/@hmr"
// // 抽出 script 逻辑
// const __script = {
//   data: () => ({ count: 0 }),
// }
// // 将 style 拆分成 /App.vue?type=style 请求，由浏览器继续发起请求获取样式
// updateStyle("c44b8200-0", "/App.vue?type=style&index=0&t=1588490870523")
// __script.__scopeId = "data-v-c44b8200" // 样式的 scopeId
// // 将 template 拆分成 /App.vue?type=template 请求，由浏览器继续发起请求获取 render function
// import { render as __render } from "/App.vue?type=template&t=1588490870523&t=1588490870523"
// __script.render = __render // render 方法挂载，用于 createApp 时渲染
// __script.__hmrId = "/App.vue" // 记录 HMR 的 id，用于热更新
// __script.__file = "/XXX/web/vite-test/App.vue" // 记录文件的原始的路径，后续热更新能用到
// export default __script
//# sourceMappingURL=demo_serve.js.map