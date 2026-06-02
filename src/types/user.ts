export interface User {
  _id: string;
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  jobTitle?: string;
  country?: string;
  address?: string;
  dateOfBirth?: Date;
  profilePicture?: string;
  role?: string;
  settings?: {
    notificationTypes?: {
      task?: boolean;
      comment?: boolean;
      project?: boolean;
      system?: boolean;
      email?: boolean;
    };
  };
  externalAccounts?: {
    google?: {
      email?: string;
    };
    zoom?: {
      zoomId?: string;
    };
  };
}