export interface User {
  id: string;
  name: string;
  email: string;
  college?: string;
  company?: string;
  role?: string;
  bio?: string;
  profilePic?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}
