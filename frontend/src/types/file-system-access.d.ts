// File System Access API type augmentations
// Extends TypeScript's DOM lib types with missing methods

declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }

  function showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

export {};
