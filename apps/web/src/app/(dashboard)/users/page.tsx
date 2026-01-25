import { redirect } from "next/navigation";
import UsersTable from "./users-table"
import { getAllUsers, getUserRole } from "@/lib/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UsersPage() {
  const users = await getAllUsers()
  const result = await getUserRole();
  
  if(!result) {
    return redirect("/");
  }

  const { data } = result;

  if (!data.id) {
    return redirect('/');
  }

  const isAdmin = data && data.role === "admin";
  if (!isAdmin) {
    return redirect("/");;
  }

  return (
    <main className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 xl:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold sm:text-3xl">Users</h1>
            <p className="text-sm text-muted-foreground">
              Manage access, roles, and visibility for your dashboard.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {users.length} total users
          </div>
        </div>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base sm:text-lg">Directory</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <UsersTable data={users} id={data.id} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
