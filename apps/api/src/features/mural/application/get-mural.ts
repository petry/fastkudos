import type { Feedback } from '@fastkudos/shared';
import type { MuralRepo } from '../domain/ports';

export interface GetMuralDeps {
  mural: MuralRepo;
}

export interface GetMuralCommand {
  callerEventId: string;
}

export async function getMural(deps: GetMuralDeps, cmd: GetMuralCommand): Promise<Feedback[]> {
  return deps.mural.listByEvent(cmd.callerEventId);
}
