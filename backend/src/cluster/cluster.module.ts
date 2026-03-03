import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ClusterService } from './cluster.service';
import { RebalanceService } from './rebalance.service';

@Module({
  imports: [PrismaModule, ProjectsModule],
  providers: [ClusterService, RebalanceService],
  exports: [ClusterService, RebalanceService],
})
export class ClusterModule {}