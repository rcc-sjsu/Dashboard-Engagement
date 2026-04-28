import type { ReactNode } from "react";
import {
  CalendarDays,
  Dumbbell,
  HandHeart,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import {
  AuthClubGrowthChart,
  AuthGrowthChannelsChart,
} from "@/components/auth/auth-floating-charts";

type Props = {
  children: React.ReactNode;
};

type StatCardProps = {
  icon: ReactNode;
  value: string;
  title: string;
  change: string;
};

function StatCard({ icon, value, title, change }: StatCardProps) {
  return (
    <div className="w-[210px] rounded-3xl border border-foreground/10 bg-background px-4 py-3 shadow-[0_14px_34px_-28px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
        <div className="text-xs font-medium text-emerald-600">{change}</div>
      </div>
      <div className="mt-3 text-xl font-semibold">{value}</div>
      <p className="text-muted-foreground mt-1 text-xs">{title}</p>
    </div>
  );
}

const layout = ({ children }: Props) => {
  return (
    <main className="bg-background relative flex min-h-svh w-full flex-col items-center justify-center gap-6 overflow-hidden p-6 md:p-10">
      <div className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 -rotate-1 transition-transform duration-500 ease-out hover:translate-x-0 hover:translate-y-0 hover:rotate-0 md:top-10 md:-translate-x-1/4 md:translate-y-0">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          value="1,284"
          title="Active members"
          change="+7.4%"
        />
      </div>

      <div className="pointer-events-auto absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 rotate-1 transition-transform duration-500 ease-out hover:translate-x-0 hover:translate-y-0 hover:rotate-0 md:top-8 md:translate-x-1/4 md:translate-y-0">
        <StatCard
          icon={<Ticket className="h-4 w-4" />}
          value="$42.8k"
          title="Ticket sales"
          change="+12.1%"
        />
      </div>

      <div className="pointer-events-auto absolute left-1/4 -top-6 hidden -translate-x-1/2 -rotate-2 transition-transform duration-500 ease-out hover:translate-y-2 hover:rotate-0 lg:block">
        <StatCard
          icon={<Dumbbell className="h-4 w-4" />}
          value="24.6 hrs"
          title="Training load"
          change="+3.2%"
        />
      </div>

      <div className="pointer-events-auto absolute right-1/4 -top-6 hidden translate-x-1/2 rotate-2 transition-transform duration-500 ease-out hover:translate-y-2 hover:rotate-0 lg:block">
        <StatCard
          icon={<CalendarDays className="h-4 w-4" />}
          value="18"
          title="Club events"
          change="+2 new"
        />
      </div>

      <div className="pointer-events-auto absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/3 -rotate-2 transition-transform duration-500 ease-out hover:translate-x-0 hover:rotate-0 md:bottom-40 md:-translate-x-1/4 md:translate-y-0">
        <StatCard
          icon={<HandHeart className="h-4 w-4" />}
          value="312"
          title="Volunteer hours"
          change="+14.8%"
        />
      </div>

      <div className="pointer-events-auto absolute -bottom-16 left-1/4 hidden -translate-x-1/2 rotate-5 transition-transform duration-500 ease-out hover:-translate-y-4 hover:rotate-0 lg:block">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          value="86%"
          title="Facility usage"
          change="+5.6%"
        />
      </div>

      <div className="pointer-events-auto absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 -rotate-2 transition-transform duration-500 ease-out hover:translate-x-0 hover:rotate-0 md:bottom-40 md:translate-x-1/4 md:translate-y-0">
        <StatCard
          icon={<Ticket className="h-4 w-4" />}
          value="9"
          title="Active sponsors"
          change="+3 pending"
        />
      </div>

      <div className="pointer-events-auto absolute -bottom-6 right-1/4 hidden translate-x-1/2 rotate-1 transition-transform duration-500 ease-out hover:-translate-y-3 hover:rotate-0 lg:block">
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          value="73%"
          title="Match win rate"
          change="+4.1%"
        />
      </div>

      <div className="pointer-events-auto absolute left-0 top-1/2 hidden w-[260px] -translate-x-1/4 -translate-y-1/2 rotate-1 transition-transform duration-500 ease-out hover:translate-x-0 hover:rotate-0 lg:block">
        <div className="origin-top-left scale-[0.72]">
          <AuthGrowthChannelsChart />
        </div>
      </div>

      <div className="pointer-events-auto absolute right-0 top-1/2 hidden w-[280px] translate-x-1/4 -translate-y-1/2 -rotate-1 transition-transform duration-500 ease-out hover:translate-x-0 hover:rotate-0 lg:block">
        <div className="origin-top-right scale-[0.68]">
          <AuthClubGrowthChart />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </main>
  );
};

export default layout;
