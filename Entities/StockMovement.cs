using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyInventory.API.Entities;

[Table("StockMovements")]
public class StockMovement
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey(nameof(Batch))]
    public int BatchId { get; set; }

    [Required]
    [StringLength(20)]
    public string Type { get; set; } = null!; // PURCHASE, SALE, ADJUSTMENT, EXPIRED

    [Required]
    public int Quantity { get; set; } // Signed: +entry / -exit

    [StringLength(200)]
    public string? Reason { get; set; }

    [Required]
    [ForeignKey(nameof(User))]
    public int UserId { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign keys
    public Batch Batch { get; set; } = null!;
    public User User { get; set; } = null!;
}