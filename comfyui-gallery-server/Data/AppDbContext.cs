using Microsoft.EntityFrameworkCore;
using QANgalleryServer.Models;

namespace QANgalleryServer.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Character> Characters => Set<Character>();
    public DbSet<Work> Works => Set<Work>();
    public DbSet<Media> Medias => Set<Media>();
    public DbSet<WorkAsset> WorkAssets => Set<WorkAsset>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<CharacterWork> CharacterWorks => Set<CharacterWork>();
    public DbSet<WorkPart> WorkParts => Set<WorkPart>();
    public DbSet<CharacterTag> CharacterTags => Set<CharacterTag>();
    public DbSet<WorkTag> WorkTags => Set<WorkTag>();
    public DbSet<PartTag> PartTags => Set<PartTag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User: 账号唯一
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Account)
            .IsUnique();

        // Tag: 名称唯一 + 使用计数排序
        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name)
            .IsUnique();

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.UsageCount);

        // Work: 创建时间排序 + 标题检索
        modelBuilder.Entity<Work>()
            .HasIndex(w => w.CreatedAt);

        // Part: 分类筛选
        modelBuilder.Entity<Part>()
            .HasIndex(p => p.Category);

        // ─── 多对多连接表联合主键与级联删除 ───

        // CharacterWork
        modelBuilder.Entity<CharacterWork>()
            .HasKey(cw => new { cw.CharacterId, cw.WorkId });
        modelBuilder.Entity<CharacterWork>()
            .HasOne(cw => cw.Character)
            .WithMany(c => c.CharacterWorks)
            .HasForeignKey(cw => cw.CharacterId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<CharacterWork>()
            .HasOne(cw => cw.Work)
            .WithMany(w => w.CharacterWorks)
            .HasForeignKey(cw => cw.WorkId)
            .OnDelete(DeleteBehavior.Cascade);

        // WorkPart
        modelBuilder.Entity<WorkPart>()
            .HasKey(wp => new { wp.WorkId, wp.PartId });
        modelBuilder.Entity<WorkPart>()
            .HasOne(wp => wp.Work)
            .WithMany(w => w.WorkParts)
            .HasForeignKey(wp => wp.WorkId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WorkPart>()
            .HasOne(wp => wp.Part)
            .WithMany(p => p.WorkParts)
            .HasForeignKey(wp => wp.PartId)
            .OnDelete(DeleteBehavior.Cascade);

        // CharacterTag
        modelBuilder.Entity<CharacterTag>()
            .HasKey(ct => new { ct.CharacterId, ct.TagId });
        modelBuilder.Entity<CharacterTag>()
            .HasOne(ct => ct.Character)
            .WithMany(c => c.CharacterTags)
            .HasForeignKey(ct => ct.CharacterId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<CharacterTag>()
            .HasOne(ct => ct.Tag)
            .WithMany(t => t.CharacterTags)
            .HasForeignKey(ct => ct.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        // WorkTag
        modelBuilder.Entity<WorkTag>()
            .HasKey(wt => new { wt.WorkId, wt.TagId });
        modelBuilder.Entity<WorkTag>()
            .HasOne(wt => wt.Work)
            .WithMany(w => w.WorkTags)
            .HasForeignKey(wt => wt.WorkId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WorkTag>()
            .HasOne(wt => wt.Tag)
            .WithMany(t => t.WorkTags)
            .HasForeignKey(wt => wt.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        // PartTag
        modelBuilder.Entity<PartTag>()
            .HasKey(pt => new { pt.PartId, pt.TagId });
        modelBuilder.Entity<PartTag>()
            .HasOne(pt => pt.Part)
            .WithMany(p => p.PartTags)
            .HasForeignKey(pt => pt.PartId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<PartTag>()
            .HasOne(pt => pt.Tag)
            .WithMany(t => t.PartTags)
            .HasForeignKey(pt => pt.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        // Media → Work 级联删除
        modelBuilder.Entity<Media>()
            .HasOne(m => m.Work)
            .WithMany(w => w.MediaItems)
            .HasForeignKey(m => m.WorkId)
            .OnDelete(DeleteBehavior.Cascade);

        // WorkAsset → Work 级联删除
        modelBuilder.Entity<WorkAsset>()
            .HasOne(a => a.Work)
            .WithMany(w => w.Assets)
            .HasForeignKey(a => a.WorkId)
            .OnDelete(DeleteBehavior.Cascade);

        // WorkAsset: 排序索引
        modelBuilder.Entity<WorkAsset>()
            .HasIndex(a => new { a.WorkId, a.SortOrder });
    }
}
