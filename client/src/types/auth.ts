export interface User {
  id: string;
  email: string;
  name: string;
}

// Define form structures for React Hook Form
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData extends LoginFormData {
  name: string;
}
