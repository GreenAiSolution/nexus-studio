import { redirect } from 'next/navigation';

// The studio is the front door — no sign-in required. Visiting the root goes
// straight into the experience. The optional sign-in lives at /sign-in.
export default function Home() {
  redirect('/studio');
}
