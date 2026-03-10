export default function MovieHeader({ movie, reviewCount }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
      {movie.poster_url ? (
        <img
          src={`${movie.poster_url}`}
          alt={movie.title}
          className="w-20 rounded"
        />
      ) : (
        <div className="w-20 h-28 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
          No poster
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-white">{movie.title}</h2>
        <p className="text-gray-400 text-sm">{movie.release_year}</p>
        <p className="text-yellow-400 text-sm mt-1">
          ★ {movie.tmdb_rating?.toFixed(1)}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Based on {reviewCount} reviews
        </p>
      </div>
    </div>
  );
}
