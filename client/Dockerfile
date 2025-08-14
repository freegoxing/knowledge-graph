# ---- Build Stage ----
# 使用官方 Node.js 20 镜像作为构建环境
FROM node:20-slim as builder

# 设置工作目录
WORKDIR /app

# 复制根目录的 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 安装所有依赖
RUN npm install

# 复制客户端代码
COPY client/ ./client/

# 执行构建命令
# build 脚本在 package.json 中定义，会使用正确的配置文件
RUN npm run build

# ---- Production Stage ----
# 使用轻量级的 Nginx 镜像作为生产环境
FROM nginx:alpine

# 将构建产物从构建阶段复制到 Nginx 的静态文件目录
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 Nginx 端口
EXPOSE 80

# 启动 Nginx 服务器
CMD ["nginx", "-g", "daemon off;"]