using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyInventory.API.Entities;

[Table("SaleItems")]
public class SaleItem
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey(nameof(Sale))]
    public int SaleId { get; set; }

    [Required]
    [ForeignKey(nameof(Batch))]
    public int BatchId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal UnitPrice { get; set; } // Snapshot of price at time of sale

    // Foreign keys
    public Sale Sale { get; set; } = null!;
    public Batch Batch { get; set; } = null!;
}