import type { FormationProposalPageDto } from "@/types/api";
import { ProposalStageStatus } from "../shared/ProposalStageStatus";

type ProposalFormationStatusProps = {
  stageData: FormationProposalPageDto["stageData"];
};

export const ProposalFormationStatus: React.FC<ProposalFormationStatusProps> = ({
  stageData,
}) => {
  return <ProposalStageStatus title="Project status" stageData={stageData} />;
};
