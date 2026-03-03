import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectResolutionService } from './project-resolution.service';

@Module({
  imports: [PrismaModule],
  providers: [ProjectResolutionService],
  exports: [ProjectResolutionService],
})
export class ProjectsModule {}