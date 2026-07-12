# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY PharmacyInventory.API/PharmacyInventory.API.csproj PharmacyInventory.API/
RUN dotnet restore PharmacyInventory.API/PharmacyInventory.API.csproj

COPY PharmacyInventory.API/ PharmacyInventory.API/
WORKDIR /src/PharmacyInventory.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "PharmacyInventory.API.dll"]