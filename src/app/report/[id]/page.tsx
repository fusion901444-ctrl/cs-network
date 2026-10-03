import Report from "./Report";

export default async function Page({ params, searchParams }: PageProps<"/report/[id]">) {
  const { id } = await params;
  const { m } = await searchParams;
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) ? m : undefined;
  return <Report key={`${id}-${month}`} id={id} month={month} />;
}
