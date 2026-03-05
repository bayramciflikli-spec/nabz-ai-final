export interface Project {
  id: string;
  title: string;
  category: string;
  tool?: string;
  description: string;
  thumbnail: string;
  demoUrl: string;
  createdAt: Date;
}
