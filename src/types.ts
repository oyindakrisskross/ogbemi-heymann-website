export type SiteSettings = {
  artistEmail: string;
  pressEmail: string;
  instagramUrl: string;
  cvFileUrl: string;
  catalogueFileUrl: string;
  airtable?: {
    baseId: string;
    tableName: string;
    hasApiKey: boolean;
  };
};

export type Artwork = {
  id: string | number;
  slug: string;
  title: string;
  year: string;
  dimensions: string;
  material: string;
  series: string;
  available: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
};

export type LocationDetails = {
  galleryName: string;
  streetAddress?: string;
  city: string;
  state?: string;
  country: string;
};

export type DownloadableFile = {
  id: string | number;
  label: string;
  fileUrl: string;
  fileType?: string;
  context?: string;
};

export type Exhibition = {
  id: string | number;
  slug: string;
  title: string;
  startDate: string;
  endDate: string;
  location: LocationDetails;
  excerpt: string;
  description: string;
  headliningImageUrl: string;
  works: Artwork[];
  materials: DownloadableFile[];
};

export type ContentBlock = {
  id: string;
  type: "paragraph" | "image" | "quote";
  value: string;
  caption?: string;
  imageWidth?: number;
  imageAlign?: "full" | "center" | "left" | "right";
};

export type BlogPost = {
  id: string | number;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  content: ContentBlock[];
  isPublished: boolean;
  publishedAt?: string;
};

export type PaginatedWorks = {
  items: Artwork[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type WorksMetadata = {
  years: string[];
  series: string[];
  sizes: string[];
};

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  artworkTitle?: string;
  source?: string;
};

export type DashboardStats = {
  exhibitionCount: number;
  postCount: number;
  contactCount: number;
  subscriberCount: number;
};
