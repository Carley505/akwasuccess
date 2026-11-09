import {
  Brain,
  Briefcase,
  Coins,
  Cpu,
  Megaphone,
  Wallet,
  type LucideProps,
} from "lucide-react";
import type { Category } from "@/content/categories";

const map = {
  coins: Coins,
  wallet: Wallet,
  cpu: Cpu,
  brain: Brain,
  megaphone: Megaphone,
  briefcase: Briefcase,
};

export function CategoryIcon({ name, ...props }: { name: Category["icon"] } & LucideProps) {
  const Icon = map[name];
  return <Icon strokeWidth={1.75} aria-hidden {...props} />;
}
