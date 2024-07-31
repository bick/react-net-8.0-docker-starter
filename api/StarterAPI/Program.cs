using StarterAPI.Data;
using Microsoft.EntityFrameworkCore;
using StarterAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure the URL
builder.WebHost.UseUrls("http://*:8888");

// Add CORS from anywhere
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowOrigin", builder =>
    {
        builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// Add services to the container.
builder.Services.AddControllers();

// Configure the DbContext
builder.Services.AddDbContext<StarterAPIContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("StarterAPICon")));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use the CORS policy
app.UseCors("AllowOrigin");

app.UseAuthorization();

app.MapControllers();

app.Run();
