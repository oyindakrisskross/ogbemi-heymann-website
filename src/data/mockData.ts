import type { Artwork, BlogPost, DownloadableFile, Exhibition, SiteSettings } from "../types";

export const mockSettings: SiteSettings = {
  artistEmail: "ogbemi.heymann@example.com",
  pressEmail: "press@example.com",
  instagramUrl: "https://www.instagram.com/",
  cvFileUrl: "/downloads/ogbemi-heymann-cv.txt",
  catalogueFileUrl: "/downloads/available-works-catalogue.txt"
};

const artworkSeed: [string, string, string, string, string, string, boolean, string][] = [
  ["desire-iii", "Desire III", "2022", "36 x 48 in", "Oil on canvas", "Communal Living", true, "/assets/art-01.svg"],
  ["room-mates-4", "Room-mates 4", "2011", "48 x 60 in", "Acrylic on canvas", "Interior Studies", true, "/assets/art-04.svg"],
  ["chairman-1", "Chairman 1", "2013", "30 x 42 in", "Acrylic on canvas", "Governance", true, "/assets/art-07.svg"],
  ["solitude", "Solitude", "2007", "28 x 36 in", "Oil on canvas", "Quiet Rooms", true, "/assets/art-08.svg"],
  ["homeward-tide", "Homeward Tide", "1993", "54 x 72 in", "Oil on canvas", "Waterways", true, "/assets/art-06.svg"],
  ["market-memory", "Market Memory", "2019", "36 x 48 in", "Mixed media", "Resource Politics", true, "/assets/art-03.svg"],
  ["resource-table", "Resource Table", "2024", "40 x 50 in", "Oil on canvas", "Resource Politics", false, "/assets/art-05.svg"],
  ["public-silence", "Public Silence", "2018", "32 x 44 in", "Acrylic on canvas", "Governance", true, "/assets/art-09.svg"],
  ["red-corridor", "Red Corridor", "2021", "24 x 30 in", "Oil on panel", "Interior Studies", false, "/assets/art-10.svg"],
  ["after-council", "After Council", "2015", "46 x 54 in", "Acrylic on canvas", "Governance", true, "/assets/art-11.svg"],
  ["shared-floor", "Shared Floor", "2020", "48 x 48 in", "Oil on canvas", "Communal Living", true, "/assets/art-02.svg"],
  ["boat-study", "Boat Study", "1998", "22 x 30 in", "Oil on canvas", "Waterways", false, "/assets/art-12.svg"],
  ["table-study", "Table Study", "2023", "32 x 36 in", "Mixed media", "Resource Politics", true, "/assets/art-01.svg"],
  ["sleeping-room", "Sleeping Room", "2016", "36 x 36 in", "Acrylic on canvas", "Communal Living", false, "/assets/art-04.svg"],
  ["civic-room", "Civic Room", "2025", "42 x 54 in", "Oil on canvas", "Governance", true, "/assets/art-07.svg"]
];

export const mockWorks: Artwork[] = artworkSeed.map(
  ([slug, title, year, dimensions, material, series, available, imageUrl]) => ({
  id: slug,
  slug,
  title,
  year,
  dimensions,
  material,
  series,
  available,
  imageUrl
})
);

export const mockFiles: DownloadableFile[] = [
  { id: 1, label: "Artist CV", fileUrl: mockSettings.cvFileUrl, context: "cv" },
  { id: 2, label: "Available Works Catalogue", fileUrl: mockSettings.catalogueFileUrl, context: "catalogue" }
];

