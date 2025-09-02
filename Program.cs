using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Watchly.Api.Data;
using Watchly.Api.Models;
using Watchly.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Load .env only in Development
if (builder.Environment.IsDevelopment())
{
    if (File.Exists(Path.Combine(builder.Environment.ContentRootPath, ".env")))
    {
        Env.Load();
    }
}

// Build configuration values (env has precedence already)
string envPrefix(string key) => builder.Environment.IsDevelopment() ? Environment.GetEnvironmentVariable("DEV_" + key) ?? string.Empty : Environment.GetEnvironmentVariable(key) ?? string.Empty;

string host = envPrefix("POSTGRES_HOST");
string db = envPrefix("POSTGRES_DB");
string user = envPrefix("POSTGRES_USER");
string password = envPrefix("POSTGRES_PASSWORD");
string sslMode = envPrefix("POSTGRES_SSL_MODE");

var connectionString = $"Host={host};Database={db};Username={user};Password={password};Ssl Mode={sslMode};";
if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(db))
    throw new Exception("Database environment variables not set. Check .env or environment.");

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? builder.Configuration["JWT_SECRET"];
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    throw new Exception("JWT_SECRET missing or too short (need >=32 chars, recommended 64+).");

// Services
builder.Services.AddDbContext<WatchlyDbContext>(opt => opt.UseNpgsql(connectionString));
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<WatchlyDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:4173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["jwt"];
            if (!string.IsNullOrEmpty(token)) context.Token = token;
            return Task.CompletedTask;
        }
    };
});

builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.HttpOnly = true;
    o.Cookie.SameSite = SameSiteMode.None;
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<WatchlyDbContext>();
    // Apply migrations (user acknowledged DB may not be up yet)
    dbContext.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.None,
    HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always,
    Secure = CookieSecurePolicy.Always
});

app.UseCors("AllowLocalDev");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
