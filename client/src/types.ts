export interface Photo {
  id: string;
  name: string;
  mimeType: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface FolderContents {
  id: string;
  name: string;
  photos: Photo[];
  folders: Folder[];
}
