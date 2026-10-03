import AgencyDetail from "./AgencyDetail";

export default async function Page({ params }: PageProps<"/a/[id]">) {
  const { id } = await params;
  return <AgencyDetail key={id} id={id} />;
}
