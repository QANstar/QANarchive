# ─── 构建阶段 ───
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# 关闭遥测与 logo,加快 SDK 首次执行
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1
# 只拷贝 csproj → 恢复依赖(层缓存:依赖不变则跳过)
COPY *.csproj .
RUN dotnet restore
COPY . .
# --no-restore:恢复已在上一层完成,避免 publish 重复还原
RUN dotnet publish -c Release --no-restore -o /app/publish

# ─── 运行阶段 ───
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "QANgalleryServer.dll"]
