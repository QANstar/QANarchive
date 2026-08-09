using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.Endpoints;
using QANgalleryServer.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── 数据库 (SQLite) ───
var dataDir = builder.Configuration.GetValue<string>("Storage:DataDir") ?? "storage/data";
Directory.CreateDirectory(dataDir);
var dbPath = Path.Combine(dataDir, "app.db");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// ─── JWT 认证 ───
var jwtKey = builder.Configuration.GetValue<string>("Jwt:Key")!;
var jwtIssuer = builder.Configuration.GetValue<string>("Jwt:Issuer")!;
var jwtAudience = builder.Configuration.GetValue<string>("Jwt:Audience")!;
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddAuthorization();

// ─── CORS ───
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ─── 服务注册 ───
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddSingleton<JwtService>();

// ─── 文件上传配置 ───
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 1024L * 1024 * 1024; // 1GB
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 1024L * 1024 * 1024; // 1GB
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
});

var app = builder.Build();

app.UseCors();

// 自动创建/迁移数据库(含容错逻辑)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();
    }
    catch (Microsoft.Data.Sqlite.SqliteException ex) when (ex.Message.Contains("already exists"))
    {
        // 旧 DB 过渡:表已由 EnsureCreated 创建,迁移冲突
        var historyExists = db.Database.SqlQueryRaw<int>(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='__EFMigrationsHistory'")
            .FirstOrDefault();
        if (historyExists == 0)
        {
            db.Database.EnsureCreated();
        }
    }
}

// ─── 静态文件(媒体) ───
var mediaDir = builder.Configuration.GetValue<string>("Storage:MediaDir") ?? "storage/media";
var mediaPath = Path.Combine(Directory.GetCurrentDirectory(), mediaDir);
Directory.CreateDirectory(mediaPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(mediaPath),
    RequestPath = "/media"
});

// ─── 健康检查 ───
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", serverTime = DateTime.UtcNow.ToString("o") }));

// ─── 路由映射 ───
AuthEndpoints.Map(app);
WorksEndpoints.Map(app);
CharactersEndpoints.Map(app);
PartsEndpoints.Map(app);
TagsEndpoints.Map(app);
GalleryEndpoints.Map(app);

app.Run();
