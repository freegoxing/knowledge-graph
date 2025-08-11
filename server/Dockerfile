# 使用官方的 Node.js 20 作为基础镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app/server

# 将 server/package.json 和 package-lock.json (如果存在) 复制到工作目录
# 注意：我们需要从根目录的 package.json 获取依赖信息
COPY ../package.json ../package-lock.json /app/

# 安装项目依赖
RUN npm install --prefix /app

# 将后端代码复制到容器中
COPY . .

# 暴露后端服务端口
EXPOSE 3001

# 启动后端服务的命令
CMD [ "node", "server.js" ]
