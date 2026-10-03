import NewWork from "./NewWork";

export default async function Page({ searchParams }: PageProps<"/new">) {
  const { agency } = await searchParams;
  const pre = typeof agency === "string" ? agency : undefined;
  return <NewWork key={pre ?? ""} preAgencyId={pre} />;
}
