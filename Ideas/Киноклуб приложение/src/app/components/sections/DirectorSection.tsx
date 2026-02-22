import { SectionContent } from '../../types';

interface Props {
  content: SectionContent;
}

export default function DirectorSection({ content }: Props) {
  const { text, director } = content;

  return (
    <div className="space-y-8">
      {text && (
        <p className="text-lg text-zinc-300 leading-relaxed">{text}</p>
      )}

      {director && (
        <div className="mt-10">
          {/* Director Info */}
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div className="flex-shrink-0">
              <img
                src={director.photo}
                alt={director.name}
                className="w-48 h-48 rounded-lg object-cover ring-1 ring-white/10"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl mb-3">{director.name}</h3>
              <p className="text-zinc-400 leading-relaxed">{director.bio}</p>
            </div>
          </div>

          {/* Filmography */}
          {director.filmography && director.filmography.length > 0 && (
            <div>
              <h4 className="text-xl mb-4 text-zinc-300">Избранная фильмография</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {director.filmography.map((film, index) => (
                  <div
                    key={index}
                    className="group cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-lg mb-2">
                      <img
                        src={film.posterUrl}
                        alt={film.title}
                        className="w-full aspect-[2/3] object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-zinc-300 group-hover:text-amber-400 transition-colors">
                      {film.title}
                    </p>
                    <p className="text-xs text-zinc-600">{film.year}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
