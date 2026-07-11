using Microsoft.EntityFrameworkCore;
using PharmacyInventory.API.Entities;

namespace PharmacyInventory.API.Data;

public class PharmacyDbContext : DbContext
{
    public PharmacyDbContext(DbContextOptions<PharmacyDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Batch> Batches { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleItem> SaleItems { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure decimal precision for currency fields
        modelBuilder.Entity<Product>()
            .Property(p => p.UnitPrice)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Batch>()
            .Property(b => b.CostPrice)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Sale>()
            .Property(s => s.Total)
            .HasPrecision(10, 2);

        modelBuilder.Entity<SaleItem>()
            .Property(si => si.UnitPrice)
            .HasPrecision(10, 2);

        // Configure relationships
        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Supplier)
            .WithMany(s => s.Products)
            .HasForeignKey(p => p.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Batch>()
            .HasOne(b => b.Product)
            .WithMany(p => p.Batches)
            .HasForeignKey(b => b.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.User)
            .WithMany(u => u.Sales)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.Sale)
            .WithMany(s => s.SaleItems)
            .HasForeignKey(si => si.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.Batch)
            .WithMany(b => b.SaleItems)
            .HasForeignKey(si => si.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.Batch)
            .WithMany(b => b.StockMovements)
            .HasForeignKey(sm => sm.BatchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StockMovement>()
            .HasOne(sm => sm.User)
            .WithMany(u => u.StockMovements)
            .HasForeignKey(sm => sm.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure check constraints for enums
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();

        modelBuilder.Entity<StockMovement>()
            .Property(sm => sm.Type)
            .HasConversion<string>();

        // Add indexes for performance
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.Sku)
            .IsUnique();

        modelBuilder.Entity<Batch>()
            .HasIndex(b => b.ExpiryDate);

        modelBuilder.Entity<Batch>()
            .HasIndex(b => new { b.ProductId, b.LotNumber })
            .IsUnique();

        modelBuilder.Entity<Sale>()
            .HasIndex(s => s.CreatedAt);

        modelBuilder.Entity<StockMovement>()
            .HasIndex(sm => sm.CreatedAt);
    }
}