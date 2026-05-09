import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectProfile } from '../shared';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() data: Omit<ProjectProfile, 'id'>): Promise<ProjectProfile> {
    return this.projectsService.createProject(data);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ProjectProfile> {
    return this.projectsService.getProject(id);
  }

  @Get()
  async list(): Promise<ProjectProfile[]> {
    return this.projectsService.listProjects();
  }
}
