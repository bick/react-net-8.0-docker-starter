using Microsoft.EntityFrameworkCore; 
using StarterAPI.Models;

namespace StarterAPI.Data
{
    public class StarterAPIContext : DbContext
    {
        // Constructor for the context, accepting DbContextOptions to configure the context
        public StarterAPIContext(DbContextOptions<StarterAPIContext> options)
            : base(options)
        {
        }

        // DbSet property representing the Organization table in the database
        public DbSet<Organization> Organization { get; set; }

        // Configuring the model using the Fluent API
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Mapping the Organization entity to the "Organization" table in the "dbo" schema
            modelBuilder.Entity<Organization>().ToTable("Organization", "dbo");
        }
    }
}