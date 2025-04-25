# vite-plugin-mock-zhiniu

一个用于 Vite 的 API 模拟插件，支持 TypeScript 和多种响应格式。

## 特性

- 🚀 支持 TypeScript 类型定义
- 🔄 支持多种响应格式（对象、函数）
- 📦 零配置，开箱即用
- 🛡️ 内置错误处理
- 🔍 自动添加 mock 标记

## 安装

```bash
# 使用 npm
npm install vite-plugin-mock-zhiniu --save-dev

# 使用 yarn
yarn add vite-plugin-mock-zhiniu --dev

# 使用 pnpm
pnpm add vite-plugin-mock-zhiniu --save-dev
```

## 使用方法

1. 在 `vite.config.ts` 中配置插件：

```typescript
import { defineConfig } from 'vite';
import mockPlugin from 'vite-plugin-mock-zhiniu';

export default defineConfig({
  plugins: [
    mockPlugin({
      routerMap: {
        '/api/user': {
          default: {
            name: 'John Doe',
            age: 30
          }
        },
        '/api/login': {
          default: async (req, res) => {
            // 处理登录逻辑
            return {
              token: 'mock-token',
              user: {
                id: 1,
                name: 'John Doe'
              }
            };
          }
        }
      }
    })
  ]
});
```

2. 在代码中使用：

```typescript
// 发起请求
const response = await fetch('/api/user');
const data = await response.json();

console.log(data); // { name: 'John Doe', age: 30, isMock: true }
```

## 配置选项

### routerMap

类型：`Record<string, RouterMapValue>`

路由映射配置，key 为 API 路径，value 为响应内容。

响应内容可以是以下格式：

```typescript
export default {
    // 直接对象：
    '/api/user/login': {
        code: 0,
        data: {
            token: '1234567890',
        },
    },
    // 函数
    '/api/user/login1': {
        default:()=>{
            return {
                code: 0,
                data: {
                    token: '11111',
                },
            }
        }
    },
    // 异步函数
    '/api/user/login2': {
        default:async()=>{
            return new Promise((resolve)=>{
                setTimeout(()=>{
                    resolve({
                        code: 0,
                        data: {
                            token: '22222',
                        },
                    })
                },1000)
            })
        }
    },
    // 获取请求的body，和url中的query数据
    '/api/user/login3': {
        default:(req)=>{
            return {
                code: 0,
                data: {
                    token: '33333',
                    // POST 请求 body 体参数
                    ...req.body,
                    // 获得 url query 参数
                    ...req.query
                },
            }
        }
    },
    "/api/user/login4": require('./api/user/login4.js'),
}

```

## 开发

```bash
# 安装依赖
bun install

# 开发模式（监听文件变化）
bun run dev

# 构建
bun run build

# 类型检查
bun run type-check
```

## 许可证

MIT