export const mockExhibitions: Exhibition[] = [
  {
    id: 1,
    slug: "cartographies-of-the-common",
    title: "Cartographies of the Common",
    startDate: "2026-04-10",
    endDate: "2026-06-10",
    location: {
      galleryName: "The Yard",
      streetAddress: "12 Broad Street",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria"
    },
    excerpt: "A focused presentation of paintings that examine shared space and collective memory.",
    description:
      "This exhibition gathers recent works around scenes of public life, interior negotiation, and the social patterns that shape communal experience.",
    headliningImageUrl: "/assets/art-02.svg",
    works: mockWorks.slice(0, 6),
    materials: [{ id: 1, label: "Press Release", fileUrl: mockSettings.catalogueFileUrl }]
  },
  {
    id: 2,
    slug: "wonds-and-rivals",
    title: "Wonds and Rivals",
    startDate: "2026-11-01",
    endDate: "2026-12-29",
    location: {
      galleryName: "Sino Gallery",
      streetAddress: "21 Marina Road",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria"
    },
    excerpt: "A survey of new paintings on rivalry, repair, and the contested public square.",
    description:
      "New large-scale canvases bring vivid figurative tension into contact with questions of governance, accountability, and civic imagination.",
    headliningImageUrl: "/assets/art-07.svg",
    works: mockWorks.slice(4, 12),
    materials: [{ id: 2, label: "Exhibition Catalogue", fileUrl: mockSettings.catalogueFileUrl }]
  },
  {
    id: 3,
    slug: "sharing-the-harvest",
    title: "Sharing the Harvest",
    startDate: "2024-05-03",
    endDate: "2024-06-18",
    location: {
      galleryName: "Nike Gallery",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria"
    },
    excerpt: "Paintings on abundance, scarcity, and the fragile terms of shared prosperity.",
    description:
      "The works trace how abundance can become contested material, moving between domestic interiors, public markets, and symbolic landscapes.",
    headliningImageUrl: "/assets/art-05.svg",
    works: mockWorks.slice(6, 14),
    materials: []
  },
  {
    id: 4,
    slug: "chairman",
    title: "Chairman",
    startDate: "2023-09-01",
    endDate: "2023-10-21",
    location: {
      galleryName: "Sino Gallery",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria"
    },
    excerpt: "A body of work studying power as performance and routine.",
    description:
      "In this exhibition, leadership appears through gestures, rooms, thresholds, and repeated rituals of authority.",
    headliningImageUrl: "/assets/art-09.svg",
    works: mockWorks.slice(0, 8),
    materials: []
  },
  {
    id: 5,
    slug: "quiet-rooms",
    title: "Quiet Rooms",
    startDate: "2022-02-05",
    endDate: "2022-03-30",
    location: {
      galleryName: "Independent Space",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria"
    },
    excerpt: "Intimate paintings about rest, pressure, and interior life.",
    description:
      "The exhibition turns to the private room as a charged site where larger social forces become visible.",
    headliningImageUrl: "/assets/art-04.svg",
    works: mockWorks.slice(2, 10),
    materials: []
  }
];

export const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "satire-as-a-tool-for-social-examination",
    title: "Satire as a Tool for Social Examination",
    excerpt:
      "On why satire remains useful to painting when public life becomes theatrical and difficult to name directly.",
    coverImageUrl: "/assets/art-03.svg",
    publishedAt: "2026-01-15T10:00:00.000Z",
    isPublished: true,
    content: [
      { id: "p1", type: "paragraph", value: "Satire lets a painter compress public behavior into a form that can be read slowly. It does not flatten the subject; it makes contradiction visible." },
      { id: "p2", type: "paragraph", value: "In my practice, satire works as pressure. It brings gestures, postures, and rooms into the same argument, asking how power circulates in ordinary scenes." },
      { id: "i1", type: "image", value: "/assets/art-03.svg", caption: "Study for a crowded public scene." },
      { id: "p3", type: "paragraph", value: "The painting has to hold attention long enough for recognition to become uneasy. That unease is productive because it returns the viewer to the world outside the frame." }
    ]
  },
  {
    id: 2,
    slug: "between-observation-and-interpretation",
    title: "Between Observation and Interpretation: Notes from Practice",
    excerpt:
      "A note on the movement between looking closely, inventing structure, and allowing a painting to argue back.",
    coverImageUrl: "/assets/art-10.svg",
    publishedAt: "2026-02-20T10:00:00.000Z",
    isPublished: true,
    content: [
      { id: "p1", type: "paragraph", value: "Observation begins with attention, but interpretation begins when attention meets memory. I am interested in the moment where a scene stops being documentary and starts becoming structural." },
      { id: "i1", type: "image", value: "/assets/art-10.svg", caption: "Studio image placeholder." },
      { id: "p2", type: "paragraph", value: "Painting gives me a way to test that structure. Color, weight, and distortion become tools for thinking through social pressure." },
      { id: "p3", type: "paragraph", value: "The finished work should feel specific without becoming closed. It should leave room for the viewer to complete the tension." }
    ]
  },
  {
    id: 3,
    slug: "revisiting-communal-living",
    title: "Revisiting Communal Living in Contemporary Society",
    excerpt:
      "A reflection on shared space, negotiation, and the cost of individualism in contemporary urban life.",
    coverImageUrl: "/assets/art-04.svg",
    publishedAt: "2026-03-03T10:00:00.000Z",
    isPublished: true,
    content: [
      { id: "p1", type: "paragraph", value: "Communal living is not nostalgia for me. It is a live question about protection, friction, generosity, and power." },
      { id: "p2", type: "paragraph", value: "When figures share a room in my paintings, the space between them carries as much information as the figures themselves." }
    ]
  }
];
