"use client";

import { getTopicCategory, type TopicCategory } from "@/lib/illustrations";
import ScienceSVG from "./illustrations/ScienceSVG";
import NatureSVG from "./illustrations/NatureSVG";
import MathSVG from "./illustrations/MathSVG";
import TechSVG from "./illustrations/TechSVG";
import HistorySVG from "./illustrations/HistorySVG";
import EconomicsSVG from "./illustrations/EconomicsSVG";
import HealthSVG from "./illustrations/HealthSVG";
import DefaultSVG from "./illustrations/DefaultSVG";

interface TopicIllustrationProps {
  topic: string;
  color?: string;
  className?: string;
}

const CATEGORY_COMPONENTS: Record<TopicCategory, React.FC<{ color?: string }>> = {
  science: ScienceSVG,
  nature: NatureSVG,
  math: MathSVG,
  tech: TechSVG,
  history: HistorySVG,
  economics: EconomicsSVG,
  health: HealthSVG,
  default: DefaultSVG,
};

export default function TopicIllustration({ topic, color, className }: TopicIllustrationProps) {
  const category = getTopicCategory(topic);
  const Component = CATEGORY_COMPONENTS[category];

  return (
    <div className={className}>
      <Component color={color} />
    </div>
  );
}
