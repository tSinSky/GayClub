import { Session } from '../types';

export function initializeMockData(): void {
  const sessions = localStorage.getItem('cinema_club_sessions');
  if (!sessions) {
    const mockSession: Session = {
      id: '1',
      title: 'Blade Runner 2049',
      year: 2017,
      genre: 'Научная фантастика, Нео-нуар',
      date: '2026-03-01',
      host: 'Александр',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
      backdropUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200',
      director: 'Дени Вильнёв',
      runtime: '164 мин',
      published: true,
      sections: [
        {
          id: 'director',
          type: 'director',
          enabled: true,
          content: {
            text: 'Дени Вильнёв — канадский режиссёр, известный своим визуальным стилем и глубокими философскими темами. Его фильмы исследуют природу человечества, память и восприятие реальности.',
            director: {
              name: 'Дени Вильнёв',
              photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
              bio: 'Дени Вильнёв родился в Квебеке в 1967 году. Начинал карьеру с независимого кино, постепенно став одним из самых влиятельных режиссёров современности.',
              filmography: [
                {
                  title: 'Прибытие',
                  year: 2016,
                  posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=200',
                },
                {
                  title: 'Дюна',
                  year: 2021,
                  posterUrl: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=200',
                },
                {
                  title: 'Враг',
                  year: 2013,
                  posterUrl: 'https://images.unsplash.com/photo-1574267432644-f371a5bb90b8?w=200',
                },
              ],
            },
          },
        },
        {
          id: 'cinematography',
          type: 'cinematography',
          enabled: true,
          content: {
            text: 'Оператор Роджер Дикинс создал незабываемую визуальную атмосферу через использование тумана, неона и контрастного освещения. Каждый кадр — произведение искусства.',
            images: [
              'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600',
              'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600',
              'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600',
            ],
            videos: [
              {
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                platform: 'youtube',
                title: 'Анализ операторской работы',
              },
            ],
          },
        },
        {
          id: 'influence',
          type: 'influence',
          enabled: true,
          content: {
            text: 'Blade Runner 2049 переосмыслил научно-фантастическое кино, вернув фокус на визуальное повествование и философские вопросы. Фильм повлиял на эстетику множества последующих проектов, от киберпанк-игр до музыкальных клипов.\n\nИсторический контекст: Вышедший спустя 35 лет после оригинального Blade Runner, фильм отразил современные тревоги о климате, памяти и идентичности в эпоху цифровых технологий.',
          },
        },
        {
          id: 'themes',
          type: 'themes',
          enabled: true,
          content: {
            text: 'Фильм исследует темы памяти, человечности и что значит быть "настоящим". Символизм воды, дерева и пчёл подчёркивает вопросы о жизни и воспроизводстве.',
            quotes: [
              {
                text: 'Умереть за правое дело — самая человечная вещь, которую мы можем сделать.',
                author: 'Лав',
                imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
              },
              {
                text: 'Все лучшие воспоминания — обман.',
                author: 'Ана Стеллайн',
              },
            ],
          },
        },
        {
          id: 'facts',
          type: 'facts',
          enabled: true,
          content: {
            cards: [
              {
                title: 'Реальные декорации',
                description: 'Большинство сцен снято на реальных локациях с минимальным использованием CGI. Вильнёв предпочитает практические эффекты.',
                imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300',
              },
              {
                title: 'Роджер Дикинс и Оскар',
                description: 'После 13 номинаций Роджер Дикинс наконец получил Оскар за операторскую работу в этом фильме.',
              },
              {
                title: 'Миниатюры вместо CGI',
                description: 'Для сцен с городскими пейзажами использовались детализированные миниатюры, снятые специальными камерами.',
                imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300',
              },
            ],
          },
        },
      ],
    };

    localStorage.setItem('cinema_club_sessions', JSON.stringify([mockSession]));
  }
}
