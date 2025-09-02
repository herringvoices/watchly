namespace Watchly.Api.DTOs;

public class LoginDto    { public string Email {get;set;} = ""; public string Password {get;set;} = ""; }
public class RegisterDto { public string UserName {get;set;} = ""; public string Email {get;set;} = ""; public string Password {get;set;} = ""; public string FirstName {get;set;} = ""; public string LastName {get;set;} = ""; }
public class AuthResultDto { public bool Success {get;set;} public string Message {get;set;} = ""; public UserDto? User {get;set;} }
