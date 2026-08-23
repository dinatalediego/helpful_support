import { ApiExperienceLab } from "@/components/api-experience-lab";
import { LabProvider } from "@/components/lab-provider";

export default function Home() {
  return (
    <LabProvider>
      <ApiExperienceLab />
    </LabProvider>
  );
}
