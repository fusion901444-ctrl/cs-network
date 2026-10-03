import WorkDetail from "./WorkDetail";

export default async function Page({ params }: PageProps<"/w/[id]">) {
  const { id } = await params;
  return <WorkDetail key={id} id={id} />;
}
