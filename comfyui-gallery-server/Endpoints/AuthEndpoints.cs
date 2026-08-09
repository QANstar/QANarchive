using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Data;
using QANgalleryServer.DTOs;
using QANgalleryServer.Models;
using QANgalleryServer.Services;

namespace QANgalleryServer.Endpoints;

public static class AuthEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        // POST /api/auth/register — 邀请码注册
        group.MapPost("/register", async (
            AppDbContext db,
            PasswordService passwordService,
            JwtService jwtService,
            IConfiguration config,
            RegisterRequest req) =>
        {
            var inviteCode = config.GetValue<string>("InviteCode") ?? "";
            if (string.IsNullOrWhiteSpace(req.InviteCode) || req.InviteCode != inviteCode)
                return Results.BadRequest(new { error = "邀请码无效" });

            if (string.IsNullOrWhiteSpace(req.Account) || req.Account.Length < 3 || req.Account.Length > 50)
                return Results.BadRequest(new { error = "账号长度需为 3-50 个字符" });
            if (string.IsNullOrWhiteSpace(req.UserName) || req.UserName.Length > 50)
                return Results.BadRequest(new { error = "用户名不能为空且不超过 50 字符" });
            if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
                return Results.BadRequest(new { error = "密码至少 6 位" });

            var exists = await db.Users.AnyAsync(u => u.Account.ToLower() == req.Account.ToLower());
            if (exists)
                return Results.Conflict(new { error = "账号已存在" });

            var user = new User
            {
                Account = req.Account.Trim(),
                UserName = req.UserName.Trim(),
                PasswordHash = passwordService.HashPassword(req.Password)
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var token = jwtService.GenerateToken(user.Id, user.UserName);
            return Results.Ok(new AuthResponse(token, new UserInfo(user.Id, user.Account, user.UserName)));
        });

        // POST /api/auth/login
        group.MapPost("/login", async (
            AppDbContext db,
            PasswordService passwordService,
            JwtService jwtService,
            LoginRequest req) =>
        {
            if (string.IsNullOrWhiteSpace(req.Account) || string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest(new { error = "账号和密码不能为空" });

            var user = await db.Users.FirstOrDefaultAsync(u => u.Account.ToLower() == req.Account.Trim().ToLower());
            if (user == null || !passwordService.VerifyPassword(req.Password, user.PasswordHash))
                return Results.Unauthorized();

            var token = jwtService.GenerateToken(user.Id, user.UserName);
            return Results.Ok(new AuthResponse(token, new UserInfo(user.Id, user.Account, user.UserName)));
        });
    }
}
