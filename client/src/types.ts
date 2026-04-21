export interface Photo {
  id: string;
  name: string;
  mimeType: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface RecentFolder {
  id: string;
  name: string;
  createdTime: string;
}

export interface FolderContents {
  id: string;
  name: string;
  photos: Photo[];
  folders: Folder[];
  parentId?: string;
  parentName?: string;
}
