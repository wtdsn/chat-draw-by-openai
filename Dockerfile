# syntax=docker/dockerfile:1

# 项目相关
FROM node:18.16-alpine

# 指定工作目录
WORKDIR /app
# 移动项目
COPY . .

# 在工作目录中执行，根目录可能有问题
RUN npm install
RUN npm run build

# nginx 
FROM nginx

# 保留第一阶段文件
COPY --from=0 /app /app

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/nginx.conf


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
