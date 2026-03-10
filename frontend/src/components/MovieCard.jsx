export default function MovieCard({ movie, onClick }) {
  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
      onClick={onClick}
    >
      {movie.poster_url ? (
        <img
          src={`${movie.poster_url}`}
          alt={movie.title}
          className="w-full aspect-[2/3] object-cover"
        />
      ) : (
        <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
          No poster
        </div>
      )}
      <div className="p-2">
        <p className="text-white text-sm font-medium truncate">{movie.title}</p>
        <p className="text-gray-400 text-xs mt-1">
          {movie.release_year} · ★ {movie.tmdb_rating?.toFixed(1)}
        </p>
      </div>
    </div>
  );
}
