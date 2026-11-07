import { MetricDefinition } from "@/components/dashboard/metric-definition";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ActiveSemesterRow = {
  semester: string;
  label: string;
  official_members: number;
  active_members: number;
  active_rate: number | null;
};

type ActiveMembersBySemesterProps = {
  rows: ActiveSemesterRow[];
  definition: string;
  methodologyHref?: string;
};

export function ActiveMembersBySemester({
  rows,
  definition,
  methodologyHref,
}: ActiveMembersBySemesterProps) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Active Members by Semester</CardTitle>
        <CardDescription>Official members · Each semester</CardDescription>
      </CardHeader>
      <CardContent className="max-h-64 overflow-y-auto">
        <Table aria-label="Active members and active rate by semester">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Semester</TableHead>
              <TableHead scope="col" className="text-right">Active members</TableHead>
              <TableHead scope="col" className="text-right">Active rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? rows.map((row) => (
              <TableRow key={row.semester}>
                <TableHead scope="row" className="font-normal">{row.label}</TableHead>
                <TableCell className="text-right tabular-nums">{row.active_members.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.active_rate == null ? (
                    <span aria-label="Not applicable: no official members">N/A</span>
                  ) : `${row.active_rate.toFixed(1)}%`}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 whitespace-normal text-center text-muted-foreground">
                  No semester data is available yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="mt-auto">
        <MetricDefinition
          title="Active Members by Semester"
          definition={definition}
          methodologyHref={methodologyHref}
        />
      </CardFooter>
    </Card>
  );
}
