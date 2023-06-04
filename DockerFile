# syntax=docker/dockerfile:1

# 项目相关
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# nginx 
FROM nginx

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]