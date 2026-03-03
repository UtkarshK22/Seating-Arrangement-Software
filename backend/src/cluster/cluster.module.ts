import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ClusterService } from './cluster.service';

@Module({
  imports: [PrismaModule, ProjectsModule],
  providers: [ClusterService],
  exports: [ClusterService],
})
export class ClusterModule {}