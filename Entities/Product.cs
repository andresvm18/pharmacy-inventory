using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyInventory.API.Entities;

[Table("Products")]
public class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(30)]
    public string Sku { get; set; } = null!;

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = null!;

    [StringLength(int.MaxValue)]
    public string? Description { get; set; }

    [Required]
    [ForeignKey(nameof(Category))]
    public int CategoryId { get; set; }

    [Required]
    [ForeignKey(nameof(Supplier))]
    public int SupplierId { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal UnitPrice { get; set; }

    [Required]
    public int MinStock { get; set; } = 10;

    [Required]
    public bool RequiresRx { get; set; } = false;

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign keys
    public Category Category { get; set; } = null!;
    public Supplier Supplier { get; set; } = null!;

    // Navigation property
    public ICollection<Batch> Batches { get; set; } = new List<Batch>();
}