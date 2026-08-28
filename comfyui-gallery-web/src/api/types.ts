export interface AuthorInfo { id: string; name: string }

export interface MediaDto {
  id: string;
  url: string;
  type: 'image' | 'video';
  sortOrder: number;
  size: number;
}

export interface WorkAssetDto {
  id: string;
  type: string; // fbx | blend | zip | unitypackage
  fileUrl: string;
  downloadUrl: string;
  previewUrl?: string | null;
  originalName: string;
  sortOrder: number;
  size: number;
}

export interface WorkListItem {
  id: string;
  title: string;
  type: string; // 2d | 3d
  intro?: string | null;
  coverUrl?: string | null;
  hasVideo: boolean;
  has3d: boolean;
  tags: string[];
  author: AuthorInfo;
  mediaCount: number;
  createdAt: string;
}

export interface CharacterRef { id: string; name: string; previewUrl?: string | null }
export interface PartRef { id: string; name: string; category: string; previewUrl?: string | null }

export interface WorkDetail {
  id: string;
  title: string;
  type: string; // 2d | 3d
  prompt: string;
  intro?: string | null;
  workflowJson?: string | null;
  coverUrl?: string | null;
  mediaItems: MediaDto[];
  assets: WorkAssetDto[];
  tags: string[];
  characters: CharacterRef[];
  parts: PartRef[];
  author: AuthorInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterListItem {
  id: string;
  name: string;
  intro?: string | null;
  previewUrl?: string | null;
  tags: string[];
  workCount: number;
  createdAt: string;
}

export interface CharacterDetail {
  id: string;
  name: string;
  prompt: string;
  intro?: string | null;
  previewUrl?: string | null;
  tags: string[];
  works: WorkListItem[];
  author: AuthorInfo;
  createdAt: string;
  updatedAt: string;
}

export interface PartListItem {
  id: string;
  name: string;
  category: string;
  intro?: string | null;
  previewUrl?: string | null;
  tags: string[];
  usedByCount: number;
  createdAt: string;
}

export interface PartDetail {
  id: string;
  name: string;
  category: string;
  prompt: string;
  intro?: string | null;
  previewUrl?: string | null;
  tags: string[];
  usedByCount: number;
  author: AuthorInfo;
  createdAt: string;
  updatedAt: string;
}

export interface HotTag { id: string; name: string; usageCount: number }

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UserInfo { id: string; account: string; userName: string }
export interface AuthResponse { token: string; user: UserInfo }

export type Tab = 'works' | 'characters' | 'parts';
