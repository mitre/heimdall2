// All selectable export types for an HTML export
export enum FileExportTypes {
  Executive = 'Executive',
  Manager = 'Manager',
  Administrator = 'Administrator'
}

// All corresponding descriptions for export types
export enum FileExportDescriptions {
  Executive = 'Profile Info\nStatuses\nCompliance Level',
  Manager = 'Profile Info\nStatuses\nCompliance Level\nTest Results and Details',
  Administrator = 'Profile Info\nStatuses\nCompliance Level\nTest Results and Details\nTest Code'
}
