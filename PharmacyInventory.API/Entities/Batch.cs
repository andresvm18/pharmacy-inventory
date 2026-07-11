using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyInventory.API.Entities;

[Table("Batches")]
public class Batch
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey(nameof(Product))]
    public int ProductId { get; set; }

    [Required]
    [StringLength(40)]
    public string LotNumber { get; set; } = null!;

    [Required]
    public DateTime ExpiryDate { get; set; }

    [Required]
    public int Quantity { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal CostPrice { get; set; }

    [Required]
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    // Foreign key
    public Product Product { get; set; } = null!;

    // Navigation properties
    public ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
}