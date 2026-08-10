# ─── 构建阶段 ───
FROM node:22-alpine AS build
WORKDIR /app
# 只拷贝依赖清单 → npm ci(层缓存:依赖不变则跳过,ci 比 install 快且确定)
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# ─── 运行阶段 ───
FROM nginx:1.28-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
