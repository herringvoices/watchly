namespace Watchly.Api.Models;

public enum MediaStatus
{
    CurrentlyWatching = 0,
    WantToWatch = 1,
    Hiatus = 2,
    Watched = 3,
    Dropped = 4
}

public enum WatchSessionLength
{
    Short = 1,
    Medium = 2,
    Long = 3
}
