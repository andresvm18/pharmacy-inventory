# Testing & CI/CD

## Local Testing

Run tests before committing:

```powershell
.\run-tests.ps1
```

Or manually:

```powershell
dotnet test PharmacyInventory.Tests
```

## CI/CD Pipeline

GitHub Actions automatically:
- ✅ Builds on every push to `main` and `develop`
- ✅ Runs on all pull requests
- ✅ Executes all unit tests
- ✅ Reports results in PR

### Test Coverage

Current tests cover:
- **AuthService:** Login with valid/invalid credentials, non-existent users
- **SalesService:** FEFO batch selection, validation, error cases

### Adding New Tests

1. Create test file in `PharmacyInventory.Tests/Services/`
2. Use xUnit `[Fact]` for simple tests, `[Theory]` for parameterized
3. Use Moq for mocking dependencies
4. Run locally: `dotnet test`
5. Push — GitHub Actions runs automatically

### Test Results

After push, view test results:
- GitHub Actions tab → workflow run → Test Results
- Or download artifact with `.trx` file