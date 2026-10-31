import { Brain, Briefcase, Coins, Cpu, Wallet, type LucideProps } from "lucide-react";
import type { Category } from "@/content/categories";

const map = { coins: Coins, wallet: Wallet, cpu: Cpu, brain: Brain, briefcase: Briefcase };

export function CategoryIcon({ name, ...props }: { name: Category["icon"] } & LucideProps) {
  const Icon = map[name];
  return <Icon strokeWidth={1.75} aria-hidden {...props} />;
}
