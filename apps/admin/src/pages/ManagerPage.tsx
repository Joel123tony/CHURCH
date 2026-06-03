import { AnalyticsManager } from "../components/AnalyticsManager";
import { MediaManager } from "../components/MediaManager";
import { PrayerRequestsManager } from "../components/PrayerRequestsManager";
import { RecordManager, type FieldSpec } from "../components/RecordManager";
import { SectionManager } from "../components/SectionManager";
import { SettingsManager } from "../components/SettingsManager";

type Props = {
  slug: string;
};

type GenericRecord = Record<string, any>;

const pageFields: FieldSpec[] = [
  { name: "slug", label: "Slug", type: "text", placeholder: "about" },
  { name: "title", label: "Title", type: "text" },
  { name: "subtitle", label: "Subtitle", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "published", label: "Published", type: "checkbox" },
  { name: "visibleInNav", label: "Visible In Nav", type: "checkbox" }
];

const pastorFields: FieldSpec[] = [
  { name: "slug", label: "Slug", type: "text" },
  { name: "name", label: "Name", type: "text" },
  { name: "position", label: "Position", type: "text" },
  { name: "startYear", label: "Start Year", type: "number" },
  { name: "endYear", label: "End Year", type: "number" },
  { name: "biography", label: "Biography", type: "textarea" },
  { name: "mainPhoto", label: "Main Photo", type: "url" },
  { name: "galleryPhotos", label: "Gallery Photos CSV", type: "csv" },
  { name: "currentPastor", label: "Current Pastor", type: "checkbox" },
  { name: "youtubeChannelId", label: "YouTube Channel", type: "text" },
  { name: "youtubePlaylistId", label: "YouTube Playlist", type: "text" }
];

const eventFields: FieldSpec[] = [
  { name: "banner", label: "Banner", type: "url" },
  { name: "title", label: "Title", type: "text" },
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time", type: "text" },
  { name: "location", label: "Location", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "registrationLink", label: "Registration Link", type: "url" },
  { name: "archived", label: "Archived", type: "checkbox" }
];

const sermonFields: FieldSpec[] = [
  { name: "slug", label: "Slug", type: "text" },
  { name: "title", label: "Title", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "speaker", label: "Speaker", type: "text" },
  { name: "publishDate", label: "Publish Date", type: "date" },
  { name: "thumbnailUrl", label: "Thumbnail URL", type: "url" },
  { name: "videoUrl", label: "Video URL", type: "url" },
  { name: "youtubeVideoId", label: "YouTube Video ID", type: "text" },
  { name: "duration", label: "Duration", type: "text" },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "source", label: "Source", type: "select", options: ["youtube", "manual"] },
  { name: "liveRecording", label: "Live Recording", type: "checkbox" },
  { name: "tags", label: "Tags CSV", type: "csv" }
];

function ManagerPageBySlug({ slug }: Props) {
  switch (slug) {
    case "page-builder":
      return <RecordManager<GenericRecord> title="Page Builder" description="Create and manage editable public pages." endpoint="/api/pages" itemKey="slug" summaryKeys={["title", "description"]} fields={pageFields} />;
    case "section-builder":
      return <SectionManager />;
    case "media-manager":
      return <MediaManager />;
    case "event-manager":
      return <RecordManager<GenericRecord> title="Event Manager" description="Create events and archive completed items." endpoint="/api/events" itemKey="id" summaryKeys={["title", "location"]} fields={eventFields} />;
    case "sermon-manager":
      return <RecordManager<GenericRecord> title="Sermon Manager" description="Create featured sermons and archive recordings." endpoint="/api/sermons" itemKey="slug" summaryKeys={["title", "speaker"]} fields={sermonFields} />;
    case "pastor-manager":
      return <RecordManager<GenericRecord> title="Pastor Manager" description="Manage pastor profiles and timeline entries." endpoint="/api/pastors" itemKey="slug" summaryKeys={["name", "position"]} fields={pastorFields} />;
    case "gallery-manager":
      return <MediaManager />;
    case "prayer-request-manager":
      return <PrayerRequestsManager />;
    case "navbar-manager":
      return <SettingsManager title="Navbar Manager" description="Edit the visible navigation items and menu labels." />;
    case "footer-manager":
      return <SettingsManager title="Footer Manager" description="Update footer text, links, and social details." />;
    case "theme-manager":
      return <SettingsManager title="Theme Manager" description="Adjust colors, typography, banner imagery, and homepage layout." />;
    case "youtube-manager":
      return <SettingsManager title="YouTube Manager" description="Configure YouTube/channel settings used for live detection and sermon sync." />;
    case "analytics":
      return <AnalyticsManager />;
    default:
      return <RecordManager<GenericRecord> title="Content" description="Manage church content." endpoint="/api/pages" itemKey="slug" summaryKeys={["title"]} fields={pageFields} />;
  }
}

export function ManagerPage({ slug }: Props) {
  return <ManagerPageBySlug slug={slug} />;
}

