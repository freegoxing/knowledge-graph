# 使用官方的 Node.js 20 作为基础镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 从根目录复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 安装所有依赖
RUN npm install

# 复制服务端代码
COPY server/ ./server/

# 设置服务端工作目录
WORKDIR /app/server

# 暴露后端服务端口
EXPOSE 3001

# 启动后端服务的命令
CMD [ "node", "server.js" ]