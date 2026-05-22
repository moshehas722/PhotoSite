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

export interface FolderTreeNode {
  id: string;
  name: string;
  children: FolderTreeNode[];
}

export interface FolderContents {
  id: string;
  name: string;
  photos: Photo[];
  folders: Folder[];
  /** 'root' if the parent is the Drive root, otherwise the real folder ID */
  parentId?: string;
  parentName?: string;
}
