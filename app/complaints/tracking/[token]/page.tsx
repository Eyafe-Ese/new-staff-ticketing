import { AnonymousComplaintComments } from "./AnonymousComplaintComments";

// Use the correct Next.js page props type
type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AnonymousComplaintPage({ params, searchParams }: Props) {
  const [{ token }] = await Promise.all([params, searchParams]);
  return <AnonymousComplaintComments token={token} />;
} 