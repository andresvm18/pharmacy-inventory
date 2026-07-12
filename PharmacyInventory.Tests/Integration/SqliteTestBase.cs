using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PharmacyInventory.API.Data;
using System;

namespace PharmacyInventory.Tests.Integration;

/// Base class for integration tests that need a real, relational EF Core provider.
/// Uses SQLite in-memory because InMemory does not enforce foreign keys, unique indexes, or transactions the same way
/// a real database does
/// SQLite gets us much closer to real SQL Server behavior
/// while still running fully in-process with no external dependency.
public abstract class SqliteTestBase : IDisposable
{
    private readonly SqliteConnection _connection;
    protected readonly PharmacyDbContext DbContext;

    protected SqliteTestBase()
    {
        // Keep-alive connection: an in-memory SQLite database only exists
        // as long as at least one connection to it stays open.
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<PharmacyDbContext>()
            .UseSqlite(_connection)
            .Options;

        DbContext = new PharmacyDbContext(options);
        DbContext.Database.EnsureCreated();
    }

    public void Dispose()
    {
        DbContext.Dispose();
        _connection.Dispose();
    }
}