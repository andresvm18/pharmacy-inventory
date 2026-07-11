using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyInventory.API.Entities;

[Table("Suppliers")]
public class Supplier
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(120)]
    public string Name { get; set; } = null!;

    [StringLength(30)]
    public string? Phone { get; set; }

    [StringLength(120)]
    public string? Email { get; set; }

    // Navigation property
    public ICollection<Product> Products { get; set; } = new List<Product>();
}