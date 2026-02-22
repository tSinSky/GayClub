export interface Session {
  id: string;
  title: string;
  year: number;
  genre: string;
  date: string;
  host: string;
  posterUrl: string;
  backdropUrl: string;
  director?: string;
  runtime?: string;
  sections: SessionSection[];
  published: boolean;
}

export interface SessionSection {
  id: string;
  type: 'director' | 'cinematography' | 'influence' | 'themes' | 'facts';
  enabled: boolean;
  content: SectionContent;
}

export interface SectionContent {
  text: string;
  images?: string[];
  videos?: VideoEmbed[];
  quotes?: Quote[];
  cards?: FactCard[];
  director?: DirectorInfo;
}

export interface DirectorInfo {
  name: string;
  photo: string;
  bio: string;
  filmography: Film[];
}

export interface Film {
  title: string;
  year: number;
  posterUrl: string;
}

export interface VideoEmbed {
  url: string;
  platform: 'youtube' | 'vimeo';
  title?: string;
}

export interface Quote {
  text: string;
  author?: string;
  imageUrl?: string;
}

export interface FactCard {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface RatingCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface Rating {
  sessionId: string;
  userId: string;
  ratings: {
    [categoryId: string]: number; // 1-5 stars
  };
  timestamp: string;
}
