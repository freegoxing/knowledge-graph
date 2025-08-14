#!/bin/bash

# Nginx 部署脚本

# 检查是否以 root 身份运行
if [ "$(id -u)" -ne 0 ]; then
    echo "❌ 请以 root 身份运行此脚本。"
    exit 1
fi

# 提示用户输入域名
read -p "请输入你的域名 (例如: your_domain.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ 域名不能为空。"
    exit 1
fi

# 项目的绝对路径 (假设脚本在项目根目录运行)
PROJECT_PATH=$(pwd)

# Nginx 配置文件模板
NGINX_CONF_TEMPLATE="server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $PROJECT_PATH/client/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)\$ {
        expires 30d;
        access_log off;
    }
}"

# Nginx 配置文件路径
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available/$DOMAIN"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"

# 创建 Nginx 配置文件
echo "✅ 正在创建 Nginx 配置文件..."

echo "$NGINX_CONF_TEMPLATE" > "$NGINX_SITES_AVAILABLE"

# 创建软链接到 sites-enabled
if [ -L "$NGINX_SITES_ENABLED" ]; then
    rm "$NGINX_SITES_ENABLED"
fi
ln -s "$NGINX_SITES_AVAILABLE" "$NGINX_SITES_ENABLED"

echo "✅ 配置文件已创建并链接。"

# 测试 Nginx 配置
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置测试通过。"
    # 重启 Nginx 服务
    systemctl reload nginx
    echo "✅ Nginx 已成功重启。"
    echo "🚀 部署完成！请访问 http://$DOMAIN"
else
    echo "❌ Nginx 配置错误，请检查 $NGINX_SITES_AVAILABLE 文件。"
    exit 1
fi
