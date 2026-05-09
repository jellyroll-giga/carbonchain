import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProjectProfile } from '../shared';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  
  // In-memory storage until Day 7 (PostgreSQL setup)
  private projects: Map<string, ProjectProfile> = new Map();

  async createProject(data: Omit<ProjectProfile, 'id'>): Promise<ProjectProfile> {
    const id = `proj_${Math.random().toString(36).substring(2, 11)}`;
    const newProject: ProjectProfile = { ...data, id };
    this.projects.set(id, newProject);
    this.logger.log(`Project created with ID: ${id}`);
    return newProject;
  }

  async getProject(id: string): Promise<ProjectProfile> {
    const project = this.projects.get(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async listProjects(): Promise<ProjectProfile[]> {
    return Array.from(this.projects.values());
  }
}
